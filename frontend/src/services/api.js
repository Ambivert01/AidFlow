// frontend/src/services/api.js
import axios from "axios";
import authService from "./auth.service";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("aidflow_refresh_token");

    if (!refreshToken) {
      // No refresh token, logout user
      isRefreshing = false;
      authService.logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      // Call refresh endpoint
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
      );

      const { accessToken } = response.data.data;

      // Update stored token
      localStorage.setItem("aidflow_token", accessToken);

      // Update authorization header
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Process queued requests
      processQueue(null, accessToken);

      isRefreshing = false;

      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, logout user
      processQueue(refreshError, null);
      isRefreshing = false;

      authService.logout();
      window.location.href = "/login";

      return Promise.reject(refreshError);
    }
  },
);

export default api;
