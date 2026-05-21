import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'vstep_cache_';

export const getCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Cache read error for key ${key}:`, e.message);
    return null;
  }
};

export const setCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Cache write error for key ${key}:`, e.message);
  }
};

export const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch (e) {
    console.warn(`Cache clear error for key ${key}:`, e.message);
  }
};
