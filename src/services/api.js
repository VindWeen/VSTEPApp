import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 📱 Test trên Expo Go: đổi thành IP LAN của máy tính (chạy ipconfig để xem)
// 💻 Test trên web browser: đổi lại thành 'http://localhost:5000/api'
// const BASE_URL = 'http://192.168.1.100:5000/api';
const BASE_URL = 'http://192.168.1.10:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Tự động gắn token vào mọi request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (name, email, password, level) =>
  api.post('/auth/register', { name, email, password, level });

export const getMe = () => api.get('/auth/me');

// Listening / Questions
export const getListeningTests = (params) =>
  api.get('/questions/listening', { params });

export const getListeningDetail = (id) =>
  api.get(`/questions/listening/${id}`);

export const getListeningAnswers = (id) =>
  api.get(`/questions/${id}/answers`);

// Reading
export const getReadingTests = (params) =>
  api.get('/questions/reading', { params });

export const getReadingDetail = (id) =>
  api.get(`/questions/reading/${id}`);

export const getReadingAnswers = (id) =>
  api.get(`/questions/${id}/answers`);

// Results
export const submitResult = (payload) => api.post('/results', payload);
export const getMyResults = (params) => api.get('/results', { params });

// Writing
export const scoreWriting = (payload) => api.post('/writing/score', payload);
export const getWritingHistory = (params) => api.get('/writing', { params });
export const getWritingTests = (params) => api.get('/writing/tests', { params });

// Speaking
export const uploadSpeaking = (formData) =>
  api.post('/speaking/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const transcribeSpeaking = (speakingId) =>
  api.post('/speaking/transcribe', { speakingId });
export const scoreSpeaking = (speakingId) =>
  api.post('/speaking/score', { speakingId });
export const getSpeakingTests = (params) => api.get('/speaking/tests', { params });
export const getSpeakingHistory = (params) => api.get('/speaking', { params });

export default api;
