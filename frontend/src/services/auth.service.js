import api from "./api";

const TOKEN_KEY = "aidflow_token";
const REFRESH_TOKEN_KEY = "aidflow_refresh_token";
const USER_KEY = "aidflow_user";

const authService = {
  async login(credentials) {
    const res = await api.post("/auth/login", credentials);
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user, accessToken, refreshToken };
  },

  async logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch (err) {
        console.error("Logout API call failed:", err);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const res = await api.post("/auth/refresh", { refreshToken });
    const { accessToken } = res.data.data;
    localStorage.setItem(TOKEN_KEY, accessToken);
    return accessToken;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

export default authService;
