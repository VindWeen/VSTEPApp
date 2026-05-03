const Result = require('../models/Result');
const Question = require('../models/Question');
const User = require('../models/User');

// Hàm ước tính Band Score từ % đúng (theo thang VSTEP)
const estimateBand = (percentage) => {
  if (percentage >= 90) return 'C1';
  if (percentage >= 75) return 'B2';
  if (percentage >= 60) return 'B1';
  if (percentage >= 40) return 'A2';
  return 'A1';
};

// POST /api/results
// Body: { testId, skill, answers: [{ questionNumber, userAnswer }], duration }
const submitResult = async (req, res, next) => {
  try {
    const { testId, skill, answers, duration } = req.body;
    const userId = req.user._id;

    // Lấy đề thi kèm đáp án
    const test = await Question.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    // Xây dựng map đáp án đúng
    const answerMap = {};
    test.parts.forEach((part) => {
      part.questions.forEach((q) => {
        answerMap[q.questionNumber] = { correctAnswer: q.correctAnswer, explanation: q.explanation };
      });
    });

    // Chấm điểm
    let score = 0;
    const detailedAnswers = answers.map(({ questionNumber, userAnswer }) => {
      const correct = answerMap[questionNumber]?.correctAnswer;
      const isCorrect = correct && userAnswer === correct;
      if (isCorrect) score++;
      return { questionNumber, userAnswer, correctAnswer: correct, isCorrect };
    });

    const total = test.totalQuestions;
    const percentage = Math.round((score / total) * 100);
    const estimatedBand = estimateBand(percentage);

    // Lưu kết quả
    const result = await Result.create({
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

    // Cập nhật totalSessions của user
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

// GET /api/results?skill=listening&page=1&limit=10
const getMyResults = async (req, res, next) => {
  try {
    const { skill, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user._id };
    if (skill) filter.skill = skill;

    const results = await Result.find(filter)
      .select('skill testTitle level score total percentage estimatedBand duration completedAt')
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Result.countDocuments(filter);

    res.status(200).json({ success: true, total, page: Number(page), data: results });
  } catch (error) {
    next(error);
  }
};

// GET /api/results/:id
const getResultById = async (req, res, next) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, userId: req.user._id });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả' });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitResult, getMyResults, getResultById };
