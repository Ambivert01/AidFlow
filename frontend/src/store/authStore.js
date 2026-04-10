import { create } from "zustand";
import api from "../services/api";

const TOKEN_KEY = "aidflow_token";
const USER_KEY = "aidflow_user";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem(USER_KEY)) || null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", credentials);
      // Backend returns { success, message, data: { user, accessToken, refreshToken } }
      const { user, accessToken } = res.data.data;
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token: accessToken, loading: false });
      return { user, accessToken };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, error: null });
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
      localStorage.removeItem(USER_KEY);
      set({ user: null, token: null });
    }
  },
}));

export default useAuthStore;
