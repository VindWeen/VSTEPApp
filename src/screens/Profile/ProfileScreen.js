import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SKILL_BARS = [
  { label: 'Nghe', icon: 'headset',  color: '#1565C0', bgColor: '#E3F2FD', pct: 75 },
  { label: 'Đọc',  icon: 'book',     color: '#2E7D32', bgColor: '#E8F5E9', pct: 60 },
  { label: 'Viết', icon: 'create',   color: '#E65100', bgColor: '#FBE9E7', pct: 45 },
  { label: 'Nói',  icon: 'mic',      color: '#6A1B9A', bgColor: '#F3E5F5', pct: 30 },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const name = user?.name || 'Nguyễn Văn Minh';
  const email = user?.email || 'minhnv@gmail.com';
  const level = user?.level || 'B2';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('ProfileSettings')}
        >
          <Ionicons name="settings-outline" size={22} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatarBg}>
            <Ionicons name="person" size={34} color="#1565C0" />
            <View style={styles.avatarVerified}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{name}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
            <Text style={styles.userEmail}>{email}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>42</Text>
            <Text style={styles.statLabel}>Bài đã{'\n'}làm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flame" size={16} color="#E65100" />
            <Text style={[styles.statNum, { color: '#E65100' }]}>15</Text>
            <Text style={styles.statLabel}>ngày{'\n'}Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>75%</Text>
            <Text style={styles.statLabel}>Nghe/{'\n'}Đọc</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>3.8</Text>
            <Text style={styles.statLabel}>Viết/{'\n'}Nói</Text>
          </View>
        </View>

        {/* History Button */}
        <TouchableOpacity 
          style={styles.historyBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="time-outline" size={20} color="#fff" />
          <Text style={styles.historyBtnText}>Xem lịch sử làm bài</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" style={{marginLeft: 'auto'}} />
        </TouchableOpacity>

        {/* Skill progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiến độ kỹ năng</Text>
          {SKILL_BARS.map(s => (
            <View key={s.label} style={styles.skillRow}>
              <View style={[styles.skillIconBg, { backgroundColor: s.bgColor }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <View style={styles.skillBarArea}>
                <View style={styles.skillLabelRow}>
                  <Text style={styles.skillLabelText}>{s.label}</Text>
                  <Text style={[styles.skillPct, { color: s.color }]}>{s.pct}%</Text>
                </View>
                <View style={styles.skillBarBg}>
                  <View style={[styles.skillBarFill, { width: `${s.pct}%`, backgroundColor: s.color }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Radar chart placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biểu đồ kỹ năng</Text>
          <View style={styles.radarPlaceholder}>
            <View style={styles.radarCircle3} />
            <View style={styles.radarCircle2} />
            <View style={styles.radarCircle1} />
            <View style={styles.radarLineH} />
            <View style={styles.radarLineV} />
            <Text style={[styles.radarLabel, { top: 4, left: 86 }]}>Nghe</Text>
            <Text style={[styles.radarLabel, { bottom: 4, left: 80 }]}>Viết</Text>
            <Text style={[styles.radarLabel, { top: 86, right: 4 }]}>Đọc</Text>
            <Text style={[styles.radarLabel, { top: 86, left: 4 }]}>Nói</Text>
          </View>
        </View>


        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  // User card
  userCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  avatarBg: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  avatarVerified: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  levelBadge: {
    alignSelf: 'flex-start', backgroundColor: '#1565C0',
    paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8,
  },
  levelText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  userEmail: { fontSize: 13, color: '#757575' },
  editBtn: {
    borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#1565C0' },

  // Stats
  statsRow: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0' },
  statNum: { fontSize: 20, fontWeight: '900', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#757575', textAlign: 'center', fontWeight: '500' },

  // History button
  historyBtn: {
    backgroundColor: '#1565C0', borderRadius: 16, padding: 14, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  historyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Skill progress
  section: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 14 },

  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  skillIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  skillBarArea: { flex: 1 },
  skillLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  skillLabelText: { fontSize: 13, color: '#1A1A2E', fontWeight: '700' },
  skillPct: { fontSize: 13, fontWeight: '800' },
  skillBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  skillBarFill: { height: '100%', borderRadius: 4 },

  // Radar
  radarPlaceholder: {
    height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  radarCircle1: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#E0E0E0' },
  radarCircle2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: '#E0E0E0' },
  radarCircle3: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: '#E0E0E0' },
  radarLineH: { position: 'absolute', width: 160, height: 1, backgroundColor: '#E0E0E0' },
  radarLineV: { position: 'absolute', width: 1, height: 160, backgroundColor: '#E0E0E0' },
  radarLabel: { position: 'absolute', fontSize: 11, color: '#757575', fontWeight: '600' },

});
