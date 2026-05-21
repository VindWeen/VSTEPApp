const mongoose = require('mongoose');

const speakingPromptSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['A2', 'B1', 'B2', 'C1'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    partType: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    timeLimit: {
      type: Number,
      default: 2,
    },
    cueCard: {
      type: [String],
      default: [],
    },
    followUpQuestions: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

speakingPromptSchema.index({ level: 1, partType: 1, isActive: 1 });

module.exports = mongoose.model('SpeakingPrompt', speakingPromptSchema);
