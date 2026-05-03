const multer = require('multer');
const path = require('path');

// Lưu file tạm vào memory buffer (để upload Cloudinary)
const storage = multer.memoryStorage();

// Chỉ chấp nhận file audio
const audioFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/mpeg',       // .mp3
    'audio/mp4',        // .m4a
    'audio/wav',        // .wav
    'audio/x-wav',      // .wav alternative
    'audio/vnd.wave',   // .wav Android variant
    'audio/wave',       // .wav another variant
    'audio/webm',       // .webm
    'audio/ogg',        // .ogg
    'audio/aac',        // .aac
    'audio/x-m4a',      // .m4a alternative MIME
    'audio/3gpp',       // .3gp (Android)
    'audio/amr',        // .amr (Android)
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng file không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận file audio.`), false);
  }
};

// Upload middleware cho audio (max 20MB)
const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// Error handler cho multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File quá lớn. Tối đa 20MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = { uploadAudio, handleMulterError };
