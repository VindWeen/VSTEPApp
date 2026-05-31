const mongoose = require('mongoose');

const writingFeedbackSchema = new mongoose.Schema(
  {
    band: { type: Number, min: 0, max: 10 },
    taskAchievement: { type: Number, min: 0, max: 10 },
    coherence: { type: Number, min: 0, max: 10 },
    lexical: { type: Number, min: 0, max: 10 },
    grammar: { type: Number, min: 0, max: 10 },
    strengths: [String],
    improvements: [String],
    suggestions: [String],
    rawResponse: { type: String },
  },
  { _id: false }
);

const writingTaskResponseSchema = new mongoose.Schema(
  {
    title: { type: String },
    taskType: {
      type: String,
      enum: ['Task 1', 'Task 2'],
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    essay: {
      type: String,
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    aiFeedback: writingFeedbackSchema,
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
      enum: ['Task 1', 'Task 2', 'Full Test'],
      default: 'Task 2',
    },
    testTitle: {
      type: String,
    },
    prompt: {
      type: String,
      required: false,
    },
    essay: {
      type: String,
      required: false,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    totalWordCount: {
      type: Number,
      default: 0,
    },
    taskResponses: {
      type: [writingTaskResponseSchema],
      default: [],
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

writingSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('WritingSession', writingSessionSchema);
