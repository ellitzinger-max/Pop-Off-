import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const api = {
  setToken: (token: string | null) => {
    authToken = token;
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },

  // Auth
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  signup: async (name: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/signup', { name, email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Profile
  updateProfile: async (data: any) => {
    const response = await apiClient.put('/profile', data);
    return response.data;
  },

  uploadPhoto: async (photoBase64: string) => {
    const response = await apiClient.post('/profile/photo', { photo: photoBase64 });
    return response.data;
  },

  // Topics
  getTopics: async () => {
    const response = await apiClient.get('/topics');
    return response.data;
  },

  getTopicCategories: async () => {
    const response = await apiClient.get('/topics/categories');
    return response.data;
  },

  // Matching
  startMatching: async (mood: string, customMessage: string = '', interests: string[] = []) => {
    const response = await apiClient.post('/match/search', {
      mood,
      custom_message: customMessage,
      interests,
    });
    return response.data;
  },

  getMatchStatus: async () => {
    const response = await apiClient.get('/match/status');
    return response.data;
  },

  cancelMatch: async () => {
    const response = await apiClient.post('/match/cancel');
    return response.data;
  },

  endCall: async () => {
    const response = await apiClient.post('/match/end');
    return response.data;
  },

  // Agora
  getAgoraToken: async (channel: string) => {
    const response = await apiClient.get(`/agora/token?channel=${channel}`);
    return response.data;
  },

  getAgoraAppId: async () => {
    const response = await apiClient.get('/agora/app-id');
    return response.data;
  },

  // Match History
  getMatchHistory: async () => {
    const response = await apiClient.get('/matches/history');
    return response.data;
  },

  // Hot Topics
  getHotTopics: async () => {
    const response = await apiClient.get('/hot');
    return response.data;
  },
};
