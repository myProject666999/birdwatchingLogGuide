const pool = require('../config/db');
const redisClient = require('../config/redis');
const debug = require('debug')('app:heatmap');

const getHeatmapData = async (req, res) => {
  const { period = 'month', city, province, radius, lat, lon } = req.query;

  try {
    let dateCondition = '';
    const params = [];

    if (period === 'week') {
      dateCondition = 'AND observation_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateCondition = 'AND observation_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateCondition = 'AND observation_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
    }

    if (province) {
      dateCondition += ' AND province = ?';
      params.push(province);
    }
    if (city) {
      dateCondition += ' AND city = ?';
      params.push(city);
    }

    const [locationStats] = await pool.query(
      `SELECT 
        location_name,
        COALESCE(latitude, 0) as latitude,
        COALESCE(longitude, 0) as longitude,
        province,
        city,
        COUNT(DISTINCT species_id) as species_count,
        COUNT(*) as observation_count,
        SUM(count) as total_birds
       FROM observations 
       WHERE is_public = TRUE ${dateCondition}
       GROUP BY location_name, latitude, longitude, province, city
       HAVING latitude != 0 AND longitude != 0
       ORDER BY species_count DESC
       LIMIT 200`,
      params
    );

    const [provinceStats] = await pool.query(
      `SELECT 
        province as name,
        COUNT(DISTINCT species_id) as species_count,
        COUNT(*) as observation_count,
        COUNT(DISTINCT user_id) as observer_count,
        COUNT(DISTINCT location_name) as location_count
       FROM observations 
       WHERE is_public = TRUE AND province IS NOT NULL ${dateCondition}
       GROUP BY province
       ORDER BY species_count DESC`,
      params
    );

    const [cityStats] = await pool.query(
      `SELECT 
        city as name,
        province,
        COUNT(DISTINCT species_id) as species_count,
        COUNT(*) as observation_count,
        COUNT(DISTINCT user_id) as observer_count
       FROM observations 
       WHERE is_public = TRUE AND city IS NOT NULL ${dateCondition}
       GROUP BY city, province
       ORDER BY species_count DESC
       LIMIT 50`,
      params
    );

    let nearbyLocations = [];
    if (lat && lon && redisClient.isOpen) {
      try {
        const redisKey = `observations:geo:${city || province || 'default'}`;
        const geoRadius = radius ? parseInt(radius) : 50;
        nearbyLocations = await redisClient.geoSearch(
          redisKey,
          {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
          },
          {
            radius: geoRadius,
            unit: 'km'
          },
          {
            withDistance: true,
            withCoordinates: true,
            count: 20,
            sort: 'ASC'
          }
        );
      } catch (redisErr) {
        debug('Redis GEO搜索失败: %O', redisErr);
      }
    }

    const [[hotspots]] = await pool.query(
      `SELECT COUNT(DISTINCT location_name) as total_hotspots,
              COUNT(DISTINCT species_id) as total_species,
              COUNT(*) as total_observations
       FROM observations WHERE is_public = TRUE ${dateCondition}`,
      params
    );

    debug('获取热力图数据: period=%s, province=%s, city=%s, locations=%d',
      period, province, city, locationStats.length);

    res.json({
      period,
      summary: hotspots,
      locations: locationStats,
      by_province: provinceStats,
      by_city: cityStats,
      nearby_locations: nearbyLocations
    });
  } catch (err) {
    debug('获取热力图数据失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getHotspotDetail = async (req, res) => {
  const { location } = req.params;
  const { period = 'month' } = req.query;

  try {
    let dateCondition = '';
    const params = [decodeURIComponent(location)];

    if (period === 'week') {
      dateCondition = 'AND observation_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateCondition = 'AND observation_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateCondition = 'AND observation_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
    }

    const [speciesList] = await pool.query(
      `SELECT 
        bs.id, bs.chinese_name, bs.latin_name, bs.image_url, bs.conservation_status,
        COUNT(DISTINCT o.user_id) as observer_count,
        COUNT(*) as observation_count,
        SUM(o.count) as total_birds,
        MAX(o.observation_date) as last_seen
       FROM observations o
       JOIN bird_species bs ON o.species_id = bs.id
       WHERE o.location_name = ? AND o.is_public = TRUE ${dateCondition}
       GROUP BY bs.id, bs.chinese_name, bs.latin_name, bs.image_url, bs.conservation_status
       ORDER BY observation_count DESC`,
      params
    );

    const [recentObservations] = await pool.query(
      `SELECT o.*, u.nickname, u.avatar, bs.chinese_name, bs.image_url
       FROM observations o
       JOIN users u ON o.user_id = u.id
       JOIN bird_species bs ON o.species_id = bs.id
       WHERE o.location_name = ? AND o.is_public = TRUE
       ORDER BY o.observation_date DESC, o.created_at DESC
       LIMIT 20`,
      [decodeURIComponent(location)]
    );

    debug('获取观鸟点详情: location=%s, speciesCount=%d', location, speciesList.length);

    res.json({
      location: decodeURIComponent(location),
      species: speciesList,
      recent_observations: recentObservations
    });
  } catch (err) {
    debug('获取观鸟点详情失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getHeatmapData, getHotspotDetail };
