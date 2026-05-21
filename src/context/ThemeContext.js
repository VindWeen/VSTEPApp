import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: {},
  notificationsEnabled: true,
  toggleNotifications: () => {},
});

export const lightTheme = {
  background: '#F5F7FA',
  card: '#ffffff',
  text: '#1A1A2E',
  textSecondary: '#757575',
  border: '#F0F2F5',
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  placeholder: '#90A4AE',
  activeTabBg: '#E3F2FD',
  menuDivider: '#F5F5F5',
  cardBorder: '#F0F2F5',
};

export const darkTheme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#A0A0A0',
  border: '#2C2C2C',
  inputBg: '#1A1A1A',
  inputBorder: '#333333',
  inputText: '#E0E0E0',
  placeholder: '#606060',
  activeTabBg: '#1565C033',
  menuDivider: '#2C2C2C',
  cardBorder: '#2C2C2C',
};

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themeMode');
        if (storedTheme === 'dark') {
          setIsDarkMode(true);
        }
        
        const notifValue = await AsyncStorage.getItem('notificationsEnabled');
        if (notifValue !== null) {
          setNotificationsEnabled(notifValue === 'true');
        } else {
          setNotificationsEnabled(true);
          await AsyncStorage.setItem('notificationsEnabled', 'true');
        }
      } catch (error) {
        console.error('Lỗi khi load cài đặt giao diện/thông báo:', error);
      }
    };
    loadSettings();
  }, []);

  const toggleTheme = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await AsyncStorage.setItem('themeMode', newValue ? 'dark' : 'light');
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem('notificationsEnabled', newValue ? 'true' : 'false');
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, notificationsEnabled, toggleNotifications }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
