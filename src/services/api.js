import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password }).then((r) => r.data);

export const getTemplates = () =>
  api.get('/api/templates').then((r) => r.data);

export const getTemplate = (id) =>
  api.get(`/api/templates/${id}`).then((r) => r.data);

export const createTemplate = (name, labelData) =>
  api.post('/api/templates', { name, label_data: labelData }).then((r) => r.data);

export const updateTemplate = (id, name, labelData) =>
  api.put(`/api/templates/${id}`, { name, label_data: labelData }).then((r) => r.data);

export const deleteTemplate = (id) =>
  api.delete(`/api/templates/${id}`).then((r) => r.data);

export default api;
