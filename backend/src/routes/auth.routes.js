const express = require('express');
const { register, login, getMe, updateProfile, updatePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadImage, handleMulterError } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadImage.single('avatar'), handleMulterError, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
