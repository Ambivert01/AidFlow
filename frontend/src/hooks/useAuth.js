import { useEffect, useState } from "react";
import { getMe } from "../services/auth.service";

export const useAuth = () => {
  const [user, setUser] = useState({
    isAuthenticated: false,
    role: null,
    loading: true
  });

  useEffect(() => {
    getMe()
      .then(res => {
        setUser({
          isAuthenticated: true,
          role: res.data.role,
          loading: false
        });
      })
      .catch(() => {
        setUser({ isAuthenticated: false, role: null, loading: false });
      });
  }, []);

  return user;
};
