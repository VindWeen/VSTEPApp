import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 📱 Test trên Expo Go: đổi thành IP LAN của máy tính (chạy ipconfig để xem)
// 💻 Test trên web browser: đổi lại thành 'http://localhost:5000/api'
// const BASE_URL = 'http://192.168.1.100:5000/api';
const BASE_URL = 'http://192.168.1.103:5000/api';

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
  api.get('/listening-tests', { params });

export const getListeningDetail = (id) =>
  api.get(`/listening-tests/${id}`);

export const getListeningAnswers = (id) =>
  api.get(`/listening-tests/${id}/answers`);

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
export const getResultById = (id) => api.get(`/results/${id}`);

// Writing
export const scoreWriting = (payload) => api.post('/writing/score', payload);
export const scoreWritingTest = (payload) => api.post('/writing/score-test', payload);
export const getWritingHistory = (params) => api.get('/writing', { params });
export const getWritingTests = (params) => api.get('/writing/tests', { params });
export const getWritingSessionById = (id) => api.get(`/writing/${id}`);

// Speaking
export const uploadSpeaking = (formData) =>
  api.post('/speaking/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const transcribeSpeaking = (speakingId) =>
  api.post('/speaking/transcribe', { speakingId });
export const scoreSpeaking = (speakingId) =>
  api.post('/speaking/score', { speakingId });
export const scoreSpeakingTest = (payload) =>
  api.post('/speaking/score-test', payload, { timeout: 60000 });
export const getSpeakingTests = (params) => api.get('/speaking/tests', { params });
export const getSpeakingHistory = (params) => api.get('/speaking', { params });
export const getSpeakingSessionById = (id) => api.get(`/speaking/${id}`);

// Admin
export const adminGetQuestions = (skill, params) =>
  skill === 'listening'
    ? api.get('/admin/listening-tests', { params })
    : api.get(`/admin/questions/${skill}`, { params });
export const adminCreateQuestion = (skill, payload) =>
  skill === 'listening'
    ? api.post('/admin/listening-tests', payload)
    : api.post(`/admin/questions/${skill}`, payload);
export const adminUpdateQuestion = (skill, id, payload) =>
  skill === 'listening'
    ? api.put(`/admin/listening-tests/${id}`, payload)
    : api.put(`/admin/questions/${skill}/${id}`, payload);
export const adminDeleteQuestion = (skill, id) =>
  skill === 'listening'
    ? api.delete(`/admin/listening-tests/${id}`)
    : api.delete(`/admin/questions/${skill}/${id}`);

export const adminGetWritingPrompts = (params) =>
  api.get('/admin/writing-prompts', { params });
export const adminCreateWritingPrompt = (payload) =>
  api.post('/admin/writing-prompts', payload);
export const adminUpdateWritingPrompt = (id, payload) =>
  api.put(`/admin/writing-prompts/${id}`, payload);
export const adminDeleteWritingPrompt = (id) =>
  api.delete(`/admin/writing-prompts/${id}`);

export const adminGetSpeakingPrompts = (params) =>
  api.get('/admin/speaking-prompts', { params });
export const adminCreateSpeakingPrompt = (payload) =>
  api.post('/admin/speaking-prompts', payload);
export const adminUpdateSpeakingPrompt = (id, payload) =>
  api.put(`/admin/speaking-prompts/${id}`, payload);
export const adminDeleteSpeakingPrompt = (id) =>
  api.delete(`/admin/speaking-prompts/${id}`);

export default api;
