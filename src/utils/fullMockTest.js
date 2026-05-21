import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveFullMockResult, getFullMockHistory } from '../services/api';

const ACTIVE_SESSION_KEY = 'full_mock_test_active_session';
const HISTORY_KEY = 'full_mock_test_history';

export const FULL_MOCK_SKILL_ORDER = ['listening', 'reading', 'writing', 'speaking'];

const LISTENING_BAND_TABLE = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 32, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 26, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 18, band: 5.5 },
  { min: 16, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 11, band: 4.0 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3.0 },
  { min: 4, band: 2.5 },
  { min: 0, band: 0.0 },
];

const READING_BAND_TABLE = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4.0 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3.0 },
  { min: 4, band: 2.5 },
  { min: 0, band: 0.0 },
];

const safeJsonParse = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const pickRandomItem = (items = []) => {
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

const roundToNearestHalf = (value = 0) => Math.round(value * 2) / 2;

export const getFullMockSkillLabel = (skill) => {
  switch (skill) {
    case 'listening':
      return 'Nghe';
    case 'reading':
      return 'Đọc';
    case 'speaking':
      return 'Nói';
    case 'writing':
      return 'Viết';
    default:
      return skill;
  }
};

export const getFullMockSkillIcon = (skill) => {
  switch (skill) {
    case 'listening':
      return 'headset';
    case 'reading':
      return 'book';
    case 'speaking':
      return 'mic';
    case 'writing':
      return 'create';
    default:
      return 'document-text';
  }
};

export const getFullMockSkillColor = (skill) => {
  switch (skill) {
    case 'listening':
      return '#1565C0';
    case 'reading':
      return '#2E7D32';
    case 'speaking':
      return '#6A1B9A';
    case 'writing':
      return '#E65100';
    default:
      return '#455A64';
  }
};

export const groupWritingTests = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const match = String(item.title || '').match(/Writing\s+(\d+)/i);
    const testNumber = match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    const key = `${item.level}-${testNumber}`;

    if (!groups.has(key)) {
      groups.set(key, {
        _id: key,
        level: item.level,
        testNumber,
        title: `Writing ${String(testNumber).padStart(2, '0')}`,
        tasks: [],
      });
    }

    groups.get(key).tasks.push(item);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      tasks: group.tasks.sort((a, b) => {
        const aMatch = String(a.taskType || '').match(/Task\s+(\d+)/i);
        const bMatch = String(b.taskType || '').match(/Task\s+(\d+)/i);
        const aOrder = aMatch ? Number(aMatch[1]) : Number.MAX_SAFE_INTEGER;
        const bOrder = bMatch ? Number(bMatch[1]) : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      }),
      totalDuration: group.tasks.reduce((sum, task) => sum + (task.timeLimit || 0), 0),
      totalMinWords: group.tasks.reduce((sum, task) => sum + (task.minWords || 0), 0),
    }))
    .sort((a, b) => a.testNumber - b.testNumber);
};

export const groupSpeakingTests = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const match = String(item.title || '').match(/Speaking\s+(\d+)/i);
    const testNumber = match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    const key = `${item.level}-${testNumber}`;

    if (!groups.has(key)) {
      groups.set(key, {
        _id: key,
        level: item.level,
        testNumber,
        title: `Speaking ${String(testNumber).padStart(2, '0')}`,
        tasks: [],
      });
    }

    groups.get(key).tasks.push(item);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      tasks: group.tasks.sort((a, b) => {
        const aMatch = String(a.partType || '').match(/Part\s+(\d+)/i);
        const bMatch = String(b.partType || '').match(/Part\s+(\d+)/i);
        const aOrder = aMatch ? Number(aMatch[1]) : Number.MAX_SAFE_INTEGER;
        const bOrder = bMatch ? Number(bMatch[1]) : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      }),
      totalDuration: group.tasks.reduce((sum, task) => sum + (task.timeLimit || 0), 0),
    }))
    .sort((a, b) => a.testNumber - b.testNumber);
};

