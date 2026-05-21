import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState('');
  const { theme, isDarkMode } = useTheme();

  const handleSubmit = async () => {
    if (!email || !password) return Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');

    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      const msg = e.response?.data?.message || 'Đã có lỗi xảy ra. Thử lại.';
      Alert.alert('Thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.headerCentered}>
            <View style={[styles.logoSquare, { backgroundColor: isDarkMode ? '#1E1E1E' : '#1565C0', shadowColor: isDarkMode ? '#000' : '#1565C0' }]}>
              <MaterialCommunityIcons name="school" size={40} color={isDarkMode ? '#64B5F6' : '#FFF'} />
            </View>
            <Text style={[styles.appName, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>VSTEP Practice</Text>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Đăng nhập</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Chào mừng trở lại! Hãy tiếp tục luyện tập.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <View style={[
                styles.inputWrapper, 
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                isFocused === 'email' && { borderColor: isDarkMode ? '#64B5F6' : '#1565C0', backgroundColor: theme.card }
              ]}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.inputText }]}
                  placeholder="minh@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={theme.placeholder}
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused('')}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Mật khẩu</Text>
              <View style={[
                styles.inputWrapper, 
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                isFocused === 'password' && { borderColor: isDarkMode ? '#64B5F6' : '#1565C0', backgroundColor: theme.card }
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.inputText }]}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={theme.placeholder}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused('')}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotPasswordText, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: isDarkMode ? '#64B5F6' : '#1565C0' }]} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={isDarkMode ? '#121212' : '#fff'} />
              ) : (
                <>
                  <Text style={[styles.submitBtnText, { color: isDarkMode ? '#121212' : '#FFFFFF' }]}>Đăng nhập</Text>
                  <Ionicons name="arrow-forward" size={20} color={isDarkMode ? '#121212' : '#FFF'} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>hoặc</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={[styles.socialBtnText, { color: theme.text }]}>Tiếp tục với Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Quick test login */}
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => { setEmail('admin@gmail.com'); setPassword('123456'); }}
          >
            <Ionicons name="flash-outline" size={16} color={theme.placeholder} style={{ marginRight: 4 }} />
            <Text style={[styles.quickBtnText, { color: theme.textSecondary }]}>Dev: Điền tài khoản test</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, padding: 24, paddingBottom: 40, justifyContent: 'center' },

  headerCentered: { alignItems: 'center', marginBottom: 40 },
  logoSquare: { width: 64, height: 64, backgroundColor: '#1565C0', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 8, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  appName: { fontSize: 16, fontWeight: '800', color: '#1565C0' },

  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22 },

  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: { borderColor: '#1565C0', backgroundColor: '#F8FAFC' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#0F172A' },

  forgotPasswordRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: '#1565C0', fontSize: 14, fontWeight: '700' },

  submitBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 16, color: '#64748B', fontSize: 14 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  socialBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginLeft: 12 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: '#1565C0', fontSize: 14, fontWeight: '700' },

  quickBtn: {
    marginTop: 24, alignItems: 'center', padding: 8,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, borderStyle: 'dashed',
    alignSelf: 'center', flexDirection: 'row'
  },
  quickBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
});
