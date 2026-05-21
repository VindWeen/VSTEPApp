require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ListeningTest = require('../models/ListeningTest');
const ReadingTest = require('../models/ReadingTest');
const WritingPrompt = require('../models/WritingPrompt');
const SpeakingPrompt = require('../models/SpeakingPrompt');

const ROOT_DIR = path.join(__dirname, '../../../');
const EXAM_DIR = path.join(ROOT_DIR, '.docs', 'Exam');

const FILES = {
  listening: path.join(EXAM_DIR, 'listening.json'),
  reading: path.join(EXAM_DIR, 'reading_converted.json'),
  writing: path.join(EXAM_DIR, 'writing_converted.json'),
  speaking: path.join(EXAM_DIR, 'speaking_converted.json'),
};

const MODES = new Set(['listening', 'reading', 'writing', 'speaking', 'all']);

const readJsonFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`File ${path.basename(filePath)} phải là một mảng JSON`);
  }

  return parsed;
};

const summarizeQuestionSet = (items) => ({
  tests: items.length,
  parts: items.reduce((sum, item) => sum + item.parts.length, 0),
  questions: items.reduce(
    (sum, item) => sum + item.parts.reduce((partSum, part) => partSum + part.questions.length, 0),
    0
  ),
});

const validateListening = (items) => {
  const errors = [];

  items.forEach((test, testIndex) => {
    if (!Array.isArray(test.parts) || test.parts.length === 0) {
      errors.push(`Listening test #${testIndex + 1} khong co parts`);
      return;
    }

    const actualQuestions = test.parts.reduce(
      (sum, part) => sum + (Array.isArray(part.questions) ? part.questions.length : 0),
      0
    );

    if (test.totalQuestions !== actualQuestions) {
      errors.push(
        `${test.title || `Listening test #${testIndex + 1}`} co totalQuestions=${test.totalQuestions} nhung thuc te=${actualQuestions}`
      );
    }

    test.parts.forEach((part, partIndex) => {
      if (!part.audioUrl) {
        errors.push(`${test.title} - part ${partIndex + 1} thieu audioUrl`);
      }

      if (!Array.isArray(part.questions) || part.questions.length === 0) {
        errors.push(`${test.title} - part ${partIndex + 1} khong co questions`);
        return;
      }

      part.questions.forEach((question) => {
        if (!question.questionText) {
          errors.push(`${test.title} - cau ${question.questionNumber} thieu questionText`);
        }

        if (!question.correctAnswer) {
          errors.push(`${test.title} - cau ${question.questionNumber} thieu correctAnswer`);
        }

        if (question.questionType === 'MCQ') {
          ['A', 'B', 'C', 'D'].forEach((optionKey) => {
            if (!question.options || !question.options[optionKey]) {
              errors.push(
                `${test.title} - cau ${question.questionNumber} thieu option ${optionKey}`
              );
            }
          });
        }
      });
    });
  });

  if (errors.length) {
    throw new Error(`listening.json khong hop le:\n- ${errors.slice(0, 20).join('\n- ')}`);
  }
};

const validateReading = (items) => {
  const errors = [];

  items.forEach((test, testIndex) => {
    if (!Array.isArray(test.parts) || test.parts.length === 0) {
      errors.push(`Reading test #${testIndex + 1} không có parts`);
      return;
    }

    test.parts.forEach((part, partIndex) => {
      if (!part.passageText) {
        errors.push(`${test.title} - part ${partIndex + 1} thiếu passageText`);
      }

      if (!Array.isArray(part.questions) || part.questions.length === 0) {
        errors.push(`${test.title} - part ${partIndex + 1} không có questions`);
        return;
      }

      part.questions.forEach((question) => {
        if (!question.correctAnswer) {
          errors.push(`${test.title} - câu ${question.questionNumber} thiếu correctAnswer`);
        }
      });
    });
  });

  if (errors.length) {
    throw new Error(`reading_converted.json không hợp lệ:\n- ${errors.slice(0, 20).join('\n- ')}`);
  }
};

