import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.title}>Quên mật khẩu?</Text>
            <Text style={styles.subtitle}>Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu ngay lập tức.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="minh@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSendLink} disabled={loading || isSent}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Gửi link đặt lại</Text>
              )}
            </TouchableOpacity>

            {isSent && (
              <View style={styles.successBox}>
                <View style={styles.successHeader}>
                  <View style={styles.successIconWrapper}>
                    <Ionicons name="mail-unread" size={24} color="#1565C0" />
                  </View>
                  <View style={styles.successTextWrapper}>
                    <Text style={styles.successTitle}>Kiểm tra hộp thư của bạn</Text>
                    <Text style={styles.successDesc}>Chúng tôi đã gửi email đến <Text style={{fontWeight: '700'}}>{email}</Text>. Vui lòng kiểm tra hộp thư đến và thư rác.</Text>
                  </View>
                </View>
                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>Không nhận được email?</Text>
                  <TouchableOpacity onPress={() => setIsSent(false)}>
                    <Text style={styles.resendLink}>Gửi lại</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                <Text style={styles.stepText}>Kiểm tra email của bạn</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                <Text style={styles.stepText}>Nhấp vào link đặt lại mật khẩu</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                <Text style={styles.stepText}>Tạo mật khẩu mới an toàn</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="arrow-back" size={16} color="#1565C0" style={{marginRight: 6}} />
              <Text style={styles.backBtnText}>Quay lại đăng nhập</Text>
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1A1A1A' },
  
  submitBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },

  successBox: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  successHeader: { flexDirection: 'row', marginBottom: 16 },
  successIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  successIcon: { fontSize: 20 },
  successTextWrapper: { flex: 1 },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  successDesc: { fontSize: 13, color: '#1565C0', lineHeight: 20 },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 16 },
  resendText: { color: '#64748B', fontSize: 13 },
  resendLink: { color: '#1565C0', fontSize: 14, fontWeight: '700' },

  stepsContainer: { gap: 16, marginBottom: 40 },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumText: { color: '#1565C0', fontSize: 12, fontWeight: '700' },
  stepText: { color: '#64748B', fontSize: 14 },

  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  backBtnText: { color: '#1565C0', fontSize: 15, fontWeight: '600' },
});
