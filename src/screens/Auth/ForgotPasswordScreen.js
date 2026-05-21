import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { theme, isDarkMode } = useTheme();

  const handleSendLink = async () => {
    if (!email) return Alert.alert('Lỗi', 'Vui lòng nhập email');
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Quên mật khẩu?</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu ngay lập tức.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                isFocused && { borderColor: isDarkMode ? '#64B5F6' : '#1565C0', backgroundColor: theme.card }
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
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: isDarkMode ? '#64B5F6' : '#1565C0' }]} 
              onPress={handleSendLink} 
              disabled={loading || isSent}
            >
              {loading ? (
                <ActivityIndicator color={isDarkMode ? '#121212' : '#fff'} />
              ) : (
                <Text style={[styles.submitBtnText, { color: isDarkMode ? '#121212' : '#FFFFFF' }]}>Gửi link đặt lại</Text>
              )}
            </TouchableOpacity>

            {isSent && (
              <View style={[styles.successBox, { backgroundColor: isDarkMode ? '#1E2C3F' : '#F0F7FF' }]}>
                <View style={styles.successHeader}>
                  <View style={[styles.successIconWrapper, { backgroundColor: theme.card }]}>
                    <Ionicons name="mail-unread" size={24} color={isDarkMode ? '#64B5F6' : '#1565C0'} />
                  </View>
                  <View style={styles.successTextWrapper}>
                    <Text style={[styles.successTitle, { color: theme.text }]}>Kiểm tra hộp thư của bạn</Text>
                    <Text style={[styles.successDesc, { color: isDarkMode ? '#A9CBEF' : '#1565C0' }]}>Chúng tôi đã gửi email đến <Text style={{fontWeight: '700'}}>{email}</Text>. Vui lòng kiểm tra hộp thư đến và thư rác.</Text>
                  </View>
                </View>
                <View style={[styles.resendRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.resendText, { color: theme.textSecondary }]}>Không nhận được email?</Text>
                  <TouchableOpacity onPress={() => setIsSent(false)}>
                    <Text style={[styles.resendLink, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>Gửi lại</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={[styles.stepNum, { backgroundColor: isDarkMode ? '#1E2C3F' : '#F0F7FF' }]}>
                  <Text style={[styles.stepNumText, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>Kiểm tra email của bạn</Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNum, { backgroundColor: isDarkMode ? '#1E2C3F' : '#F0F7FF' }]}>
                  <Text style={[styles.stepNumText, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>Nhấp vào link đặt lại mật khẩu</Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNum, { backgroundColor: isDarkMode ? '#1E2C3F' : '#F0F7FF' }]}>
                  <Text style={[styles.stepNumText, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>Tạo mật khẩu mới an toàn</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="arrow-back" size={16} color={isDarkMode ? '#64B5F6' : '#1565C0'} style={{marginRight: 6}} />
              <Text style={[styles.backBtnText, { color: isDarkMode ? '#64B5F6' : '#1565C0' }]}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, padding: 24, paddingTop: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#666666', lineHeight: 22 },
  
  form: { width: '100%' },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16 },
  
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitBtnText: { fontWeight: '700', fontSize: 16 },

  successBox: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  successHeader: { flexDirection: 'row', marginBottom: 16 },
  successIconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  successTextWrapper: { flex: 1 },
  successTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  successDesc: { fontSize: 13, lineHeight: 20 },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 16 },
  resendText: { fontSize: 13 },
  resendLink: { fontSize: 14, fontWeight: '700' },

  stepsContainer: { gap: 16, marginBottom: 40 },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepNum: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumText: { fontSize: 12, fontWeight: '700' },
  stepText: { fontSize: 14 },

  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
});
