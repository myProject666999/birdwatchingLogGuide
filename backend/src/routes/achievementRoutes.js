const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, achievementController.getAchievements);

module.exports = router;
