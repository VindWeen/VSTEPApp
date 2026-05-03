const mongoose = require('mongoose');

// Sub-schema: 1 câu hỏi
const questionItemSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['MCQ', 'gap-fill', 'matching'],
      default: 'MCQ',
    },
    options: {
      A: String,
      B: String,
      C: String,
      D: String,
    },
    correctAnswer: { type: String, required: true }, // 'A', 'B', 'C', 'D' hoặc text cho gap-fill
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

// Sub-schema: 1 Part trong đề thi
const partSchema = new mongoose.Schema(
  {
    partNumber: { type: Number, required: true }, // 1, 2, 3
    partTitle: { type: String }, // "Part 1 – Short Monologues"
    partDescription: { type: String },
    // Chỉ dùng cho Listening
    audioUrl: { type: String, default: null },
    audioDuration: { type: Number, default: 0 }, // giây
    // Chỉ dùng cho Reading
    passageText: { type: String, default: null },
    passageTitle: { type: String, default: null },
    questions: [questionItemSchema],
  },
  { _id: false }
);

// Schema chính
const questionSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      enum: ['listening', 'reading'],
      required: true,
    },
    level: {
      type: String,
      enum: ['A2', 'B1', 'B2', 'C1'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      // Ví dụ: "Đề Nghe 01 – B2"
    },
    description: { type: String, default: '' },
    duration: { type: Number, required: true }, // Thời gian làm bài (phút)
    totalQuestions: { type: Number, required: true },
    parts: [partSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index để filter nhanh theo skill + level
questionSchema.index({ skill: 1, level: 1 });

module.exports = mongoose.model('Question', questionSchema);
