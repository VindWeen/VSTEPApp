import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const SKILLS = [
  { id: 'Listening', label: 'Nghe', icon: 'headset', color: '#1565C0', bgColor: '#E3F2FD', pct: 75, route: 'Listening', desc: '3 phần thi' },
  { id: 'Reading',   label: 'Đọc',  icon: 'book',    color: '#2E7D32', bgColor: '#E8F5E9', pct: 60, route: 'Reading',   desc: 'Đọc hiểu' },
  { id: 'Writing',   label: 'Viết', icon: 'create',   color: '#E65100', bgColor: '#FBE9E7', pct: 45, route: 'Writing',   desc: 'AI chấm điểm' },
  { id: 'Speaking',  label: 'Nói',  icon: 'mic',     color: '#6A1B9A', bgColor: '#F3E5F5', pct: 30, route: 'SpeakingTab', desc: 'AI feedback' },
];

// Simple spider/radar chart using pure RN
function RadarChart({ skills }) {
  const cx = 90, cy = 90, r = 65;
  const labels = ['Đọc', 'Nghe', 'Viết', 'Nói'];
  const values = [0.60, 0.75, 0.45, 0.30];
  const angles = labels.map((_, i) => (i * 2 * Math.PI) / labels.length - Math.PI / 2);

  const toXY = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const gridPoints = (scale) => angles.map(a => toXY(a, r * scale));
  const dataPoints = angles.map((a, i) => toXY(a, r * values[i]));

  const pointsStr = (pts) => pts.map(p => `${p.x},${p.y}`).join(' ');

  // Use a simple View-based approximation since SVG is not available
  return (
    <View style={styles.radarContainer}>
      {/* Grid lines approximated */}
      <View style={styles.radarCircle3} />
      <View style={styles.radarCircle2} />
      <View style={styles.radarCircle1} />
      {/* Lines */}
      <View style={[styles.radarLine, { transform: [{ rotate: '0deg' }] }]} />
      <View style={[styles.radarLine, { transform: [{ rotate: '90deg' }] }]} />

      {/* Labels */}
      <Text style={[styles.radarLabel, { top: 6, left: 76 }]}>Đọc</Text>
      <Text style={[styles.radarLabel, { bottom: 6, left: 76 }]}>Nói</Text>
      <Text style={[styles.radarLabel, { top: 78, right: 4 }]}>Nghe</Text>
      <Text style={[styles.radarLabel, { top: 78, left: 4 }]}>Viết</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const userName = user?.name ? user.name.split(' ').pop() : 'bạn';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.heroName}>Xin chào, {userName}!</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={22} color="#1565C0" />
            </View>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>

        {/* Banner "Thi thử toàn diện" */}
        <View style={styles.banner}>
          <View style={styles.bannerDecor1} />
          <View style={styles.bannerDecor2} />
          <View style={styles.bannerTag}>
            <Text style={styles.bannerTagText}>KHUYÊN DÙNG</Text>
          </View>
          <Text style={styles.bannerTitle}>Thi thử toàn diện</Text>
          <Text style={styles.bannerSub}>Trải nghiệm đầy đủ 4 kỹ năng như thi thật{'\n'}trong 180 phút.</Text>
          <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.85}>
            <Text style={styles.bannerBtnText}>Bắt đầu ngay →</Text>
          </TouchableOpacity>
        </View>

        {/* Tiến độ học tập */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View>
              <Text style={styles.progressCardTitle}>Tiến độ học tập</Text>
              <Text style={styles.progressCardSub}>Mục tiêu: B2 VSTEP</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#E65100" />
              <Text style={styles.streakBadgeText}>15 ngày</Text>
            </View>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <Ionicons name="document-text" size={22} color="#1565C0" />
              <Text style={styles.miniStatNum}>42</Text>
              <Text style={styles.miniStatLabel}>Tổng bài đã làm</Text>
            </View>
            <View style={[styles.miniStatCard, styles.miniStatCardGreen]}>
              <Ionicons name="radio-button-on" size={22} color="#2E7D32" />
              <Text style={[styles.miniStatNum, { color: '#2E7D32' }]}>68%</Text>
              <Text style={styles.miniStatLabel}>Tỉ lệ chính xác</Text>
            </View>
          </View>

          {/* Radar chart placeholder */}
          <RadarChart />
        </View>

        {/* Kỹ năng VSTEP */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kỹ năng VSTEP</Text>
          <TouchableOpacity><Text style={styles.sectionSeeAll}>Xem tất cả</Text></TouchableOpacity>
        </View>

        <View style={styles.skillGrid}>
          {SKILLS.map(skill => (
            <TouchableOpacity
              key={skill.id}
              style={styles.skillCard}
              onPress={() => navigation.navigate(skill.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.skillIconBg, { backgroundColor: skill.bgColor }]}>
                <Ionicons name={skill.icon} size={24} color={skill.color} />
              </View>
              <Text style={styles.skillLabel}>{skill.label}</Text>
              <Text style={styles.skillDesc}>{skill.desc}</Text>
              <View style={styles.skillBarBg}>
                <View style={[styles.skillBarFill, { width: `${skill.pct}%`, backgroundColor: skill.color }]} />
              </View>
              <Text style={[styles.skillPct, { color: skill.color }]}>{skill.pct}%</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hoạt động gần đây */}
        <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityIcon}>
            <Ionicons name="headset" size={20} color="#1565C0" />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Listening Part 1 - Test 4</Text>
            <Text style={styles.activityMeta}>Hôm nay • 8/10 điểm</Text>
          </View>
          <TouchableOpacity style={styles.activityBtn}>
            <Text style={styles.activityBtnText}>Xem lại</Text>
          </TouchableOpacity>
        </View>

        {/* Lần thi gần nhất */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Lần thi gần nhất</Text>
        <View style={styles.activityCard}>
          <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="headset" size={20} color="#1565C0" />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Mock Test Toàn diện #04</Text>
            <Text style={styles.activityMeta}>Hôm qua • B1 Upper</Text>
          </View>
          <TouchableOpacity style={[styles.activityBtn, { backgroundColor: '#E3F2FD' }]}>
            <Text style={[styles.activityBtnText, { color: '#1565C0' }]}>Chi tiết</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { padding: 16, paddingTop: Platform.OS === 'android' ? 16 : 8 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: '#757575', fontWeight: '500', marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  avatarBtn: { position: 'relative' },
  avatarInner: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#F5F7FA',
  },

  // Banner
  banner: {
    backgroundColor: '#1565C0', borderRadius: 20, padding: 22, marginBottom: 16,
    overflow: 'hidden', position: 'relative',
  },
  bannerDecor1: {
    position: 'absolute', right: -20, top: -20,
    width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerDecor2: {
    position: 'absolute', right: 40, bottom: -30,
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bannerTag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12,
  },
  bannerTagText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 18 },
  bannerBtn: {
    alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 20,
  },
  bannerBtnText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },

  // Progress card
  progressCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  progressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressCardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  progressCardSub: { fontSize: 13, color: '#757575' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  streakBadgeText: { fontSize: 13, fontWeight: '700', color: '#E65100' },
  miniStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  miniStatCard: {
    flex: 1, backgroundColor: '#F0F7FF', borderRadius: 14, padding: 14,
    alignItems: 'flex-start', gap: 4,
  },
  miniStatCardGreen: { backgroundColor: '#F1F8E9' },
  miniStatNum: { fontSize: 24, fontWeight: '900', color: '#1565C0' },
  miniStatLabel: { fontSize: 12, color: '#757575', fontWeight: '500' },

  // Radar placeholder
  radarContainer: {
    height: 180, alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginTop: 4,
  },
  radarCircle1: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  radarCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  radarCircle3: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  radarLine: {
    position: 'absolute', width: 140, height: 1, backgroundColor: '#E0E0E0',
  },
  radarLabel: { position: 'absolute', fontSize: 11, color: '#757575', fontWeight: '600' },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  sectionSeeAll: { fontSize: 14, color: '#1565C0', fontWeight: '600' },

  // Skill grid
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  skillCard: {
    width: (width - 44) / 2, backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  skillIconBg: {
    width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  skillLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  skillDesc: { fontSize: 12, color: '#757575', fontWeight: '500', marginBottom: 10 },
  skillBarBg: { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  skillBarFill: { height: '100%', borderRadius: 3 },
  skillPct: { fontSize: 12, fontWeight: '700', textAlign: 'right' },

  // Activity
  activityCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  activityIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  activityMeta: { fontSize: 12, color: '#757575' },
  activityBtn: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  activityBtnText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
});
