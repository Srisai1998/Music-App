import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest as any);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── API Service Methods ────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: FormData) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
};

export const songsAPI = {
  list: (params?: any) => api.get('/songs', { params }),
  get: (id: string) => api.get(`/songs/${id}`),
  trending: (limit?: number) => api.get('/songs/trending', { params: { limit } }),
  search: (q: string, params?: any) => api.get('/songs/search', { params: { q, ...params } }),
  create: (data: FormData) => api.post('/songs', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.put(`/songs/${id}`, data),
  delete: (id: string) => api.delete(`/songs/${id}`),
};

export const artistsAPI = {
  list: (params?: any) => api.get('/artists', { params }),
  get: (id: string) => api.get(`/artists/${id}`),
  create: (data: FormData) => api.post('/artists', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  follow: (id: string) => api.post(`/artists/${id}/follow`),
  albums: (id: string) => api.get(`/artists/${id}/albums`),
};

export const albumsAPI = {
  list: (params?: any) => api.get('/albums', { params }),
  get: (id: string) => api.get(`/albums/${id}`),
};

export const playlistsAPI = {
  list: (params?: any) => api.get('/playlists', { params }),
  my: () => api.get('/playlists/my'),
  get: (id: string) => api.get(`/playlists/${id}`),
  create: (data: FormData) => api.post('/playlists', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/playlists/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/playlists/${id}`),
  addSong: (id: string, song_id: string) => api.post(`/playlists/${id}/songs`, { song_id }),
  removeSong: (id: string, songId: string) => api.delete(`/playlists/${id}/songs/${songId}`),
};

export const favoritesAPI = {
  list: (params?: any) => api.get('/favorites', { params }),
  toggle: (songId: string) => api.post(`/favorites/${songId}`),
  check: (songId: string) => api.get(`/favorites/${songId}/check`),
};

export const historyAPI = {
  list: (params?: any) => api.get('/history', { params }),
  recent: () => api.get('/history/recent'),
  record: (song_id: string) => api.post('/history/record', { song_id }),
};

export const recommendationsAPI = {
  get: () => api.get('/recommendations'),
};

export const subscriptionsAPI = {
  checkout: (plan: string) => api.post('/subscriptions/checkout', { plan }),
  get: () => api.get('/subscriptions/me'),
  cancel: () => api.delete('/subscriptions/cancel'),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  userAnalytics: (days?: number) => api.get('/admin/analytics/users', { params: { days } }),
  songAnalytics: (days?: number) => api.get('/admin/analytics/songs', { params: { days } }),
  revenueAnalytics: (days?: number) => api.get('/admin/analytics/revenue', { params: { days } }),
  users: (params?: any) => api.get('/admin/users', { params }),
  toggleUser: (userId: string) => api.patch(`/admin/users/${userId}/status`),
  ads: (params?: any) => api.get('/admin/ads', { params }),
  createAd: (data: FormData) => api.post('/admin/ads', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleAd: (id: string) => api.patch(`/admin/ads/${id}/toggle`),
};
