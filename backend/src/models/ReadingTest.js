const mongoose = require('mongoose');

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
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const partSchema = new mongoose.Schema(
  {
    partNumber: { type: Number, required: true },
    partTitle: { type: String },
    partDescription: { type: String },
    passageText: { type: String, default: null },
    passageTitle: { type: String, default: null },
    questions: [questionItemSchema],
  },
  { _id: false }
);

const readingTestSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      enum: ['reading'],
      default: 'reading',
    },
    level: {
      type: String,
      enum: ['A2', 'B1', 'B2', 'C1'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: { type: String, default: '' },
    duration: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    parts: [partSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'readingtests' }
);

readingTestSchema.index({ level: 1 });

module.exports = mongoose.model('ReadingTest', readingTestSchema);
