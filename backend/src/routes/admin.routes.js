const express = require('express');
const {
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
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/listening-tests', listQuestions);
router.post('/listening-tests', createQuestion);
router.put('/listening-tests/:id', updateQuestion);
router.delete('/listening-tests/:id', deleteQuestion);

router.get('/questions/:skill(listening|reading)', listQuestions);
router.post('/questions/:skill(listening|reading)', createQuestion);
router.put('/questions/:skill(listening|reading)/:id', updateQuestion);
router.delete('/questions/:skill(listening|reading)/:id', deleteQuestion);

router.get('/writing-prompts', listWritingPrompts);
router.post('/writing-prompts', createWritingPrompt);
router.put('/writing-prompts/:id', updateWritingPrompt);
router.delete('/writing-prompts/:id', deleteWritingPrompt);

router.get('/speaking-prompts', listSpeakingPrompts);
router.post('/speaking-prompts', createSpeakingPrompt);
router.put('/speaking-prompts/:id', updateSpeakingPrompt);
router.delete('/speaking-prompts/:id', deleteSpeakingPrompt);

module.exports = router;
