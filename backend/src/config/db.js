const mysql = require('mysql2/promise');
const debug = require('debug')('app:db');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'birdwatching',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

pool.getConnection()
  .then(conn => {
    debug('MySQL连接成功: %s:%d/%s', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);
    conn.release();
  })
  .catch(err => {
    debug('MySQL连接失败: %O', err);
    process.exit(1);
  });

module.exports = pool;
