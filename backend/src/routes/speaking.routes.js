const express = require('express');
const {
  uploadSpeaking,
  transcribeSpeaking,
  scoreSpeaking,
  getMySpeakingSessions,
  getSpeakingSessionById,
} = require('../controllers/speaking.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadAudio, handleMulterError } = require('../middleware/upload.middleware');

const router = express.Router();

// Upload audio file (multipart/form-data)
router.post('/upload', protect, uploadAudio.single('audio'), handleMulterError, uploadSpeaking);

// Transcribe audio → text
router.post('/transcribe', protect, transcribeSpeaking);

// AI chấm điểm từ transcript
router.post('/score', protect, scoreSpeaking);

// Lịch sử
router.get('/', protect, getMySpeakingSessions);
router.get('/:id', protect, getSpeakingSessionById);

module.exports = router;
