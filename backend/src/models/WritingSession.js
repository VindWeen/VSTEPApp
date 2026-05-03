const mongoose = require('mongoose');

// Sub-schema: AI feedback object
const writingFeedbackSchema = new mongoose.Schema(
  {
    band: { type: Number, min: 1, max: 5 },
    taskAchievement: { type: Number, min: 1, max: 5 },
    coherence: { type: Number, min: 1, max: 5 },
    lexical: { type: Number, min: 1, max: 5 },
    grammar: { type: Number, min: 1, max: 5 },
    strengths: [String],
    improvements: [String],
    suggestions: [String],
    rawResponse: { type: String }, // Lưu lại response gốc từ AI để debug
  },
  { _id: false }
);

const writingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    level: {
      type: String,
      enum: ['A2', 'B1', 'B2', 'C1'],
      required: true,
    },
    taskType: {
      type: String,
      enum: ['Task 1', 'Task 2'],
      default: 'Task 2',
    },
    prompt: {
      type: String,
      required: true, // Đề bài
    },
    essay: {
      type: String,
      required: true, // Bài viết của người dùng
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    aiFeedback: writingFeedbackSchema,
    status: {
      type: String,
      enum: ['pending', 'scored', 'error'],
      default: 'scored',
    },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index để lấy lịch sử writing của user
writingSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('WritingSession', writingSessionSchema);
