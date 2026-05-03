const mongoose = require('mongoose');

// Sub-schema: câu trả lời của người dùng
const answerSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    userAnswer: { type: String, default: null }, // null = bỏ qua
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skill: {
      type: String,
      enum: ['listening', 'reading'],
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    testTitle: { type: String }, // Lưu lại title đề thi để hiển thị lịch sử
    level: { type: String, enum: ['A2', 'B1', 'B2', 'C1'] },
    answers: [answerSchema],
    score: { type: Number, required: true },     // Số câu đúng
    total: { type: Number, required: true },      // Tổng số câu
    percentage: { type: Number, required: true }, // %
    estimatedBand: { type: String },              // "B2" ước tính từ %
    duration: { type: Number },                   // Thời gian làm bài (giây)
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index để lấy lịch sử user nhanh
resultSchema.index({ userId: 1, completedAt: -1 });
resultSchema.index({ userId: 1, skill: 1 });

module.exports = mongoose.model('Result', resultSchema);
