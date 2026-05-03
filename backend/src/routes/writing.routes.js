const express = require('express');
const { scoreWriting, getMyWritingSessions, getWritingSessionById } = require('../controllers/writing.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/score', protect, scoreWriting);
router.get('/', protect, getMyWritingSessions);
router.get('/:id', protect, getWritingSessionById);

module.exports = router;
