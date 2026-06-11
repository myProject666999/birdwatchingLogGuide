const express = require('express');
const router = express.Router();
const observationController = require('../controllers/observationController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, observationController.addObservation);
router.get('/:id', authenticate, observationController.getObservationById);
router.delete('/:id', authenticate, observationController.deleteObservation);
router.get('/', authenticate, observationController.getObservations);

module.exports = router;
