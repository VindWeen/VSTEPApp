const mongoose = require('mongoose');

// Sub-schema: AI feedback cho Speaking (4 tiêu chí khác với Writing)
const speakingFeedbackSchema = new mongoose.Schema(
  {
    band: { type: Number, min: 1, max: 5 },
    fluency: { type: Number, min: 1, max: 5 },       // Fluency & Coherence
    lexical: { type: Number, min: 1, max: 5 },        // Lexical Resource
    grammar: { type: Number, min: 1, max: 5 },        // Grammatical Range & Accuracy
    pronunciation: { type: Number, min: 1, max: 5 },  // Pronunciation
    strengths: [String],
    improvements: [String],
    suggestions: [String],
    rawResponse: { type: String },
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
      enum: ['Part 1', 'Part 2', 'Part 3'],
      default: 'Part 2',
    },
    prompt: {
      type: String,
      required: true,
    },
    // Cloudinary
    audioUrl: {
      type: String,
      default: null, // URL audio trên Cloudinary
    },
    cloudinaryPublicId: {
      type: String,
      default: null, // Để xóa file sau nếu cần
    },
    audioDuration: {
      type: Number,
      default: 0, // giây
    },
    // Speech-to-Text
    transcript: {
      type: String,
      default: null, // Text chuyển từ audio
    },
    isMockTranscript: {
      type: Boolean,
      default: false, // Đánh dấu nếu dùng mock STT
    },
    // AI Scoring
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

// Index để lấy lịch sử speaking của user
speakingSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('SpeakingSession', speakingSessionSchema);
