import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Platform, Switch,
  Modal, TextInput, Alert, KeyboardAvoidingView,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, updatePassword } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const MenuItem = ({ icon, iconColor, iconBg, label, onPress, rightElement }) => {
  const { isDarkMode, theme } = useTheme();
  const adjustedBg = isDarkMode ? `${iconColor}22` : iconBg;
  const adjustedColor = isDarkMode ? (iconColor === '#757575' ? '#A0A0A0' : iconColor) : iconColor;
  
  if (onPress) {
    return (
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuIconBg, { backgroundColor: adjustedBg }]}>
          <Ionicons name={icon} size={18} color={adjustedColor} />
        </View>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
        <View style={styles.menuRight}>
          {rightElement || <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#606060' : '#B0BEC5'} />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.menuItem}>
      <View style={[styles.menuIconBg, { backgroundColor: adjustedBg }]}>
        <Ionicons name={icon} size={18} color={adjustedColor} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.menuRight}>
        {rightElement}
      </View>
    </View>
  );
};

export default function ProfileSettingsScreen({ route, navigation }) {
  const { user, logout, updateUserState } = useAuth();
  const { isDarkMode, toggleTheme, theme, notificationsEnabled, toggleNotifications } = useTheme();

  const name = user?.name || 'Nguyễn Văn Minh';
  const email = user?.email || 'minhnv@gmail.com';
  const level = user?.level || 'B2';

  // Modal Visibility States
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('B2');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState(null);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để đổi ảnh đại diện.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedAvatarUri(result.assets[0].uri);
    }
  };

  // Change Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditLevel(user.level || 'B2');
    }
  }, [user]);

  const openEditProfileParam = route.params?.openEditProfile;
  useEffect(() => {
    if (openEditProfileParam) {
      setEditProfileModalVisible(true);
      // Clear navigation param so it doesn't reopen if we navigate back here
      navigation.setParams({ openEditProfile: undefined });
    }
  }, [openEditProfileParam]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Thông báo', 'Họ và tên không được để trống.');
      return;
    }
    setUpdatingProfile(true);
    try {
      let avatarFile = null;
      if (selectedAvatarUri) {
        const uri = selectedAvatarUri;
        const uriParts = uri.split('/');
        const filename = uriParts[uriParts.length - 1];
        const ext = filename.split('.').pop().toLowerCase();
        avatarFile = {
          uri,
          name: filename,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        };
      }

      const res = await updateProfile(editName.trim(), editLevel, avatarFile);
      if (res.data?.success) {
        await updateUserState(res.data.user);
        setEditProfileModalVisible(false);
        setSelectedAvatarUri(null);
        Alert.alert('Thành công', 'Cập nhật thông tin hồ sơ thành công!');
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Có lỗi xảy ra.');
      }
    } catch (error) {
      console.error('Lỗi update profile:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể kết nối đến server.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin mật khẩu.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await updatePassword(oldPassword, newPassword);
      if (res.data?.success) {
        setChangePasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Có lỗi xảy ra.');
      }
    } catch (error) {
      console.error('Lỗi update password:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể kết nối đến server.');
    } finally {
      setUpdatingPassword(false);
    }
  };



  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* User summary */}
        <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.avatarBg, { backgroundColor: isDarkMode ? '#1565C033' : '#E3F2FD' }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={28} color="#1565C0" />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{name}</Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{email}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
        </View>

        {/* TÀI KHOẢN */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>TÀI KHOẢN</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <MenuItem
            icon="person-outline"
            iconColor="#1565C0"
            iconBg="#E3F2FD"
            label="Chỉnh sửa hồ sơ"
            onPress={() => {
              setEditName(user?.name || '');
              setEditLevel(user?.level || 'B2');
              setEditProfileModalVisible(true);
            }}
          />
          <View style={[styles.menuDivider, { backgroundColor: theme.menuDivider }]} />
          <MenuItem
            icon="lock-closed-outline"
            iconColor="#E65100"
            iconBg="#FBE9E7"
            label="Đổi mật khẩu"
            onPress={() => {
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setChangePasswordModalVisible(true);
            }}
          />
        </View>

        {/* CÀI ĐẶT ỨNG DỤNG */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>CÀI ĐẶT ỨNG DỤNG</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <MenuItem
            key="menu-item-darkmode"
            icon="moon-outline"
            iconColor="#6A1B9A"
            iconBg="#F3E5F5"
            label="Giao diện tối"
            rightElement={
              <Switch
                key="switch-darkmode"
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E0E0E0', true: '#BBDEFB' }}
                thumbColor={isDarkMode ? '#1565C0' : '#fff'}
                ios_backgroundColor="#E0E0E0"
              />
            }
          />
          <View style={[styles.menuDivider, { backgroundColor: theme.menuDivider }]} />
          <MenuItem
            key="menu-item-notifications"
            icon="notifications-outline"
            iconColor="#2E7D32"
            iconBg="#E8F5E9"
            label="Thông báo"
            rightElement={
              <Switch
                key="switch-notifications"
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#E0E0E0', true: '#BBDEFB' }}
                thumbColor={notificationsEnabled ? '#1565C0' : '#fff'}
                ios_backgroundColor="#E0E0E0"
              />
            }
          />
          <View style={[styles.menuDivider, { backgroundColor: theme.menuDivider }]} />
          <MenuItem
            icon="globe-outline"
            iconColor="#1565C0"
            iconBg="#E3F2FD"
            label="Ngôn ngữ"
            rightElement={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.menuValueText, { color: theme.textSecondary }]}>Tiếng Việt</Text>
                <Ionicons name="chevron-forward" size={16} color="#B0BEC5" />
              </View>
            }
          />
        </View>

        {/* THÔNG TIN */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>THÔNG TIN</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <MenuItem
            icon="information-circle-outline"
            iconColor="#757575"
            iconBg="#F5F5F5"
            label="Phiên bản ứng dụng"
            rightElement={<Text style={[styles.menuValueText, { color: theme.textSecondary }]}>1.0.0</Text>}
          />
          <View style={[styles.menuDivider, { backgroundColor: theme.menuDivider }]} />
          <MenuItem
            icon="headset-outline"
            iconColor="#1565C0"
            iconBg="#E3F2FD"
            label="Liên hệ hỗ trợ"
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, isDarkMode && { backgroundColor: '#E5393522' }]} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#E53935" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.modalContent, { backgroundColor: theme.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Chỉnh sửa hồ sơ</Text>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, isDarkMode && { backgroundColor: '#2C2C2C' }]}
                  onPress={() => {
                    setEditProfileModalVisible(false);
                    setSelectedAvatarUri(null);
                  }}
                >
                  <Ionicons name="close" size={22} color={isDarkMode ? '#A0A0A0' : '#546E7A'} />
                </TouchableOpacity>
              </View>

              {/* Avatar Selector UI */}
              <View style={styles.avatarPickerContainer}>
                <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarPickerWrapper}>
                  {selectedAvatarUri ? (
                    <Image source={{ uri: selectedAvatarUri }} style={styles.avatarPickerImage} />
                  ) : user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarPickerImage} />
                  ) : (
                    <View style={[styles.avatarPickerPlaceholder, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F1F5F9' }]}>
                      <Ionicons name="camera-outline" size={28} color={isDarkMode ? '#A0A0A0' : '#78909C'} />
                    </View>
                  )}
                  <View style={styles.avatarPickerBadge}>
                    <Ionicons name="camera" size={14} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <Text style={[styles.avatarPickerHint, { color: theme.textSecondary }]}>Chạm để chọn ảnh mới</Text>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Họ và tên</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Ionicons name="person-outline" size={20} color={isDarkMode ? '#A0A0A0' : '#78909C'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Trình độ mục tiêu</Text>
              <View style={styles.levelGrid}>
                {['A2', 'B1', 'B2', 'C1'].map((lvl) => {
                  const isSelected = editLevel === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.levelGridItem,
                        isDarkMode && { backgroundColor: '#2C2C2C', borderColor: '#2C2C2C' },
                        isSelected && (isDarkMode ? { backgroundColor: '#0284C722', borderColor: '#0284C7' } : styles.levelGridItemActive)
                      ]}
                      onPress={() => setEditLevel(lvl)}
                    >
                      <Text style={[
                        styles.levelGridText,
                        isDarkMode && { color: '#A0A0A0' },
                        isSelected && (isDarkMode ? { color: '#0284C7' } : styles.levelGridTextActive)
                      ]}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleUpdateProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.modalContent, { backgroundColor: theme.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Đổi mật khẩu</Text>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, isDarkMode && { backgroundColor: '#2C2C2C' }]}
                  onPress={() => setChangePasswordModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color={isDarkMode ? '#A0A0A0' : '#546E7A'} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mật khẩu hiện tại</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Ionicons name="key-outline" size={20} color={isDarkMode ? '#A0A0A0' : '#78909C'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mật khẩu mới</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? '#A0A0A0' : '#78909C'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Xác nhận mật khẩu mới</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={isDarkMode ? '#A0A0A0' : '#78909C'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleUpdatePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Thay đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarPickerContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarPickerWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPickerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPickerPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPickerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1565C0',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarPickerHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    height: 52,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 10,
  },
  levelGridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F1F5F9',
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  levelGridItemActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  levelGridText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
  },
  levelGridTextActive: {
    color: '#0369A1',
  },
  modalSubmitBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
