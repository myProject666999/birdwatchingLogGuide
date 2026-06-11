const { createClient } = require('redis');
const debug = require('debug')('app:redis');

const client = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

client.on('connect', () => {
  debug('Redis连接成功: %s:%s', process.env.REDIS_HOST, process.env.REDIS_PORT);
});

client.on('error', (err) => {
  debug('Redis连接错误: %O', err);
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    debug('Redis连接失败，部分功能（热力图）将不可用: %O', err);
  }
})();

module.exports = client;
