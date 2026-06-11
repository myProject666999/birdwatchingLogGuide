const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, activityController.createActivity);
router.get('/:id', authenticate, activityController.getActivityById);
router.post('/:id/join', authenticate, activityController.joinActivity);
router.post('/:id/quit', authenticate, activityController.quitActivity);
router.delete('/:id', authenticate, activityController.cancelActivity);
router.get('/', authenticate, activityController.getActivities);

module.exports = router;
