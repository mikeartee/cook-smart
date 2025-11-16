import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((axiosConfig) => {
  const token = localStorage.getItem(config.tokenKey);
  if (token && axiosConfig.headers) {
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  return axiosConfig;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(config.tokenKey);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
