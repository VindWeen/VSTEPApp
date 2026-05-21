const express = require('express');
const {
  getListeningTests,
  getListeningTestById,
  getAnswers,
} = require('../controllers/questions.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, getListeningTests);
router.get('/:id', protect, getListeningTestById);
router.get('/:id/answers', protect, getAnswers);

module.exports = router;
