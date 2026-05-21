const ListeningTest = require('../models/ListeningTest');
const ReadingTest = require('../models/ReadingTest');

// GET /api/questions/listening
// Query: ?level=B2&page=1&limit=10
const getListeningTests = async (req, res, next) => {
  try {
    const { level, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (level) filter.level = level;

    const tests = await ListeningTest.find(filter)
      .select('title level duration totalQuestions description createdAt') // Không trả về parts (nặng)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ListeningTest.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data: tests,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/questions/listening/:id
// Trả về đầy đủ đề thi bao gồm parts + questions (KHÔNG bao gồm correctAnswer – chỉ trả sau khi nộp bài)
const getListeningTestById = async (req, res, next) => {
  try {
    const test = await ListeningTest.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    // Xóa correctAnswer khỏi response để không lộ đáp án
    const testObj = test.toObject();
    testObj.parts = testObj.parts.map((part) => ({
      ...part,
      questions: part.questions.map(({ correctAnswer, explanation, ...q }) => q),
    }));

    res.status(200).json({ success: true, data: testObj });
  } catch (error) {
    next(error);
  }
};

// GET /api/questions/reading  
const getReadingTests = async (req, res, next) => {
  try {
    const { level, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (level) filter.level = level;

    const tests = await ReadingTest.find(filter)
      .select('title level duration totalQuestions description createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ReadingTest.countDocuments(filter);

    res.status(200).json({ success: true, total, page: Number(page), data: tests });
  } catch (error) {
    next(error);
  }
};

// GET /api/questions/reading/:id
const getReadingTestById = async (req, res, next) => {
  try {
    const test = await ReadingTest.findOne({ _id: req.params.id, isActive: true });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    // Ẩn đáp án
    const testObj = test.toObject();
    testObj.parts = testObj.parts.map((part) => ({
      ...part,
      questions: part.questions.map(({ correctAnswer, explanation, ...q }) => q),
    }));

    res.status(200).json({ success: true, data: testObj });
  } catch (error) {
    next(error);
  }
};

// GET /api/questions/:id/answers  (chỉ dùng sau khi nộp bài để hiển thị đáp án)
const getAnswers = async (req, res, next) => {
  try {
    const test =
      (await ListeningTest.findById(req.params.id)) ||
      (await ReadingTest.findById(req.params.id));
    if (!test) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    // Trả về chỉ correctAnswer + explanation
    const answers = [];
    test.parts.forEach((part) => {
      part.questions.forEach((q) => {
        answers.push({
          questionNumber: q.questionNumber,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        });
      });
    });

    res.status(200).json({ success: true, data: answers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListeningTests,
  getListeningTestById,
  getReadingTests,
  getReadingTestById,
  getAnswers,
};
