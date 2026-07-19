import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.friendlyMessage = 'Tidak bisa terhubung ke server. Pastikan backend Laravel sedang jalan.';
    } else {
      error.friendlyMessage =
        error.response.data?.message ||
        Object.values(error.response.data?.errors || {})[0]?.[0] ||
        'Terjadi kesalahan, coba lagi.';
    }
    return Promise.reject(error);
  }
);

export default api;