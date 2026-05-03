import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const LEVELS = ['A2', 'B1', 'B2', 'C1'];

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('B1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
    if (!isLogin && !name) return Alert.alert('Lỗi', 'Vui lòng nhập họ tên');

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, level);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Đã có lỗi xảy ra. Thử lại.';
      Alert.alert('Thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={styles.appName}>VSTEP Practice</Text>
          <Text style={styles.tagline}>Luyện thi VSTEP hiệu quả</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isLogin && (
            <View style={styles.levelSection}>
              <Text style={styles.levelLabel}>Trình độ hiện tại:</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.levelBtn, level === l && styles.levelBtnActive]}
                    onPress={() => setLevel(l)}
                  >
                    <Text style={[styles.levelBtnText, level === l && styles.levelBtnTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
            }
          </TouchableOpacity>

          {/* Quick test login */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => { setEmail('quang@test.com'); setPassword('123456'); setIsLogin(true); }}
          >
            <Text style={styles.quickBtnText}>⚡ Dev: Điền nhanh tài khoản test</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F5F7FA', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 64 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1565C0', marginTop: 8 },
  tagline: { color: '#888', fontSize: 14, marginTop: 4 },
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  tabRow: { flexDirection: 'row', backgroundColor: '#F0F4FF', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#2196F3' },
  tabText: { color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 14,
    fontSize: 15, marginBottom: 14, backgroundColor: '#FAFAFA',
  },
  levelSection: { marginBottom: 14 },
  levelLabel: { color: '#555', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  levelBtnActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  levelBtnText: { color: '#888', fontWeight: '700' },
  levelBtnTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#2196F3', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  quickBtn: {
    marginTop: 14, alignItems: 'center', padding: 10,
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, borderStyle: 'dashed',
  },
  quickBtnText: { color: '#aaa', fontSize: 12 },
});