const validateWriting = (items) => {
  const errors = [];

  items.forEach((item, index) => {
    if (!item.prompt) {
      errors.push(`Writing item #${index + 1} thiếu prompt`);
    }
    if (typeof item.timeLimit !== 'number') {
      errors.push(`${item.title || `Writing item #${index + 1}`} có timeLimit không phải number`);
    }
    if (typeof item.minWords !== 'number') {
      errors.push(`${item.title || `Writing item #${index + 1}`} có minWords không phải number`);
    }
  });

  if (errors.length) {
    throw new Error(`writing_converted.json không hợp lệ:\n- ${errors.slice(0, 20).join('\n- ')}`);
  }
};

const validateSpeaking = (items) => {
  const errors = [];

  items.forEach((item, index) => {
    const name = item.title || `Speaking item #${index + 1}`;

    if (!item.prompt) {
      errors.push(`${name} thiếu prompt`);
    }
    if (!Array.isArray(item.cueCard)) {
      errors.push(`${name} có cueCard không phải mảng`);
    }
    if (!Array.isArray(item.followUpQuestions)) {
      errors.push(`${name} có followUpQuestions không phải mảng`);
    }
    if (typeof item.timeLimit !== 'number') {
      errors.push(`${name} có timeLimit không phải number`);
    }
  });

  if (errors.length) {
    throw new Error(`speaking_converted.json không hợp lệ:\n- ${errors.slice(0, 20).join('\n- ')}`);
  }
};

const importListening = async () => {
  const items = readJsonFile(FILES.listening);
  validateListening(items);

  const deleted = await ListeningTest.deleteMany({});
  const inserted = await ListeningTest.insertMany(items);
  const summary = summarizeQuestionSet(items);

  console.log(`Da xoa ${deleted.deletedCount} de Listening cu`);
  console.log(
    `Da import ${inserted.length} de Listening (${summary.parts} parts, ${summary.questions} cau hoi)`
  );
};

const importReading = async () => {
  const items = readJsonFile(FILES.reading);
  validateReading(items);

  const deleted = await ReadingTest.deleteMany({});
  const inserted = await ReadingTest.insertMany(items.map((item) => ({ ...item, skill: 'reading' })));
  const summary = summarizeQuestionSet(items);

  console.log(`🗑️  Đã xóa ${deleted.deletedCount} đề Reading cũ`);
  console.log(
    `✅ Đã import ${inserted.length} đề Reading (${summary.parts} parts, ${summary.questions} câu hỏi)`
  );
};

const importWriting = async () => {
  const items = readJsonFile(FILES.writing);
  validateWriting(items);

  const deleted = await WritingPrompt.deleteMany({});
  const inserted = await WritingPrompt.insertMany(items);

  console.log(`🗑️  Đã xóa ${deleted.deletedCount} đề Writing cũ`);
  console.log(`✅ Đã import ${inserted.length} prompt Writing`);
};

const importSpeaking = async () => {
  const items = readJsonFile(FILES.speaking);
  validateSpeaking(items);

  const deleted = await SpeakingPrompt.deleteMany({});
  const inserted = await SpeakingPrompt.insertMany(items);

  console.log(`🗑️  Đã xóa ${deleted.deletedCount} đề Speaking cũ`);
  console.log(`✅ Đã import ${inserted.length} prompt Speaking`);
};

const run = async () => {
  const mode = (process.argv[2] || 'all').toLowerCase();

  if (!MODES.has(mode)) {
    throw new Error(`Mode không hợp lệ: ${mode}. Dùng một trong các giá trị: ${[...MODES].join(', ')}`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Kết nối MongoDB thành công');

  if (mode === 'listening' || mode === 'all') {
    await importListening();
  }

  if (mode === 'reading' || mode === 'all') {
    await importReading();
  }

  if (mode === 'writing' || mode === 'all') {
    await importWriting();
  }

  if (mode === 'speaking' || mode === 'all') {
    await importSpeaking();
  }

  await mongoose.disconnect();
  console.log('🎉 Import hoàn thành');
};

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('❌ Import thất bại:', error.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect failures in error path
    }
    process.exit(1);
  });
