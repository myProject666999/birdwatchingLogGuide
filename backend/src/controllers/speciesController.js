const pool = require('../config/db');
const debug = require('debug')('app:species');

const getSpecies = async (req, res) => {
  const { page = 1, pageSize = 20, order, family, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = 'SELECT * FROM bird_species WHERE 1=1';
  const params = [];

  if (order) {
    sql += ' AND bird_order = ?';
    params.push(order);
  }
  if (family) {
    sql += ' AND family = ?';
    params.push(family);
  }
  if (keyword) {
    sql += ' AND (chinese_name LIKE ? OR latin_name LIKE ? OR english_name LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  
  sql += ' ORDER BY chinese_name LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  try {
    const [[{ total }], [species]] = await Promise.all([
      pool.query(countSql, params.slice(0, -2)),
      pool.query(sql, params)
    ]);

    debug('查询鸟种列表: keyword=%s, total=%d, page=%d', keyword, total, page);

    res.json({
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      list: species
    });
  } catch (err) {
    debug('查询鸟种列表失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getSpeciesById = async (req, res) => {
  const { id } = req.params;

  try {
    const [species] = await pool.query('SELECT * FROM bird_species WHERE id = ?', [id]);

    if (species.length === 0) {
      return res.status(404).json({ error: '鸟种不存在' });
    }

    debug('查询鸟种详情: id=%s, name=%s', id, species[0].chinese_name);

    res.json({ species: species[0] });
  } catch (err) {
    debug('查询鸟种详情失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getOrdersAndFamilies = async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT DISTINCT bird_order as name, COUNT(*) as count FROM bird_species GROUP BY bird_order ORDER BY name'
    );
    const [families] = await pool.query(
      'SELECT DISTINCT family as name, bird_order as order_name, COUNT(*) as count FROM bird_species GROUP BY family, bird_order ORDER BY name'
    );

    res.json({ orders, families });
  } catch (err) {
    debug('获取目科列表失败: %O', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getSpecies, getSpeciesById, getOrdersAndFamilies };
