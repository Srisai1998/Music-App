/// <reference types="vite/client" />
import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

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

export const songsAPI = {
  list: (params?: any) => api.get('/songs', { params }),
  create: (data: FormData) => api.post('/songs', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.put(`/songs/${id}`, data),
  delete: (id: string) => api.delete(`/songs/${id}`),
};

export const artistsAPI = {
  list: (params?: any) => api.get('/artists', { params }),
  create: (data: FormData) => api.post('/artists', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};
