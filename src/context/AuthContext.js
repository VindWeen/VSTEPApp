import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, login as loginAPI, register as registerAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Check stored token on start

  useEffect(() => {
    const loadToken = async () => {
      const stored = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (stored) {
        setToken(stored);
        if (storedUser) setUser(JSON.parse(storedUser));
        try {
          const res = await getMe();
          const freshUser = res.data?.user;
          if (freshUser) {
            setUser(freshUser);
            await AsyncStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadToken();
  }, []);

  const login = async (email, password) => {
    const res = await loginAPI(email, password);
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const register = async (name, email, password, level) => {
    const res = await registerAPI(name, email, password, level);
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
