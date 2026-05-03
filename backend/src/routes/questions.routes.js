const express = require('express');
const {
  getListeningTests,
  getListeningTestById,
  getReadingTests,
  getReadingTestById,
  getAnswers,
} = require('../controllers/questions.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Listening
router.get('/listening', protect, getListeningTests);
router.get('/listening/:id', protect, getListeningTestById);

// Reading
router.get('/reading', protect, getReadingTests);
router.get('/reading/:id', protect, getReadingTestById);

// Đáp án (dùng sau khi nộp bài)
router.get('/:id/answers', protect, getAnswers);

module.exports = router;
