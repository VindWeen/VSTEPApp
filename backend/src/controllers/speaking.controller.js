const { uploadAudio: uploadToCloudinary } = require('../services/cloudinary.service');
const { transcribeAudio } = require('../services/stt.service');
const { callGemini, parseAIJsonResponse } = require('../services/ai.service');
const { getSpeakingSystemPrompt, buildSpeakingUserMessage } = require('../prompts/speaking.prompt');
const SpeakingSession = require('../models/SpeakingSession');
const User = require('../models/User');

// POST /api/speaking/upload
// Form-data: audio file + { prompt, level, partType }
const uploadSpeaking = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Chưa có file audio được tải lên' });
    }

    const { prompt, level = 'B1', partType = 'Part 2' } = req.body;
    const userId = req.user._id;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Thiếu nội dung đề bài (prompt)' });
    }

    // Upload lên Cloudinary
    const { audioUrl, publicId, duration } = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      userId.toString()
    );

    // Tạo session với status 'uploaded'
    const session = await SpeakingSession.create({
      userId,
      level,
      partType,
      prompt,
      audioUrl,
      cloudinaryPublicId: publicId,
      audioDuration: duration,
      status: 'uploaded',
    });

    res.status(201).json({
      success: true,
      message: 'Upload audio thành công',
      data: {
        speakingId: session._id,
        audioUrl,
        duration,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/speaking/transcribe
// Body: { speakingId }
const transcribeSpeaking = async (req, res, next) => {
  try {
    const { speakingId } = req.body;
    const session = await SpeakingSession.findOne({
      _id: speakingId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy session' });
    }

    if (!session.audioUrl) {
      return res.status(400).json({ success: false, message: 'Chưa có audio để transcribe' });
    }

    // Gọi STT (mock hoặc Google)
    const { transcript, isMock } = await transcribeAudio(session.audioUrl);

    session.transcript = transcript;
    session.isMockTranscript = isMock;
    session.status = 'transcribed';
    await session.save();

    res.status(200).json({
      success: true,
      message: isMock ? 'Transcript mẫu (dev mode)' : 'Chuyển giọng nói thành công',
      data: { speakingId, transcript, isMock },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/speaking/score
// Body: { speakingId }
const scoreSpeaking = async (req, res, next) => {
  try {
    const { speakingId } = req.body;
    const session = await SpeakingSession.findOne({
      _id: speakingId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy session' });
    }

    if (!session.transcript) {
      return res.status(400).json({
        success: false,
        message: 'Chưa có transcript. Hãy gọi /transcribe trước.',
      });
    }

    // Gọi Gemini AI chấm điểm
    let aiFeedback, rawResponse;
    try {
      rawResponse = await callGemini(
        getSpeakingSystemPrompt(),
        buildSpeakingUserMessage({
          level: session.level,
          partType: session.partType,
          prompt: session.prompt,
          transcript: session.transcript,
        })
      );
      aiFeedback = parseAIJsonResponse(rawResponse);
    } catch (aiError) {
      console.error('❌ Gemini Speaking error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI không thể chấm bài lúc này. Vui lòng thử lại sau.',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
      });
    }

    session.aiFeedback = { ...aiFeedback, rawResponse };
    session.status = 'scored';
    await session.save();

    // Tăng totalSessions
    await User.findByIdAndUpdate(session.userId, { $inc: { totalSessions: 1 } });

    res.status(200).json({
      success: true,
      message: 'Chấm điểm Speaking thành công',
      data: {
        speakingId,
        transcript: session.transcript,
        isMockTranscript: session.isMockTranscript,
        audioUrl: session.audioUrl,
        aiFeedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/speaking?page=1&limit=10
const getMySpeakingSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const sessions = await SpeakingSession.find({ userId: req.user._id })
      .select('level partType prompt audioUrl audioDuration aiFeedback.band status completedAt')
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await SpeakingSession.countDocuments({ userId: req.user._id });

    res.status(200).json({ success: true, total, page: Number(page), data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/speaking/:id
const getSpeakingSessionById = async (req, res, next) => {
  try {
    const session = await SpeakingSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài nói' });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSpeaking,
  transcribeSpeaking,
  scoreSpeaking,
  getMySpeakingSessions,
  getSpeakingSessionById,
};
