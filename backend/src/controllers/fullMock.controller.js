const FullMockResult = require('../models/FullMockResult');

const saveFullMockResult = async (req, res, next) => {
  try {
    const { overallBand, selectedTests, skills, completedAt } = req.body;
    const userId = req.user._id;

    if (overallBand === undefined || !selectedTests || !skills) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không đầy đủ' });
    }

    const result = await FullMockResult.create({
      userId,
      overallBand,
      selectedTests,
      skills,
      completedAt: completedAt || new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Lưu kết quả bài thi toàn diện thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFullMockHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const numericPage = Number(page);
    const numericLimit = Number(limit);

    const filter = { userId };
    const results = await FullMockResult.find(filter)
      .sort({ completedAt: -1 })
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit);

    const total = await FullMockResult.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: numericPage,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveFullMockResult,
  getMyFullMockHistory,
};
