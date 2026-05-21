const express = require('express');
const {
  uploadSpeaking,
  transcribeSpeaking,
  scoreSpeaking,
  scoreSpeakingTest,
  getMySpeakingSessions,
  getSpeakingTests,
  getSpeakingSessionById,
} = require('../controllers/speaking.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadAudio, handleMulterError } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/upload', protect, uploadAudio.single('audio'), handleMulterError, uploadSpeaking);
router.post('/transcribe', protect, transcribeSpeaking);
router.post('/score', protect, scoreSpeaking);
router.post('/score-test', protect, scoreSpeakingTest);

router.get('/tests', protect, getSpeakingTests);
router.get('/', protect, getMySpeakingSessions);
router.get('/:id', protect, getSpeakingSessionById);

module.exports = router;
