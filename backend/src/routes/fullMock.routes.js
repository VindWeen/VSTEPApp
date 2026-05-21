const express = require('express');
const { saveFullMockResult, getMyFullMockHistory } = require('../controllers/fullMock.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', protect, saveFullMockResult);
router.get('/', protect, getMyFullMockHistory);

module.exports = router;
