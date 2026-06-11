const pool = require('../config/db');
const debug = require('debug')('app:livelist');

const getLifeList = async (req, res) => {
  const { page = 1, pageSize = 50, order, family, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  const userId = req.user.id;

  let sql = `SELECT ll.*, bs.chinese_name, bs.latin_name, bs.english_name, 
                    bs.bird_order, bs.family, bs.genus, bs.features, 
                    bs.distribution, bs.conservation_status, bs.image_url
             FROM life_lists ll 
             JOIN bird_species bs ON ll.species_id = bs.id 
             WHERE ll.user_id = ?`;
  const params = [userId];

  if (order) {
    sql += ' AND bs.bird_order = ?';
    params.push(order);
  }
  if (family) {
    sql += ' AND bs.family = ?';
    params.push(family);
  }
  if (keyword) {
    sql += ' AND (bs.chinese_name LIKE ? OR bs.latin_name LIKE ? OR bs.english_name LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  const countSql = sql.replace(
    'SELECT ll.*, bs.chinese_name, bs.latin_name, bs.english_name, bs.bird_order, bs.family, bs.genus, bs.features, bs.distribution, bs.conservation_status, bs.image_url',
    'SELECT COUNT(*) as total'
  );
  
  sql += ' ORDER BY ll.first_observed_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  try {
    const [[{ total }], [lifeList]] = await Promise.all([
      pool.query(countSql, params.slice(0, -2)),
      pool.query(sql, params)
    ]);

    debug('查询生命列表: user=%d, total=%d, page=%d', userId, total, page);

    res.json({
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      list: lifeList
    });
  } catch (err) {
    debug('查询生命列表失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getLifeListStats = async (req, res) => {
  const userId = req.user.id;
  const currentYear = new Date().getFullYear();

  try {
    const [[totalStats]] = await pool.query(
      `SELECT 
        COUNT(*) as total_species,
        MIN(first_observed_date) as first_date,
        MAX(first_observed_date) as last_date
       FROM life_lists WHERE user_id = ?`,
      [userId]
    );

    const [[yearStats]] = await pool.query(
      `SELECT COUNT(*) as year_species 
       FROM life_lists 
       WHERE user_id = ? AND YEAR(first_observed_date) = ?`,
      [userId, currentYear]
    );

    const [[obsStats]] = await pool.query(
      `SELECT 
        COUNT(*) as total_observations,
        SUM(count) as total_birds_counted,
        COUNT(DISTINCT DATE(observation_date)) as days_observed
       FROM observations WHERE user_id = ?`,
      [userId]
    );

    const [orderStats] = await pool.query(
      `SELECT bs.bird_order as name, COUNT(*) as count 
       FROM life_lists ll 
       JOIN bird_species bs ON ll.species_id = bs.id 
       WHERE ll.user_id = ? 
       GROUP BY bs.bird_order 
       ORDER BY count DESC`,
      [userId]
    );

    const [monthlyStats] = await pool.query(
      `SELECT 
        YEAR(observation_date) as year,
        MONTH(observation_date) as month,
        COUNT(DISTINCT species_id) as species_count,
        COUNT(*) as observation_count
       FROM observations 
       WHERE user_id = ? AND observation_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
       GROUP BY YEAR(observation_date), MONTH(observation_date)
       ORDER BY year, month`,
      [userId]
    );

    const [topLocations] = await pool.query(
      `SELECT location_name, province, city, 
        COUNT(DISTINCT species_id) as species_count,
        COUNT(*) as observation_count
       FROM observations 
       WHERE user_id = ?
       GROUP BY location_name, province, city
       ORDER BY species_count DESC
       LIMIT 10`,
      [userId]
    );

    debug('获取生命列表统计: user=%d, total=%d, yearNew=%d', 
      userId, totalStats.total_species, yearStats.year_species);

    res.json({
      total: {
        species: totalStats.total_species,
        observations: obsStats.total_observations,
        birds_counted: obsStats.total_birds_counted || 0,
        days_observed: obsStats.days_observed,
        first_date: totalStats.first_date,
        last_date: totalStats.last_date
      },
      year: {
        year: currentYear,
        new_species: yearStats.year_species
      },
      by_order: orderStats,
      monthly_trend: monthlyStats,
      top_locations: topLocations
    });
  } catch (err) {
    debug('获取生命列表统计失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getLifeList, getLifeListStats };
