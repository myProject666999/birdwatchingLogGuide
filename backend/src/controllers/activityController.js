const pool = require('../config/db');
const redisClient = require('../config/redis');
const { checkAchievements } = require('./achievementController');
const debug = require('debug')('app:activity');

const createActivity = async (req, res) => {
  const {
    title, description, activity_date, start_time, end_time,
    location_name, latitude, longitude, province, city,
    max_participants, difficulty, equipment, notes
  } = req.body;
  const userId = req.user.id;

  if (!title || !activity_date || !location_name) {
    return res.status(400).json({ error: '标题、日期和地点不能为空' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [actResult] = await conn.query(
      `INSERT INTO activities 
       (user_id, title, description, activity_date, start_time, end_time,
        location_name, latitude, longitude, province, city,
        max_participants, difficulty, equipment, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, title, description, activity_date, start_time, end_time,
        location_name, latitude, longitude, province, city,
        max_participants || 20, difficulty || '轻松', equipment, notes
      ]
    );
    const activityId = actResult.insertId;

    await conn.query(
      `INSERT INTO activity_participants (activity_id, user_id, role, status)
       VALUES (?, ?, '组织者', '已确认')`,
      [activityId, userId]
    );

    if (latitude && longitude && redisClient.isOpen) {
      try {
        await redisClient.geoAdd('activities:geo', {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          member: `act:${activityId}`
        });
      } catch (redisErr) {
        debug('写入活动Redis GEO失败: %O', redisErr);
      }
    }

    await conn.commit();

    const newAchievements = await checkAchievements(userId);

    debug('活动创建成功: id=%d, user=%d, title=%s', activityId, userId, title);

    res.status(201).json({
      message: '活动创建成功',
      activityId,
      newAchievements
    });
  } catch (err) {
    await conn.rollback();
    debug('创建活动失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  } finally {
    conn.release();
  }
};

const getActivities = async (req, res) => {
  const { page = 1, pageSize = 20, status, province, city, date_from, date_to } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `SELECT a.*, u.nickname as organizer_name, u.avatar as organizer_avatar,
             (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id AND ap.status != '已退出') as current_participants
             FROM activities a 
             JOIN users u ON a.user_id = u.id 
             WHERE 1=1`;
  const params = [];

  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (province) {
    sql += ' AND a.province = ?';
    params.push(province);
  }
  if (city) {
    sql += ' AND a.city = ?';
    params.push(city);
  }
  if (date_from) {
    sql += ' AND a.activity_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    sql += ' AND a.activity_date <= ?';
    params.push(date_to);
  }

  const countSql = sql.replace(
    'SELECT a.*, u.nickname as organizer_name, u.avatar as organizer_avatar, (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id AND ap.status != \'已退出\') as current_participants',
    'SELECT COUNT(*) as total'
  );
  
  sql += ' ORDER BY a.activity_date ASC, a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  try {
    const [[{ total }], [activities]] = await Promise.all([
      pool.query(countSql, params.slice(0, -2)),
      pool.query(sql, params)
    ]);

    debug('查询活动列表: total=%d, page=%d, status=%s', total, page, status);

    res.json({
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      list: activities
    });
  } catch (err) {
    debug('查询活动列表失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getActivityById = async (req, res) => {
  const { id } = req.params;

  try {
    const [activities] = await pool.query(
      `SELECT a.*, u.nickname as organizer_name, u.avatar as organizer_avatar,
        (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id AND ap.status != '已退出') as current_participants
       FROM activities a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const [participants] = await pool.query(
      `SELECT ap.*, u.nickname, u.avatar 
       FROM activity_participants ap 
       JOIN users u ON ap.user_id = u.id 
       WHERE ap.activity_id = ? AND ap.status != '已退出'
       ORDER BY ap.role DESC, ap.joined_at ASC`,
      [id]
    );

    const isJoined = participants.some(p => p.user_id === (req.user ? req.user.id : -1));

    res.json({
      activity: activities[0],
      participants,
      is_joined: isJoined
    });
  } catch (err) {
    debug('查询活动详情失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const joinActivity = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [activities] = await pool.query(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const activity = activities[0];
    if (activity.status !== '招募中') {
      return res.status(400).json({ error: '活动不在招募状态' });
    }

    const [[{ current_count }]] = await pool.query(
      `SELECT COUNT(*) as current_count 
       FROM activity_participants 
       WHERE activity_id = ? AND status != '已退出'`,
      [id]
    );

    if (current_count >= activity.max_participants) {
      return res.status(400).json({ error: '活动人数已满' });
    }

    const [existing] = await pool.query(
      'SELECT id, status FROM activity_participants WHERE activity_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      if (existing[0].status === '已退出') {
        await pool.query(
          "UPDATE activity_participants SET status = '已报名', joined_at = NOW() WHERE id = ?",
          [existing[0].id]
        );
      } else {
        return res.status(400).json({ error: '已报名该活动' });
      }
    } else {
      await pool.query(
        `INSERT INTO activity_participants (activity_id, user_id, role, status)
         VALUES (?, ?, '参与者', '已报名')`,
        [id, userId]
      );
    }

    const newAchievements = await checkAchievements(userId);

    debug('用户报名活动: activity=%d, user=%d', id, userId);

    res.json({
      message: '报名成功',
      newAchievements
    });
  } catch (err) {
    debug('报名活动失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const quitActivity = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [existing] = await pool.query(
      `SELECT ap.*, a.user_id as organizer_id 
       FROM activity_participants ap 
       JOIN activities a ON ap.activity_id = a.id 
       WHERE ap.activity_id = ? AND ap.user_id = ?`,
      [id, userId]
    );

    if (existing.length === 0 || existing[0].status === '已退出') {
      return res.status(400).json({ error: '未参加该活动' });
    }

    if (existing[0].role === '组织者') {
      return res.status(400).json({ error: '组织者不能退出活动，请取消活动' });
    }

    await pool.query(
      "UPDATE activity_participants SET status = '已退出' WHERE activity_id = ? AND user_id = ?",
      [id, userId]
    );

    debug('用户退出活动: activity=%d, user=%d', id, userId);

    res.json({ message: '已退出活动' });
  } catch (err) {
    debug('退出活动失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const cancelActivity = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [activities] = await pool.query(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ error: '活动不存在' });
    }

    if (activities[0].user_id !== userId) {
      return res.status(403).json({ error: '只有组织者可以取消活动' });
    }

    await pool.query(
      "UPDATE activities SET status = '已取消' WHERE id = ?",
      [id]
    );

    debug('活动已取消: id=%d, user=%d', id, userId);

    res.json({ message: '活动已取消' });
  } catch (err) {
    debug('取消活动失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = {
  createActivity, getActivities, getActivityById,
  joinActivity, quitActivity, cancelActivity
};
