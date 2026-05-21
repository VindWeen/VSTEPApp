const ListeningSession = require('../models/ListeningSession');
const ListeningTest = require('../models/ListeningTest');
const ReadingTest = require('../models/ReadingTest');
const ReadingSession = require('../models/ReadingSession');
const User = require('../models/User');

const estimateBand = (percentage) => {
  if (percentage >= 90) return 'C1';
  if (percentage >= 75) return 'B2';
  if (percentage >= 60) return 'B1';
  if (percentage >= 40) return 'A2';
  return 'A1';
};

const submitResult = async (req, res, next) => {
  try {
    const { testId, skill, answers, duration } = req.body;
    const userId = req.user._id;

    if (!['listening', 'reading'].includes(skill)) {
      return res.status(400).json({ success: false, message: 'Skill không hợp lệ' });
    }

    const TestModel = skill === 'reading' ? ReadingTest : ListeningTest;
    const SessionModel = skill === 'reading' ? ReadingSession : ListeningSession;

    const test = await TestModel.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    const answerMap = {};
    (test.parts || []).forEach((part) => {
      (part.questions || []).forEach((q) => {
        answerMap[q.questionNumber] = {
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        };
      });
    });

    let score = 0;
    const detailedAnswers = (answers || []).map(({ questionNumber, userAnswer }) => {
      const correct = answerMap[questionNumber]?.correctAnswer;
      const isCorrect = Boolean(correct) && userAnswer === correct;
      if (isCorrect) score += 1;
      return { questionNumber, userAnswer, correctAnswer: correct, isCorrect };
    });

    const total = test.totalQuestions;
    const percentage = Math.round((score / total) * 100);
    const estimatedBand = estimateBand(percentage);

    const result = await SessionModel.create({
      userId,
      skill,
      testId,
      testTitle: test.title,
      level: test.level,
      answers: detailedAnswers,
      score,
      total,
      percentage,
      estimatedBand,
      duration,
    });

    await User.findByIdAndUpdate(userId, { $inc: { totalSessions: 1 } });

    res.status(201).json({
      success: true,
      message: 'Nộp bài thành công',
      data: {
        resultId: result._id,
        score,
        total,
        percentage,
        estimatedBand,
        answers: detailedAnswers,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyResults = async (req, res, next) => {
  try {
    const { skill, page = 1, limit = 10 } = req.query;
    const numericPage = Number(page);
    const numericLimit = Number(limit);

    if (skill === 'reading') {
      const filter = { userId: req.user._id };
      const results = await ReadingSession.find(filter)
        .select('skill testTitle level score total percentage estimatedBand duration completedAt')
        .sort({ completedAt: -1 })
        .limit(numericLimit)
        .skip((numericPage - 1) * numericLimit);

      const total = await ReadingSession.countDocuments(filter);
      return res.status(200).json({ success: true, total, page: numericPage, data: results });
    }

    if (skill === 'listening') {
      const filter = { userId: req.user._id };
      const results = await ListeningSession.find(filter)
        .select('skill testTitle level score total percentage estimatedBand duration completedAt')
        .sort({ completedAt: -1 })
        .limit(numericLimit)
        .skip((numericPage - 1) * numericLimit);

      const total = await ListeningSession.countDocuments(filter);
      return res.status(200).json({ success: true, total, page: numericPage, data: results });
    }

    const [listeningResults, readingResults] = await Promise.all([
      ListeningSession.find({ userId: req.user._id })
        .select('skill testTitle level score total percentage estimatedBand duration completedAt'),
      ReadingSession.find({ userId: req.user._id })
        .select('skill testTitle level score total percentage estimatedBand duration completedAt'),
    ]);

    const merged = [...listeningResults, ...readingResults].sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    );

    const paged = merged.slice((numericPage - 1) * numericLimit, numericPage * numericLimit);

    res.status(200).json({
      success: true,
      total: merged.length,
      page: numericPage,
      data: paged,
    });
  } catch (error) {
    next(error);
  }
};

const getResultById = async (req, res, next) => {
  try {
    const result =
      (await ListeningSession.findOne({ _id: req.params.id, userId: req.user._id })) ||
      (await ReadingSession.findOne({ _id: req.params.id, userId: req.user._id }));

    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitResult, getMyResults, getResultById };
