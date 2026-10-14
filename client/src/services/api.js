import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
let formattedApiUrl = rawApiUrl ? rawApiUrl.trim() : '';
if (formattedApiUrl && !formattedApiUrl.startsWith('http://') && !formattedApiUrl.startsWith('https://')) {
  formattedApiUrl = `https://${formattedApiUrl}`;
}
const baseURL = formattedApiUrl ? `${formattedApiUrl.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthPath = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthPath) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
