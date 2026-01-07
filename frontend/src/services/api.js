// frontend/src/services/api.js
import axios from "axios";
import  authService  from "./auth.service";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
// });

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});


api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
