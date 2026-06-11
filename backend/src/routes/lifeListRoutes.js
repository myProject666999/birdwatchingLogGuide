const express = require('express');
const router = express.Router();
const lifeListController = require('../controllers/lifeListController');
const { authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, lifeListController.getLifeListStats);
router.get('/', authenticate, lifeListController.getLifeList);

module.exports = router;
