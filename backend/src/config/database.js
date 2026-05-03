const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI chưa được cấu hình trong file .env');
    }

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Atlas kết nối thành công: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Kết nối MongoDB thất bại:', error.message);
    throw error;
  }
};

// Xử lý sự kiện disconnect
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB bị ngắt kết nối');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB đã kết nối lại');
});

module.exports = connectDB;
