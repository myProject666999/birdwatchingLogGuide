const express = require('express');
const router = express.Router();
const speciesController = require('../controllers/speciesController');
const { authenticate } = require('../middleware/auth');

router.get('/meta', authenticate, speciesController.getOrdersAndFamilies);
router.get('/:id', authenticate, speciesController.getSpeciesById);
router.get('/', authenticate, speciesController.getSpecies);

module.exports = router;
