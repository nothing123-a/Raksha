import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_API_URL || 'https://raksha-mr6w.onrender.com/api';

// Normalize: remove trailing slash
rawBaseURL = rawBaseURL.trim().replace(/\/+$/, '');

// Automatically ensure /api is included if omitted in environment variables
if (!rawBaseURL.endsWith('/api')) {
  rawBaseURL = `${rawBaseURL}/api`;
}

const api = axios.create({
  baseURL: rawBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage if present as fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mitaoe_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login page, let AuthContext handle state
    }
    return Promise.reject(error);
  }
);

export default api;
