import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
  });

  api.interceptors.request.use(config => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const loadUser = async () => {
    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        console.error("Auth Load Error:", error);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData); // ตั้งค่า User ทันที
      
      toast.success('เข้าสู่ระบบสำเร็จ');
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ';
      toast.error(errorMsg);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    toast.info('ออกจากระบบแล้ว');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, api, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
