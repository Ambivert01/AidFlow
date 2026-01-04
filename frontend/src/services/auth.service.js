// frontend/src/services/auth.service.js
import api from "./api";

const TOKEN_KEY = "aidflow_token";
const USER_KEY = "aidflow_user";

export const authService = {
  async login(credentials) {
    const res = await api.post("/auth/login", credentials);

    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));

    return res.data.user;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
