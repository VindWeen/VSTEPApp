const mongoose = require('mongoose');

const fullMockResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    overallBand: {
      type: Number,
      required: true,
      default: 0,
    },
    selectedTests: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    skills: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'fullmockresults',
  }
);

fullMockResultSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('FullMockResult', fullMockResultSchema);
