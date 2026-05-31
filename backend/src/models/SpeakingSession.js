const mongoose = require('mongoose');

const speakingFeedbackSchema = new mongoose.Schema(
  {
    band: { type: Number, min: 0, max: 10 },
    fluency: { type: Number, min: 0, max: 10 },
    lexical: { type: Number, min: 0, max: 10 },
    grammar: { type: Number, min: 0, max: 10 },
    pronunciation: { type: Number, min: 0, max: 10 },
    strengths: [String],
    improvements: [String],
    suggestions: [String],
    rawResponse: { type: String },
  },
  { _id: false }
);

const speakingPartResponseSchema = new mongoose.Schema(
  {
    title: { type: String },
    partType: {
      type: String,
      enum: ['Part 1', 'Part 2', 'Part 3'],
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
    transcript: {
      type: String,
      default: null,
    },
    isMockTranscript: {
      type: Boolean,
      default: false,
    },
    aiFeedback: speakingFeedbackSchema,
  },
  { _id: false }
);

const speakingSessionSchema = new mongoose.Schema(
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
    partType: {
      type: String,
      enum: ['Part 1', 'Part 2', 'Part 3', 'Full Test'],
      default: 'Part 2',
    },
    testTitle: {
      type: String,
      default: null,
    },
    prompt: {
      type: String,
      default: null,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
    totalAudioDuration: {
      type: Number,
      default: 0,
    },
    transcript: {
      type: String,
      default: null,
    },
    isMockTranscript: {
      type: Boolean,
      default: false,
    },
    partResponses: {
      type: [speakingPartResponseSchema],
      default: [],
    },
    aiFeedback: speakingFeedbackSchema,
    status: {
      type: String,
      enum: ['uploaded', 'transcribed', 'scored', 'error'],
      default: 'uploaded',
    },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

speakingSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('SpeakingSession', speakingSessionSchema);
