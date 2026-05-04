import { create } from "zustand";
import api from "../services/api";

const TOKEN_KEY = "aidflow_token";
const REFRESH_TOKEN_KEY = "aidflow_refresh_token";
const USER_KEY = "aidflow_user";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem(USER_KEY)) || null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || null,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", credentials);
      // Backend returns { success, message, data: { user, accessToken, refreshToken } }
      const { user, accessToken, refreshToken } = res.data.data;
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token: accessToken, refreshToken, loading: false });
      return { user, accessToken, refreshToken };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        // Revoke refresh token on backend
        await api.post("/auth/logout", { refreshToken });
      } catch (err) {
        console.error("Logout API call failed:", err);
        // Continue with local logout even if API fails
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, refreshToken: null, error: null });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    set({ token: accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, refreshToken: null, error: null });
  },

  fetchProfile: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      const user = res.data.data;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ user: null, token: null, refreshToken: null });
    }
  },
}));

export default useAuthStore;
