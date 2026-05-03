const express = require('express');
const { submitResult, getMyResults, getResultById } = require('../controllers/results.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', protect, submitResult);
router.get('/', protect, getMyResults);
router.get('/:id', protect, getResultById);

module.exports = router;
