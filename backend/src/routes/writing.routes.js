const express = require('express');
const {
  scoreWriting,
  scoreWritingTest,
  getMyWritingSessions,
  getWritingTests,
  getWritingSessionById,
} = require('../controllers/writing.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/score', protect, scoreWriting);
router.post('/score-test', protect, scoreWritingTest);
router.get('/tests', protect, getWritingTests);
router.get('/', protect, getMyWritingSessions);
router.get('/:id', protect, getWritingSessionById);

module.exports = router;
