const pool = require('../config/db');
const redisClient = require('../config/redis');
const { checkAchievements } = require('./achievementController');
const debug = require('debug')('app:observation');

const addObservation = async (req, res) => {
  const {
    species_id, observation_date, location_name, latitude, longitude,
    province, city, district, count, behavior, weather, notes,
    photos, audio, video, is_public
  } = req.body;
  const userId = req.user.id;

  if (!species_id || !observation_date || !location_name) {
    return res.status(400).json({ error: '鸟种、日期和地点不能为空' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [obsResult] = await conn.query(
      `INSERT INTO observations 
       (user_id, species_id, observation_date, location_name, latitude, longitude,
        province, city, district, count, behavior, weather, notes, photos, audio, video, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, species_id, observation_date, location_name, latitude, longitude,
        province, city, district, count || 1, behavior || '其他', weather, notes,
        photos ? JSON.stringify(photos) : null, audio, video, is_public !== false
      ]
    );
    const observationId = obsResult.insertId;

    const [existingLifeList] = await conn.query(
      'SELECT id FROM life_lists WHERE user_id = ? AND species_id = ?',
      [userId, species_id]
    );

    let isNewSpecies = false;
    if (existingLifeList.length === 0) {
      await conn.query(
        `INSERT INTO life_lists 
         (user_id, species_id, first_observed_date, first_observed_location, first_observation_id)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, species_id, observation_date, location_name, observationId]
      );
      isNewSpecies = true;
      debug('新鸟种添加到生命列表: user=%d, species=%s', userId, species_id);
    }

    if (latitude && longitude && redisClient.isOpen) {
      try {
        const geoKey = `observations:geo:${city || province || 'default'}`;
        await redisClient.geoAdd(geoKey, {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          member: `obs:${observationId}`
        });
        const monthKey = `observations:geo:monthly:${city || province || 'default'}`;
        await redisClient.geoAdd(monthKey, {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          member: `obs:${observationId}`
        });
      } catch (redisErr) {
        debug('写入Redis GEO失败: %O', redisErr);
      }
    }

    await conn.commit();

    const newAchievements = await checkAchievements(userId);

    debug('观察记录添加成功: id=%d, user=%d, isNewSpecies=%s', observationId, userId, isNewSpecies);

    res.status(201).json({
      message: '观察记录添加成功',
      observationId,
      isNewSpecies,
      newAchievements
    });
  } catch (err) {
    await conn.rollback();
    debug('添加观察记录失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  } finally {
    conn.release();
  }
};

const getObservations = async (req, res) => {
  const { page = 1, pageSize = 20, species_id, date_from, date_to, province, city } = req.query;
  const offset = (page - 1) * pageSize;
  const userId = req.user.id;

  let sql = `SELECT o.*, bs.chinese_name, bs.latin_name, bs.image_url 
             FROM observations o 
             JOIN bird_species bs ON o.species_id = bs.id 
             WHERE o.user_id = ?`;
  const params = [userId];

  if (species_id) {
    sql += ' AND o.species_id = ?';
    params.push(species_id);
  }
  if (date_from) {
    sql += ' AND o.observation_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    sql += ' AND o.observation_date <= ?';
    params.push(date_to);
  }
  if (province) {
    sql += ' AND o.province = ?';
    params.push(province);
  }
  if (city) {
    sql += ' AND o.city = ?';
    params.push(city);
  }

  const countSql = sql.replace('SELECT o.*, bs.chinese_name, bs.latin_name, bs.image_url', 'SELECT COUNT(*) as total');
  
  sql += ' ORDER BY o.observation_date DESC, o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  try {
    const [[{ total }], [observations]] = await Promise.all([
      pool.query(countSql, params.slice(0, -2)),
      pool.query(sql, params)
    ]);

    debug('查询观察记录: user=%d, total=%d, page=%d', userId, total, page);

    res.json({
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      list: observations
    });
  } catch (err) {
    debug('查询观察记录失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getObservationById = async (req, res) => {
  const { id } = req.params;

  try {
    const [observations] = await pool.query(
      `SELECT o.*, bs.chinese_name, bs.latin_name, bs.english_name, 
              bs.features, bs.distribution, bs.bird_call_audio, bs.image_url
       FROM observations o 
       JOIN bird_species bs ON o.species_id = bs.id 
       WHERE o.id = ? AND o.user_id = ?`,
      [id, req.user.id]
    );

    if (observations.length === 0) {
      return res.status(404).json({ error: '观察记录不存在' });
    }

    res.json({ observation: observations[0] });
  } catch (err) {
    debug('查询观察记录详情失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const deleteObservation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [existing] = await pool.query(
      'SELECT id, species_id FROM observations WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: '观察记录不存在' });
    }

    await pool.query('DELETE FROM observations WHERE id = ?', [id]);

    debug('删除观察记录: id=%d, user=%d', id, userId);

    res.json({ message: '删除成功' });
  } catch (err) {
    debug('删除观察记录失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { addObservation, getObservations, getObservationById, deleteObservation };
