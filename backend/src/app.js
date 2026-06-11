require('dotenv').config();

const express = require('express');
const cors = require('cors');
const debug = require('debug')('app:main');

require('./config/db');
require('./config/redis');

const { requestLogger } = require('./middleware/logger');

const authRoutes = require('./routes/authRoutes');
const speciesRoutes = require('./routes/speciesRoutes');
const observationRoutes = require('./routes/observationRoutes');
const lifeListRoutes = require('./routes/lifeListRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const heatmapRoutes = require('./routes/heatmapRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/api/health', (req, res) => {
  debug('健康检查请求');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'birdwatching-backend'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/life-list', lifeListRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/activities', activityRoutes);

app.use((err, req, res, next) => {
  debug('未处理的错误: %O', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  debug('404: %s %s', req.method, req.url);
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  debug('服务启动成功，监听端口: %d', PORT);
  console.log(`\n========================================`);
  console.log(`  🐦 观鸟记录后端服务已启动`);
  console.log(`  📍 地址: http://localhost:${PORT}`);
  console.log(`  📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  🔍 Debug模式: 已开启 (DEBUG=app:*)`);
  console.log(`========================================\n`);
});
