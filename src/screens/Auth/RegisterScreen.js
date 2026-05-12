import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backPillBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={18} color="#1A1A1A" style={{marginRight: 4}} />
              <Text style={styles.backPillText}>Quay lại</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.topProgressBar}>
            <View style={[styles.progressSegment, {backgroundColor: '#1565C0'}]} />
            <View style={[styles.progressSegment, {backgroundColor: '#1565C0'}]} />
            <View style={[styles.progressSegment, {backgroundColor: '#E2E8F0'}]} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Điền thông tin để bắt đầu hành trình</Text>
          </View>

          <View style={styles.form}>
            {/* Họ và tên */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Họ và tên</Text>
              <View style={[styles.inputWrapper, isFocused === 'name' && styles.inputWrapperFocused]}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn Minh"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setIsFocused('name')}
                  onBlur={() => setIsFocused('')}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, isFocused === 'email' && styles.inputWrapperFocused]}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="minh@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused('')}
                />
              </View>
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={[styles.inputWrapper, isFocused === 'password' && styles.inputWrapperFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused('')}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              {/* Password Strength Indicator */}
              <View style={styles.pwdStrengthRow}>
                <View style={[styles.pwdBar, password.length > 0 && {backgroundColor: '#F97316'}]} />
                <View style={[styles.pwdBar, password.length > 4 && {backgroundColor: '#F97316'}]} />
                <View style={[styles.pwdBar, password.length >= 8 && {backgroundColor: '#4CAF50'}]} />
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 4}}>
                <Text style={{fontSize: 12, color: password.length >= 8 ? '#4CAF50' : (password.length > 0 ? '#F97316' : '#94A3B8'), fontWeight: '600'}}>
                  {password.length >= 8 ? 'Mạnh' : (password.length > 0 ? 'Trung bình' : '')}
                </Text>
                <Text style={{fontSize: 11, color: '#94A3B8'}}>Dùng chữ hoa & ký tự đặc biệt</Text>
              </View>
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <View style={[styles.inputWrapper, isFocused === 'confirm' && styles.inputWrapperFocused, passwordsMatch && {borderColor: '#1565C0', backgroundColor: '#F0F7FF'}]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setIsFocused('confirm')}
                  onBlur={() => setIsFocused('')}
                />
                {passwordsMatch && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
              </View>
            </View>



            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Đăng ký</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Đăng nhập</Text>
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
  inputWrapperFocused: { borderColor: '#1565C0', backgroundColor: '#F8FAFC' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#0F172A' },
  
  pwdStrengthRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  pwdBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },

  levelPillsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  levelPill: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  levelPillText: { fontSize: 16, fontWeight: '700' },

  submitBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: '#1565C0', fontSize: 14, fontWeight: '700' },
});
