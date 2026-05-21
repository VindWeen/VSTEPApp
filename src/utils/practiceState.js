import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'practice_state';

const buildStorageKey = (skill, testKey) => `${PREFIX}:${skill}:${testKey}`;

export const getPracticeStateKey = buildStorageKey;

export const savePracticeState = async (skill, testKey, payload) => {
  if (!skill || !testKey) return;
  await AsyncStorage.setItem(
    buildStorageKey(skill, testKey),
    JSON.stringify({
      ...payload,
      updatedAt: new Date().toISOString(),
    })
  );
};

export const loadPracticeState = async (skill, testKey) => {
  if (!skill || !testKey) return null;
  const raw = await AsyncStorage.getItem(buildStorageKey(skill, testKey));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearPracticeState = async (skill, testKey) => {
  if (!skill || !testKey) return;
  await AsyncStorage.removeItem(buildStorageKey(skill, testKey));
};

export const loadPracticeStates = async (skill, testKeys = []) => {
  const keys = testKeys
    .filter(Boolean)
    .map((testKey) => buildStorageKey(skill, testKey));

  if (!keys.length) return {};

  const pairs = await AsyncStorage.multiGet(keys);
  return pairs.reduce((acc, [storageKey, raw]) => {
    if (!raw) return acc;

    try {
      acc[storageKey] = JSON.parse(raw);
    } catch {
      acc[storageKey] = null;
    }

    return acc;
  }, {});
};
