const mongoose = require('mongoose');

const writingPromptSchema = new mongoose.Schema(
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
    taskType: {
      type: String,
      default: 'Task 2',
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    timeLimit: {
      type: Number,
      default: 20,
    },
    minWords: {
      type: Number,
      default: 120,
    },
    notes: {
      type: String,
      default: '',
    },
    sampleOutline: {
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

writingPromptSchema.index({ level: 1, taskType: 1, isActive: 1 });

module.exports = mongoose.model('WritingPrompt', writingPromptSchema);
