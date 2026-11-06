import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Read cached user immediately to render in 0 milliseconds
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Only block screen if token exists but user info isn't cached yet
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    return !!token && !saved;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch((err) => {
          // Only clear login session if token was explicitly rejected (401 Unauthorized)
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
          // If server was sleeping or network glitched, DO NOT kick the user out!
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, shopName) => {
    const res = await registerUser({ name, email, password, shopName });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop_cached_dashboard');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
