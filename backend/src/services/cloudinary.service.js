const cloudinary = require('../config/cloudinary');

/**
 * Upload file audio buffer lên Cloudinary
 * @param {Buffer} buffer - File buffer từ Multer memory storage
 * @param {string} filename - Tên file gốc
 * @param {string} userId - ID user để tổ chức folder
 * @returns {{ audioUrl, publicId, duration }}
 */
const uploadAudio = (buffer, filename, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', // Cloudinary dùng 'video' cho audio files
        folder: `vstep/speaking/${userId}`,
        public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
        allowed_formats: ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac', '3gp'],
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload thất bại: ${error.message}`));
        }
        resolve({
          audioUrl: result.secure_url,
          publicId: result.public_id,
          duration: result.duration || 0, // giây
        });
      }
    );

    // Pipe buffer vào upload stream
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Xóa file audio khỏi Cloudinary (dùng khi cần cleanup)
 */
const deleteAudio = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  } catch (error) {
    console.warn('⚠️ Không thể xóa file Cloudinary:', error.message);
  }
};

module.exports = { uploadAudio, deleteAudio };
