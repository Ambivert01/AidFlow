import { useEffect, useState } from "react";
import authService from "../services/auth.service";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    const storedUser = authService.getUser();

    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

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
