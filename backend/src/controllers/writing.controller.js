const { callGemini, parseAIJsonResponse } = require('../services/ai.service');
const { getWritingSystemPrompt, buildWritingUserMessage } = require('../prompts/writing.prompt');
const WritingSession = require('../models/WritingSession');
const WritingPrompt = require('../models/WritingPrompt');
const User = require('../models/User');

const roundToHalf = (value) => Math.round(value * 2) / 2;

const averageNumber = (values) => {
  const valid = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const mergeUniqueStrings = (items, limit = 6) => {
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

const scoreSingleWritingTask = async ({ level, prompt, essay }) => {
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  const rawResponse = await callGemini(
    getWritingSystemPrompt(),
    buildWritingUserMessage({ level, prompt, essay, wordCount })
  );
  const aiFeedback = parseAIJsonResponse(rawResponse);

  return {
    wordCount,
    aiFeedback,
    rawResponse,
  };
};

// POST /api/writing/score
// Body: { prompt, essay, level, taskType? }
const scoreWriting = async (req, res, next) => {
  try {
    const { prompt, essay, level, taskType = 'Task 2' } = req.body;
    const userId = req.user._id;

    if (!prompt || !essay || !level) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: cần có prompt, essay, và level',
      });
    }

    let scoredTask;
    try {
      scoredTask = await scoreSingleWritingTask({ level, prompt, essay });
    } catch (aiError) {
      console.error('Writing AI error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI không thể chấm bài lúc này. Vui lòng thử lại sau.',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
      });
    }

    const session = await WritingSession.create({
      userId,
      level,
      taskType,
      prompt,
      essay,
      wordCount: scoredTask.wordCount,
      totalWordCount: scoredTask.wordCount,
      aiFeedback: { ...scoredTask.aiFeedback, rawResponse: scoredTask.rawResponse },
      taskResponses: [
        {
          taskType,
          prompt,
          essay,
          wordCount: scoredTask.wordCount,
          aiFeedback: { ...scoredTask.aiFeedback, rawResponse: scoredTask.rawResponse },
        },
      ],
      status: 'scored',
    });

    await User.findByIdAndUpdate(userId, { $inc: { totalSessions: 1 } });

    res.status(200).json({
      success: true,
      message: 'Chấm điểm thành công',
      data: {
        sessionId: session._id,
        wordCount: scoredTask.wordCount,
        aiFeedback: scoredTask.aiFeedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/writing/score-test
// Body: { testTitle, level, tasks: [{ title?, taskType, prompt, essay, level? }] }
const scoreWritingTest = async (req, res, next) => {
  try {
    const { testTitle, level, tasks } = req.body;
    const userId = req.user._id;

    if (!level || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu dữ liệu bài test writing',
      });
    }

    for (const task of tasks) {
      if (!task?.prompt || !task?.essay || !task?.taskType) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi task phải có taskType, prompt và essay',
        });
      }
    }

    let taskResults;
    try {
      taskResults = await Promise.all(
        tasks.map(async (task) => {
          const taskLevel = task.level || level;
          const scored = await scoreSingleWritingTask({
            level: taskLevel,
            prompt: task.prompt,
            essay: task.essay,
          });

          return {
            title: task.title,
            taskType: task.taskType,
            prompt: task.prompt,
            essay: task.essay,
            wordCount: scored.wordCount,
            aiFeedback: { ...scored.aiFeedback, rawResponse: scored.rawResponse },
          };
        })
      );
    } catch (aiError) {
      console.error('Writing test AI error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI không thể chấm bài writing lúc này. Vui lòng thử lại sau.',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
      });
    }

    const combinedFeedback = {
      band: roundToHalf(averageNumber(taskResults.map((task) => task.aiFeedback?.band))),
      taskAchievement: roundToHalf(
        averageNumber(taskResults.map((task) => task.aiFeedback?.taskAchievement))
      ),
      coherence: roundToHalf(averageNumber(taskResults.map((task) => task.aiFeedback?.coherence))),
      lexical: roundToHalf(averageNumber(taskResults.map((task) => task.aiFeedback?.lexical))),
      grammar: roundToHalf(averageNumber(taskResults.map((task) => task.aiFeedback?.grammar))),
      strengths: mergeUniqueStrings(taskResults.map((task) => task.aiFeedback?.strengths), 8),
      improvements: mergeUniqueStrings(taskResults.map((task) => task.aiFeedback?.improvements), 8),
      suggestions: mergeUniqueStrings(taskResults.map((task) => task.aiFeedback?.suggestions), 10),
      rawResponse: JSON.stringify(
        taskResults.map((task) => ({
          taskType: task.taskType,
          rawResponse: task.aiFeedback?.rawResponse,
        }))
      ),
    };

    const totalWordCount = taskResults.reduce((sum, task) => sum + (task.wordCount || 0), 0);

    const session = await WritingSession.create({
      userId,
      level,
      taskType: 'Full Test',
      testTitle: testTitle || null,
      totalWordCount,
      taskResponses: taskResults,
      aiFeedback: combinedFeedback,
      status: 'scored',
    });

    await User.findByIdAndUpdate(userId, { $inc: { totalSessions: 1 } });

    res.status(200).json({
      success: true,
      message: 'Chấm điểm bài test writing thành công',
      data: {
        sessionId: session._id,
        totalWordCount,
        aiFeedback: combinedFeedback,
        taskResults: taskResults.map((task) => ({
          title: task.title,
          taskType: task.taskType,
          prompt: task.prompt,
          essay: task.essay,
          wordCount: task.wordCount,
          aiFeedback: task.aiFeedback,
        })),
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
    const filter = { userId: req.user._id, taskType: 'Full Test' };
    if (level) filter.level = level;

    const sessions = await WritingSession.find(filter)
      .select('level taskType testTitle prompt wordCount totalWordCount aiFeedback.band status completedAt')
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await WritingSession.countDocuments(filter);

    res.status(200).json({ success: true, total, page: Number(page), data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/writing/tests?page=1&limit=10
const getWritingTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, level, taskType } = req.query;
    const filter = { isActive: true };
    if (level) filter.level = level;
    if (taskType) filter.taskType = taskType;

    const tests = await WritingPrompt.find(filter)
      .select('level title taskType timeLimit minWords prompt notes sampleOutline createdAt')
      .sort({ title: 1, taskType: 1, createdAt: 1 })
      .collation({ locale: 'en', numericOrdering: true })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await WritingPrompt.countDocuments(filter);

    res.status(200).json({ success: true, total, page: Number(page), data: tests });
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

module.exports = {
  scoreWriting,
  scoreWritingTest,
  getMyWritingSessions,
  getWritingTests,
  getWritingSessionById,
};
