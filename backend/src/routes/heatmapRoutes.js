const express = require('express');
const router = express.Router();
const heatmapController = require('../controllers/heatmapController');
const { authenticate } = require('../middleware/auth');

router.get('/hotspot/:location', authenticate, heatmapController.getHotspotDetail);
router.get('/', authenticate, heatmapController.getHeatmapData);

module.exports = router;
