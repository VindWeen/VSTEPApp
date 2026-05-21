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
    audioUrl: { type: String, default: null },
    audioDuration: { type: Number, default: 0 },
    questions: [questionItemSchema],
  },
  { _id: false }
);

const listeningTestSchema = new mongoose.Schema(
  {
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
  { timestamps: true, collection: 'listeningtests' }
);

listeningTestSchema.index({ level: 1 });

module.exports = mongoose.model('ListeningTest', listeningTestSchema);
