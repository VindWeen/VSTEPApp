const { callGemini, parseAIJsonResponse } = require('../services/ai.service');
const { getWritingSystemPrompt, buildWritingUserMessage } = require('../prompts/writing.prompt');
const WritingSession = require('../models/WritingSession');
const User = require('../models/User');

// POST /api/writing/score
// Body: { prompt, essay, level, taskType? }
const scoreWriting = async (req, res, next) => {
  try {
    const { prompt, essay, level, taskType = 'Task 2' } = req.body;
    const userId = req.user._id;

    // Validate
    if (!prompt || !essay || !level) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: cần có prompt, essay, và level',
      });
    }

    const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

    // Gọi Gemini AI
    let aiFeedback, rawResponse;
    try {
      rawResponse = await callGemini(
        getWritingSystemPrompt(),
        buildWritingUserMessage({ level, prompt, essay, wordCount })
      );
      aiFeedback = parseAIJsonResponse(rawResponse);
    } catch (aiError) {
      console.error('❌ Gemini API error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI không thể chấm bài lúc này. Vui lòng thử lại sau.',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
      });
    }

    // Lưu vào MongoDB
    const session = await WritingSession.create({
      userId,
      level,
      taskType,
      prompt,
      essay,
      wordCount,
      aiFeedback: { ...aiFeedback, rawResponse },
      status: 'scored',
    });

    // Tăng totalSessions
    await User.findByIdAndUpdate(userId, { $inc: { totalSessions: 1 } });

    res.status(200).json({
      success: true,
      message: 'Chấm điểm thành công',
      data: {
        sessionId: session._id,
        wordCount,
        aiFeedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/writing?page=1&limit=10
const getMyWritingSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, level } = req.query;
    const filter = { userId: req.user._id };
    if (level) filter.level = level;

    const sessions = await WritingSession.find(filter)
      .select('level taskType prompt wordCount aiFeedback.band status completedAt')
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await WritingSession.countDocuments(filter);

    res.status(200).json({ success: true, total, page: Number(page), data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/writing/:id
const getWritingSessionById = async (req, res, next) => {
  try {
    const session = await WritingSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

module.exports = { scoreWriting, getMyWritingSessions, getWritingSessionById };