export const createFullMockSession = ({ listening, reading, speaking, writing }) => ({
  id: `full-mock-${Date.now()}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'in_progress',
  selectedTests: { listening, reading, speaking, writing },
  progress: {
    listening: { status: 'not_started' },
    reading: { status: 'not_started' },
    speaking: { status: 'not_started' },
    writing: { status: 'not_started' },
  },
});

export const buildRandomFullMockSelection = ({
  listeningTests = [],
  readingTests = [],
  writingTests = [],
  speakingTests = [],
}) => {
  const selection = {
    listening: pickRandomItem(listeningTests),
    reading: pickRandomItem(readingTests),
    writing: pickRandomItem(groupWritingTests(writingTests)),
    speaking: pickRandomItem(groupSpeakingTests(speakingTests)),
  };

  if (!selection.listening || !selection.reading || !selection.writing || !selection.speaking) {
    throw new Error('Không đủ dữ liệu đề thi để tạo bài thi tổng hợp.');
  }

  return selection;
};

export const loadActiveFullMockSession = async () => {
  const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  return safeJsonParse(raw, null);
};

export const saveActiveFullMockSession = async (session) => {
  if (!session) return;
  await AsyncStorage.setItem(
    ACTIVE_SESSION_KEY,
    JSON.stringify({
      ...session,
      updatedAt: new Date().toISOString(),
    })
  );
};

export const clearActiveFullMockSession = async () => {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
};

export const updateFullMockProgress = async (skill, payload = {}) => {
  const session = await loadActiveFullMockSession();
  if (!session || !skill) return null;
  const currentProgress = session.progress?.[skill] || {};

  // Once a skill is completed in the full test flow, do not let later autosaves
  // downgrade it back to in-progress.
  if (currentProgress.status === 'completed' && payload.status !== 'completed') {
    return session;
  }

  const nextSession = {
    ...session,
    progress: {
      ...session.progress,
      [skill]: {
        ...currentProgress,
        ...payload,
      },
    },
    updatedAt: new Date().toISOString(),
  };

  await saveActiveFullMockSession(nextSession);
  return nextSession;
};

export const getNextFullMockSkill = (session) => {
  if (!session?.progress) return FULL_MOCK_SKILL_ORDER[0];
  return (
    FULL_MOCK_SKILL_ORDER.find((skill) => session.progress?.[skill]?.status !== 'completed') ||
    null
  );
};

export const isFullMockReadyForSubmit = (session) =>
  FULL_MOCK_SKILL_ORDER.every((skill) => session?.progress?.[skill]?.status === 'completed');

export const calculateObjectiveBand = (skill, correct = 0, total = 0) => {
  if (!total) return 0;
  const scaledScore = Math.round((correct / total) * 40);
  const table = skill === 'listening' ? LISTENING_BAND_TABLE : READING_BAND_TABLE;
  return table.find((item) => scaledScore >= item.min)?.band || 0;
};

export const convertFiveScaleToNineBand = (value) => {
  const numericValue = Number(value);
  if (!numericValue) return 0;
  const converted = 1 + (numericValue - 1) * 2;
  return Math.max(0, Math.min(9, roundToNearestHalf(converted)));
};

export const calculateOverallBand = (bands = []) => {
  const numericBands = bands.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!numericBands.length) return 0;

  const average = numericBands.reduce((sum, value) => sum + value, 0) / numericBands.length;
  const decimal = average - Math.floor(average);

  if (decimal < 0.25) return Math.floor(average);
  if (decimal < 0.75) return Math.floor(average) + 0.5;
  return Math.ceil(average);
};

export const loadFullMockHistory = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const response = await getFullMockHistory({ limit: 50 });
      if (response?.data?.success) {
        const serverItems = response.data.data || [];
        const mappedItems = serverItems.map((item) => ({
          ...item,
          id: item._id || item.id,
        }));
        await saveFullMockHistory(mappedItems);
        return mappedItems;
      }
    }
  } catch (error) {
    console.warn('Lỗi tải lịch sử thi toàn diện từ server, dùng local:', error.message);
  }

  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return safeJsonParse(raw, []);
};

export const saveFullMockHistory = async (items = []) => {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
};

export const appendFullMockHistory = async (entry) => {
  const current = await loadFullMockHistory();
  const next = [entry, ...current].sort(
    (a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0)
  );
  await saveFullMockHistory(next);

  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      await saveFullMockResult(entry);
    }
  } catch (error) {
    console.warn('Lỗi đồng bộ kết quả bài thi toàn diện lên server:', error.message);
  }

  return next;
};

export const getLatestFullMockHistory = async () => {
  const history = await loadFullMockHistory();
  return history[0] || null;
};

