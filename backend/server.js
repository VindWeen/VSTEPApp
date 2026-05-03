require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Kết nối MongoDB rồi mới start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 VSTEP Backend đang chạy tại http://localhost:${PORT}`);
    console.log(`📦 Môi trường: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
  });
}).catch((err) => {
  console.error('❌ Không thể kết nối MongoDB, server không khởi động:', err.message);
  process.exit(1);
});
