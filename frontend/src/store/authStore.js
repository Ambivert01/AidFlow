import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('aidflow_user')) || null,
  token: localStorage.getItem('aidflow_token') || null,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', credentials);
      localStorage.setItem('aidflow_token', res.data.token);
      localStorage.setItem('aidflow_user', JSON.stringify(res.data.user));
      set({ 
        user: res.data.user, 
        token: res.data.token,
        loading: false 
      });
      return res.data;
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Login failed',
        loading: false 
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('aidflow_token');
    localStorage.removeItem('aidflow_user');
    set({ user: null, token: null });
  },
  
  fetchProfile: async () => {
    const token = localStorage.getItem('aidflow_token');
    if (!token) return;
    
    try {
      const res = await api.get('/auth/me'); // Assuming there's a `/auth/me` endpoint in backend mapping to get profile
      set({ user: res.data.user });
    } catch {
      localStorage.removeItem('aidflow_token');
      localStorage.removeItem('aidflow_user');
      set({ user: null, token: null });
    }
  }
}));

export default useAuthStore;
