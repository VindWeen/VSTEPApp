const ListeningTest = require('../models/ListeningTest');
const ReadingTest = require('../models/ReadingTest');
const WritingPrompt = require('../models/WritingPrompt');
const SpeakingPrompt = require('../models/SpeakingPrompt');

const getQuestionModelBySkill = (skill) => (skill === 'reading' ? ReadingTest : ListeningTest);

const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
};

const listQuestions = async (req, res, next) => {
  try {
    const skill = req.params.skill || 'listening';
    const { level, isActive } = req.query;
    const Model = getQuestionModelBySkill(skill);
    const filter = {};

    if (level) filter.level = level;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const questions = await Model.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const skill = req.params.skill || 'listening';
    const Model = getQuestionModelBySkill(skill);
    const payload = req.body;
    const question = await Model.create(payload);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const skill = req.params.skill || 'listening';
    const { id } = req.params;
    const Model = getQuestionModelBySkill(skill);
    const filter = { _id: id };
    const payload = req.body;
    const question = await Model.findOneAndUpdate(filter, payload, { new: true, runValidators: true });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const skill = req.params.skill || 'listening';
    const { id } = req.params;
    const Model = getQuestionModelBySkill(skill);
    const filter = { _id: id };
    const question = await Model.findOneAndDelete(filter);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    res.status(200).json({ success: true, message: 'Đã xóa đề thi' });
  } catch (error) {
    next(error);
  }
};

const listWritingPrompts = async (req, res, next) => {
  try {
    const { level, isActive } = req.query;
    const filter = {};
    if (level) filter.level = level;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const prompts = await WritingPrompt.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: prompts });
  } catch (error) {
    next(error);
  }
};

const createWritingPrompt = async (req, res, next) => {
  try {
    const prompt = await WritingPrompt.create(req.body);
    res.status(201).json({ success: true, data: prompt });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateWritingPrompt = async (req, res, next) => {
  try {
    const prompt = await WritingPrompt.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!prompt) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề Writing' });
    }

    res.status(200).json({ success: true, data: prompt });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteWritingPrompt = async (req, res, next) => {
  try {
    const prompt = await WritingPrompt.findByIdAndDelete(req.params.id);

    if (!prompt) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề Writing' });
    }

    res.status(200).json({ success: true, message: 'Đã xóa đề Writing' });
  } catch (error) {
    next(error);
  }
};

const listSpeakingPrompts = async (req, res, next) => {
  try {
    const { level, partType, isActive } = req.query;
    const filter = {};
    if (level) filter.level = level;
    if (partType) filter.partType = partType;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const prompts = await SpeakingPrompt.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: prompts });
  } catch (error) {
    next(error);
  }
};

const createSpeakingPrompt = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      cueCard: normalizeStringArray(req.body.cueCard),
      followUpQuestions: normalizeStringArray(req.body.followUpQuestions),
    };
    const prompt = await SpeakingPrompt.create(payload);
    res.status(201).json({ success: true, data: prompt });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateSpeakingPrompt = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      cueCard: normalizeStringArray(req.body.cueCard),
      followUpQuestions: normalizeStringArray(req.body.followUpQuestions),
    };

    const prompt = await SpeakingPrompt.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!prompt) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề Speaking' });
    }

    res.status(200).json({ success: true, data: prompt });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteSpeakingPrompt = async (req, res, next) => {
  try {
    const prompt = await SpeakingPrompt.findByIdAndDelete(req.params.id);

    if (!prompt) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề Speaking' });
    }

    res.status(200).json({ success: true, message: 'Đã xóa đề Speaking' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listWritingPrompts,
  createWritingPrompt,
  updateWritingPrompt,
  deleteWritingPrompt,
  listSpeakingPrompts,
  createSpeakingPrompt,
  updateSpeakingPrompt,
  deleteSpeakingPrompt,
};
