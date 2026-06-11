import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('bird_token');
    const savedUser = localStorage.getItem('bird_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authApi.login({ username, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('bird_token', data.token);
      localStorage.setItem('bird_user', JSON.stringify(data.user));
      message.success(data.message || '登录成功');
      return true;
    } catch (err) {
      message.error(err.error || '登录失败');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authApi.register(userData);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('bird_token', data.token);
      localStorage.setItem('bird_user', JSON.stringify(data.user));
      message.success(data.message || '注册成功');
      return true;
    } catch (err) {
      message.error(err.error || '注册失败');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bird_token');
    localStorage.removeItem('bird_user');
    message.success('已退出登录');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
