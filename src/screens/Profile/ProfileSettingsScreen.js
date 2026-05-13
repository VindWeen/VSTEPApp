import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Platform, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const name = user?.name || 'Nguyễn Văn Minh';
  const email = user?.email || 'minhnv@gmail.com';
  const level = user?.level || 'B2';

  const MenuItem = ({ icon, iconColor, iconBg, label, onPress, rightElement }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {rightElement || <Ionicons name="chevron-forward" size={18} color="#B0BEC5" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* User summary */}
        <View style={styles.userCard}>
          <View style={styles.avatarBg}>
            <Ionicons name="person" size={28} color="#1565C0" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
        </View>

        {/* TÀI KHOẢN */}
        <Text style={styles.groupLabel}>TÀI KHOẢN</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="person-outline"
            iconColor="#1565C0"
            iconBg="#E3F2FD"
            label="Chỉnh sửa hồ sơ"
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="lock-closed-outline"
            iconColor="#E65100"
            iconBg="#FBE9E7"
            label="Đổi mật khẩu"
          />
        </View>

        {/* CÀI ĐẶT ỨNG DỤNG */}
        <Text style={styles.groupLabel}>CÀI ĐẶT ỨNG DỤNG</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="moon-outline"
            iconColor="#6A1B9A"
            iconBg="#F3E5F5"
            label="Giao diện tối"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E0E0E0', true: '#BBDEFB' }}
                thumbColor={darkMode ? '#1565C0' : '#fff'}
                ios_backgroundColor="#E0E0E0"
              />
            }
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="notifications-outline"
            iconColor="#2E7D32"
            iconBg="#E8F5E9"
            label="Thông báo"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E0E0E0', true: '#BBDEFB' }}
                thumbColor={notifications ? '#1565C0' : '#fff'}
                ios_backgroundColor="#E0E0E0"
              />
            }
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="globe-outline"
            iconColor="#1565C0"
            iconBg="#E3F2FD"
            label="Ngôn ngữ"
            rightElement={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.menuValueText}>Tiếng Việt</Text>
                <Ionicons name="chevron-forward" size={16} color="#B0BEC5" />
              </View>
            }
          />
        </View>

        {/* THÔNG TIN */}
        <Text style={styles.groupLabel}>THÔNG TIN</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="information-circle-outline"
            iconColor="#757575"
            iconBg="#F5F5F5"
            label="Phiên bản ứng dụng"
            rightElement={<Text style={styles.menuValueText}>1.0.0</Text>}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="headset-outline"
            iconColor="#1565C0"
            iconBg="#E3F2FD"
            label="Liên hệ hỗ trợ"
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#E53935" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },

  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  // User card
  userCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  avatarBg: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 3 },
  userEmail: { fontSize: 13, color: '#757575' },
  levelBadge: {
    backgroundColor: '#1565C0', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
  },
  levelText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Group
  groupLabel: {
    fontSize: 11, fontWeight: '800', color: '#9E9E9E', letterSpacing: 1.2,
    marginBottom: 8, marginLeft: 4, marginTop: 4,
  },
  menuGroup: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  menuIconBg: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  menuRight: { alignItems: 'flex-end' },
  menuValueText: { fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 62 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: 16, paddingVertical: 14, marginTop: 4,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E53935' },
});
