const pool = require('../config/db');
const debug = require('debug')('app:achievement');

const checkAchievements = async (userId) => {
  const unlockedAchievements = [];
  
  try {
    const [allAchievements] = await pool.query('SELECT * FROM achievements');
    const [userAchievements] = await pool.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
      [userId]
    );
    const unlockedIds = new Set(userAchievements.map(a => a.achievement_id));

    const [[speciesStats]] = await pool.query(
      'SELECT COUNT(*) as total_species FROM life_lists WHERE user_id = ?',
      [userId]
    );
    const [[obsStats]] = await pool.query(
      'SELECT COUNT(*) as total_observations FROM observations WHERE user_id = ?',
      [userId]
    );
    const [[cityStats]] = await pool.query(
      'SELECT COUNT(DISTINCT city) as unique_cities FROM observations WHERE user_id = ? AND city IS NOT NULL',
      [userId]
    );
    const currentYear = new Date().getFullYear();
    const [[yearStats]] = await pool.query(
      'SELECT COUNT(*) as year_new_species FROM life_lists WHERE user_id = ? AND YEAR(first_observed_date) = ?',
      [userId, currentYear]
    );
    const [[activityStats]] = await pool.query(
      `SELECT 
        SUM(CASE WHEN role = '参与者' THEN 1 ELSE 0 END) as joined_activities,
        SUM(CASE WHEN role = '组织者' THEN 1 ELSE 0 END) as organized_activities
       FROM activity_participants WHERE user_id = ?`,
      [userId]
    );

    const stats = {
      total_species: speciesStats.total_species,
      total_observations: obsStats.total_observations,
      unique_cities: cityStats.unique_cities,
      year_new_species: yearStats.year_new_species,
      joined_activities: activityStats.joined_activities || 0,
      organized_activities: activityStats.organized_activities || 0
    };

    for (const ach of allAchievements) {
      if (unlockedIds.has(ach.id)) continue;
      
      const currentValue = stats[ach.condition_type] || 0;
      if (currentValue >= ach.condition_value) {
        await pool.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
          [userId, ach.id]
        );
        unlockedAchievements.push({ ...ach, unlocked_at: new Date() });
        debug('成就解锁: user=%d, achievement=%s', userId, ach.name);
      }
    }
  } catch (err) {
    debug('检查成就失败: %O', err);
  }

  return unlockedAchievements;
};

const getAchievements = async (req, res) => {
  try {
    const [achievements] = await pool.query(
      `SELECT a.*, 
        CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as unlocked,
        ua.unlocked_at
       FROM achievements a 
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
       ORDER BY a.id`,
      [req.user.id]
    );

    const [[progress]] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM life_lists WHERE user_id = ?) as total_species,
        (SELECT COUNT(*) FROM observations WHERE user_id = ?) as total_observations,
        (SELECT COUNT(DISTINCT city) FROM observations WHERE user_id = ? AND city IS NOT NULL) as unique_cities,
        (SELECT COUNT(*) FROM life_lists WHERE user_id = ? AND YEAR(first_observed_date) = YEAR(CURDATE())) as year_new_species,
        (SELECT COUNT(*) FROM activity_participants WHERE user_id = ? AND role = '参与者') as joined_activities,
        (SELECT COUNT(*) FROM activity_participants WHERE user_id = ? AND role = '组织者') as organized_activities`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );

    res.json({ achievements, progress });
  } catch (err) {
    debug('获取成就列表失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getAchievements, checkAchievements };
