const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    userAnswer: { type: String, default: null },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const readingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skill: {
      type: String,
      enum: ['reading'],
      default: 'reading',
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReadingTest',
      required: true,
    },
    testTitle: { type: String },
    level: { type: String, enum: ['A2', 'B1', 'B2', 'C1'] },
    answers: [answerSchema],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    estimatedBand: { type: String },
    duration: { type: Number },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'readingsessions' }
);

readingSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('ReadingSession', readingSessionSchema);
