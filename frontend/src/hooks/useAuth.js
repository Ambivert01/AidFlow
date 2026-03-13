import { useState } from "react";
import authService from "../services/auth.service";

export function useAuth() {
  const [user, setUser] = useState(() => {
    const storedUser = authService.getUser();
    return storedUser && authService.isAuthenticated() ? storedUser : null;
  });
  const [loading] = useState(false);

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    setUser,   // VERY IMPORTANT
    logout,
  };
}
