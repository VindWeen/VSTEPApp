const { uploadAudio: uploadToCloudinary } = require('../services/cloudinary.service');
const { transcribeAudio } = require('../services/stt.service');
const { callGemini, parseAIJsonResponse } = require('../services/ai.service');
const { getSpeakingSystemPrompt, buildSpeakingUserMessage } = require('../prompts/speaking.prompt');
const SpeakingSession = require('../models/SpeakingSession');
const SpeakingPrompt = require('../models/SpeakingPrompt');
const User = require('../models/User');

const normalizeSpeakingPartType = (partType = 'Part 2') => {
  const match = String(partType).match(/Part\s+([123])/i);
  if (match) {
    return `Part ${match[1]}`;
  }

  return 'Part 2';
};

const roundToHalf = (value) => Math.round(value * 2) / 2;

const averageNumber = (values) => {
  const valid = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const mergeUniqueStrings = (items, limit = 8) => {
  const merged = [];

  items.forEach((list) => {
    (list || []).forEach((item) => {
      if (item && !merged.includes(item)) {
        merged.push(item);
      }
    });
  });

  return merged.slice(0, limit);
};

const scoreSingleSpeakingSession = async (session) => {
  if (!session.transcript) {
    const { transcript, isMock } = await transcribeAudio({
      audioUrl: session.audioUrl,
      cloudinaryPublicId: session.cloudinaryPublicId,
    });
    session.transcript = transcript;
    session.isMockTranscript = isMock;
    session.status = 'transcribed';
  }

  const rawResponse = await callGemini(
    getSpeakingSystemPrompt(),
    buildSpeakingUserMessage({
      level: session.level,
      partType: session.partType,
      prompt: session.prompt,
      transcript: session.transcript,
    })
  );
  const aiFeedback = parseAIJsonResponse(rawResponse);

  session.aiFeedback = { ...aiFeedback, rawResponse };
  session.status = 'scored';
  await session.save();

  return session;
};

// POST /api/speaking/upload
// Form-data: audio file + { prompt, level, partType, title? }
const uploadSpeaking = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Chưa có file audio được tải lên' });
    }

    const { prompt, level = 'B1', partType = 'Part 2', title = '' } = req.body;
    const userId = req.user._id;
    const normalizedPartType = normalizeSpeakingPartType(partType);

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Thiếu nội dung đề bài (prompt)' });
    }

    const { audioUrl, publicId, duration } = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      userId.toString()
    );

    const session = await SpeakingSession.create({
      userId,
      level,
      partType: normalizedPartType,
      prompt,
      testTitle: null,
      audioUrl,
      cloudinaryPublicId: publicId,
      audioDuration: duration,
      status: 'uploaded',
      partResponses: [],
      transcript: null,
      aiFeedback: undefined,
      ...(title ? { title } : {}),
    });

    res.status(201).json({
      success: true,
      message: 'Upload audio thành công',
      data: {
        speakingId: session._id,
        audioUrl,
        duration,
        partType: normalizedPartType,
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

    const { transcript, isMock } = await transcribeAudio({
      audioUrl: session.audioUrl,
      cloudinaryPublicId: session.cloudinaryPublicId,
    });

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

    if (!session.audioUrl) {
      return res.status(400).json({ success: false, message: 'Chưa có audio để chấm điểm' });
    }

    let scoredSession;
    try {
      scoredSession = await scoreSingleSpeakingSession(session);
    } catch (aiError) {
      console.error('Speaking AI error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI không thể chấm bài lúc này. Vui lòng thử lại sau.',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
      });
    }

    await User.findByIdAndUpdate(scoredSession.userId, { $inc: { totalSessions: 1 } });

    res.status(200).json({
      success: true,
      message: 'Chấm điểm Speaking thành công',
      data: {
        speakingId,
        transcript: scoredSession.transcript,
        isMockTranscript: scoredSession.isMockTranscript,
        audioUrl: scoredSession.audioUrl,
        aiFeedback: scoredSession.aiFeedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/speaking/score-test
// Body: { testTitle, level, speakingIds: [] }
const scoreSpeakingTest = async (req, res, next) => {
  try {
    const { testTitle, level, speakingIds } = req.body;
    const userId = req.user._id;

    if (!level || !Array.isArray(speakingIds) || speakingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu dữ liệu bài test speaking',
      });
    }

    const sessions = await SpeakingSession.find({
      _id: { $in: speakingIds },
      userId,
    }).sort({ createdAt: 1 });

    if (sessions.length !== speakingIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đầy đủ các part speaking đã upload',
      });
    }

    let scoredParts = [];

    try {
      scoredParts = await Promise.all(sessions.map((session) => scoreSingleSpeakingSession(session)));
    } catch (aiError) {
      console.error('Speaking test AI error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI không thể chấm bài speaking lúc này. Vui lòng thử lại sau.',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
      });
    }

    const combinedFeedback = {
      band: roundToHalf(averageNumber(scoredParts.map((part) => part.aiFeedback?.band))),
      fluency: roundToHalf(averageNumber(scoredParts.map((part) => part.aiFeedback?.fluency))),
      lexical: roundToHalf(averageNumber(scoredParts.map((part) => part.aiFeedback?.lexical))),
      grammar: roundToHalf(averageNumber(scoredParts.map((part) => part.aiFeedback?.grammar))),
      pronunciation: roundToHalf(
        averageNumber(scoredParts.map((part) => part.aiFeedback?.pronunciation))
      ),
      strengths: mergeUniqueStrings(scoredParts.map((part) => part.aiFeedback?.strengths), 8),
      improvements: mergeUniqueStrings(
        scoredParts.map((part) => part.aiFeedback?.improvements),
        8
      ),
      suggestions: mergeUniqueStrings(scoredParts.map((part) => part.aiFeedback?.suggestions), 10),
      rawResponse: JSON.stringify(
        scoredParts.map((part) => ({
          speakingId: String(part._id),
          partType: part.partType,
          rawResponse: part.aiFeedback?.rawResponse,
        }))
      ),
    };

    const totalAudioDuration = scoredParts.reduce(
      (sum, part) => sum + (part.audioDuration || 0),
      0
    );

    const aggregateSession = await SpeakingSession.create({
      userId,
      level,
      partType: 'Full Test',
      testTitle: testTitle || null,
      totalAudioDuration,
      partResponses: scoredParts.map((part) => ({
        title: part.testTitle || part.title,
        partType: part.partType,
        prompt: part.prompt,
        audioUrl: part.audioUrl,
        cloudinaryPublicId: part.cloudinaryPublicId,
        audioDuration: part.audioDuration,
        transcript: part.transcript,
        isMockTranscript: part.isMockTranscript,
        aiFeedback: part.aiFeedback,
      })),
      aiFeedback: combinedFeedback,
      status: 'scored',
      completedAt: new Date(),
    });

    await User.findByIdAndUpdate(userId, { $inc: { totalSessions: 1 } });

    res.status(200).json({
      success: true,
      message: 'Chấm điểm bài test speaking thành công',
      data: {
        speakingId: aggregateSession._id,
        totalAudioDuration,
        aiFeedback: combinedFeedback,
        partResults: scoredParts.map((part) => ({
          speakingId: part._id,
          partType: part.partType,
          prompt: part.prompt,
          transcript: part.transcript,
          audioUrl: part.audioUrl,
          audioDuration: part.audioDuration,
          aiFeedback: part.aiFeedback,
        })),
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

    const sessions = await SpeakingSession.find({
      userId: req.user._id,
      partType: 'Full Test',
    })
      .select('level partType testTitle totalAudioDuration aiFeedback.band status completedAt')
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await SpeakingSession.countDocuments({
      userId: req.user._id,
      partType: 'Full Test',
    });

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data: sessions.map((item) => ({
        ...item.toObject(),
        skill: 'speaking',
        estimatedBand: item.aiFeedback?.band,
        bandScore: item.aiFeedback?.band,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/speaking/tests?page=1&limit=10
const getSpeakingTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, level, partType } = req.query;
    const filter = { isActive: true };
    if (level) filter.level = level;
    if (partType) filter.partType = partType;

    const tests = await SpeakingPrompt.find(filter)
      .select('level title partType timeLimit prompt cueCard followUpQuestions notes createdAt')
      .sort({ title: 1, partType: 1, createdAt: 1 })
      .collation({ locale: 'en', numericOrdering: true })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await SpeakingPrompt.countDocuments(filter);

    res.status(200).json({ success: true, total, page: Number(page), data: tests });
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
  scoreSpeakingTest,
  getMySpeakingSessions,
  getSpeakingTests,
  getSpeakingSessionById,
};
