const jwt = require('jsonwebtoken');
const debug = require('debug')('app:auth');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    debug('未提供认证令牌');
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'birdwatching-secret-key-2024');
    req.user = { id: decoded.userId, username: decoded.username };
    debug('用户认证通过: %s (id=%d)', decoded.username, decoded.userId);
    next();
  } catch (err) {
    debug('令牌验证失败: %O', err);
    return res.status(401).json({ error: '无效或过期的令牌' });
  }
};

module.exports = { authenticate };
