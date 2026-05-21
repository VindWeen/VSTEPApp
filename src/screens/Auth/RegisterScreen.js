import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(route.params?.level || 'B1');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState('');
  const { theme, isDarkMode } = useTheme();

  const handleSubmit = async () => {
    if (!name || !email || !password) return Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    if (password !== confirmPassword) return Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
    
    setLoading(true);
    try {
      await register(name, email, password, selectedLevel);
    } catch (e) {
      const msg = e.response?.data?.message || 'Đã có lỗi xảy ra. Thử lại.';
      Alert.alert('Thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordStrong = password.length >= 8; // simplified check
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={[styles.backPillBtn, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F1F5F9' }]} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={18} color={isDarkMode ? theme.text : '#1A1A1A'} style={{marginRight: 4}} />
              <Text style={[styles.backPillText, { color: isDarkMode ? theme.text : '#64748B' }]}>Quay lại</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.topProgressBar}>
            <View style={[styles.progressSegment, {backgroundColor: isDarkMode ? '#64B5F6' : '#1565C0'}]} />
            <View style={[styles.progressSegment, {backgroundColor: isDarkMode ? '#64B5F6' : '#1565C0'}]} />
            <View style={[styles.progressSegment, {backgroundColor: isDarkMode ? '#333333' : '#E2E8F0'}]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Tạo tài khoản</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Điền thông tin để bắt đầu hành trình</Text>
          </View>

          <View style={styles.form}>
            {/* Họ và tên */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Họ và tên</Text>
              <View style={[
                styles.inputWrapper, 
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                isFocused === 'name' && { borderColor: isDarkMode ? '#64B5F6' : '#1565C0', backgroundColor: theme.card }
              ]}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.inputText }]}
                  placeholder="Nguyễn Văn Minh"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor={theme.placeholder}
                  onFocus={() => setIsFocused('name')}
                  onBlur={() => setIsFocused('')}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <View style={[
                styles.inputWrapper, 
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                isFocused === 'email' && { borderColor: isDarkMode ? '#64B5F6' : '#1565C0', backgroundColor: theme.card }
              ]}>
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
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

            {/* Mật khẩu */}
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
              {/* Password Strength Indicator */}
              <View style={styles.pwdStrengthRow}>
                <View style={[styles.pwdBar, { backgroundColor: isDarkMode ? '#333333' : '#E2E8F0' }, password.length > 0 && {backgroundColor: '#F97316'}]} />
                <View style={[styles.pwdBar, { backgroundColor: isDarkMode ? '#333333' : '#E2E8F0' }, password.length > 4 && {backgroundColor: '#F97316'}]} />
                <View style={[styles.pwdBar, { backgroundColor: isDarkMode ? '#333333' : '#E2E8F0' }, password.length >= 8 && {backgroundColor: '#4CAF50'}]} />
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 4}}>
                <Text style={{fontSize: 12, color: password.length >= 8 ? '#4CAF50' : (password.length > 0 ? '#F97316' : theme.textSecondary), fontWeight: '600'}}>
                  {password.length >= 8 ? 'Mạnh' : (password.length > 0 ? 'Trung bình' : '')}
                </Text>
                <Text style={{fontSize: 11, color: theme.textSecondary}}>Dùng chữ hoa & ký tự đặc biệt</Text>
              </View>
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Xác nhận mật khẩu</Text>
              <View style={[
                styles.inputWrapper, 
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                isFocused === 'confirm' && { borderColor: isDarkMode ? '#64B5F6' : '#1565C0', backgroundColor: theme.card },
                passwordsMatch && { borderColor: '#4CAF50', backgroundColor: isDarkMode ? '#1B5E2033' : '#E8F5E9' }
              ]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.inputText }]}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={theme.placeholder}
                  onFocus={() => setIsFocused('confirm')}
                  onBlur={() => setIsFocused('')}
                />
                {passwordsMatch && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: isDarkMode ? '#64B5F6' : '#1565C0' }]} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={isDarkMode ? '#121212' : '#fff'} />
              ) : (
                <>
                  <Text style={[styles.submitBtnText, { color: isDarkMode ? '#121212' : '#FFFFFF' }]}>Đăng ký</Text>
                  <Ionicons name="arrow-forward" size={20} color={isDarkMode ? '#121212' : '#FFF'} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  
  headerTop: { marginBottom: 16 },
  backPillBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  backPillText: { color: '#64748B', fontWeight: '600', fontSize: 14 },

  topProgressBar: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },

  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22 },
  
  form: { width: '100%' },
  inputContainer: { marginBottom: 24 },
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
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#0F172A' },
  
  pwdStrengthRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  pwdBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },

  submitBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  submitBtnText: { fontWeight: '700', fontSize: 16 },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
