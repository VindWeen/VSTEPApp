import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  getListeningDetail,
  getMyResults,
  getReadingDetail,
  getResultById,
  getSpeakingHistory,
  getSpeakingSessionById,
  getWritingHistory,
  getWritingSessionById,
} from '../../services/api';
import { calculateObjectiveBand, getLatestFullMockHistory, loadActiveFullMockSession } from '../../utils/fullMockTest';

const { width } = Dimensions.get('window');

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return `Hôm nay • ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const normalizeObjectiveItem = (item) => ({
  ...item,
  historyType: 'objective',
  dateValue: item.completedAt || item.createdAt,
});

const normalizeWritingItem = (item) => ({
  ...item,
  skill: 'writing',
  historyType: 'writing',
  bandScore: item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand,
  dateValue: item.completedAt || item.createdAt,
});

const normalizeSpeakingItem = (item) => ({
  ...item,
  skill: 'speaking',
  historyType: 'speaking',
  bandScore: item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand,
  dateValue: item.completedAt || item.createdAt,
});

const getActivityMeta = (item) => {
  if (item.skill === 'listening' || item.skill === 'reading') {
    const band = calculateObjectiveBand(item.skill, item.score, item.total);
    return `${formatDateTime(item.dateValue)} • Band ${band.toFixed(1)}/9.0`;
  }

  if (item.skill === 'writing') {
    return `${formatDateTime(item.dateValue)} • ${Number(item.bandScore || 0).toFixed(1)}/5.0`;
  }

  return `${formatDateTime(item.dateValue)} • ${Number(item.bandScore || 0).toFixed(1)}/5.0`;
};

const SKILL_META = {
  listening: { label: 'Nghe', icon: 'headset', color: '#1565C0', bgColor: '#E3F2FD', route: 'Listening' },
  reading: { label: 'Đọc', icon: 'book', color: '#2E7D32', bgColor: '#E8F5E9', route: 'Reading' },
  writing: { label: 'Viết', icon: 'create', color: '#E65100', bgColor: '#FBE9E7', route: 'Writing' },
  speaking: { label: 'Nói', icon: 'mic', color: '#6A1B9A', bgColor: '#F3E5F5', route: 'SpeakingTab' },
};

function RadarChart() {
  return (
    <View style={styles.radarContainer}>
      <View style={styles.radarCircle3} />
      <View style={styles.radarCircle2} />
      <View style={styles.radarCircle1} />
      <View style={[styles.radarLine, { transform: [{ rotate: '0deg' }] }]} />
      <View style={[styles.radarLine, { transform: [{ rotate: '90deg' }] }]} />
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
  const [recentActivities, setRecentActivities] = useState([]);
  const [latestFullMock, setLatestFullMock] = useState(null);
  const [activeFullMock, setActiveFullMock] = useState(null);
  const [loading, setLoading] = useState(true);

  const skills = useMemo(
    () => Object.entries(SKILL_META).map(([id, meta]) => ({ id, ...meta })),
    []
  );

  const fetchHomeData = useCallback(async () => {
    try {
      const [objectiveRes, writingRes, speakingRes, latestMock, activeSession] = await Promise.all([
        getMyResults({ limit: 20 }),
        getWritingHistory({ limit: 20 }),
        getSpeakingHistory({ limit: 20 }),
        getLatestFullMockHistory(),
        loadActiveFullMockSession(),
      ]);

      const merged = [
        ...(objectiveRes.data?.data || []).map(normalizeObjectiveItem),
        ...(writingRes.data?.data || []).map(normalizeWritingItem),
        ...(speakingRes.data?.data || []).map(normalizeSpeakingItem),
      ]
        .sort((a, b) => new Date(b.dateValue || 0) - new Date(a.dateValue || 0))
        .slice(0, 5);

      setRecentActivities(merged);
      setLatestFullMock(latestMock);
      setActiveFullMock(activeSession);
    } catch (error) {
      console.error('Lỗi tải dữ liệu home:', error.message);
      setRecentActivities([]);
      setLatestFullMock(null);
      setActiveFullMock(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHomeData();
    }, [fetchHomeData])
  );

  const openActivityItem = async (item) => {
    try {
      if (item.historyType === 'writing') {
        const res = await getWritingSessionById(item._id);
        navigation.navigate('FullMockWritingResult', {
          result: res.data.data,
          test: { title: res.data.data.testTitle || item.testTitle || item.title },
          fromFullMock: true,
        });
        return;
      }

      if (item.historyType === 'speaking') {
        const res = await getSpeakingSessionById(item._id);
        navigation.navigate('FullMockSpeakingResult', {
          result: res.data.data,
          test: { title: res.data.data.testTitle || item.testTitle || item.title },
          fromFullMock: true,
        });
        return;
      }

      const resultRes = await getResultById(item._id);
      const fullResult = resultRes.data.data;

      if (item.skill === 'listening') {
        const detailRes = await getListeningDetail(fullResult.testId);
        navigation.navigate('FullMockListeningResult', {
          testId: fullResult.testId,
          detail: detailRes.data.data,
          historyResult: fullResult,
          fromHistory: true,
          fromFullMock: true,
        });
        return;
      }

      if (item.skill === 'reading') {
        const detailRes = await getReadingDetail(fullResult.testId);
        navigation.navigate('FullMockReadingResult', {
          testId: fullResult.testId,
          test: detailRes.data.data,
          passages: detailRes.data.data.parts || [],
          historyResult: fullResult,
          fromHistory: true,
          fromFullMock: true,
        });
      }
    } catch (error) {
      console.error('Lỗi mở hoạt động:', error.message);
    }
  };

  const totalActivities = recentActivities.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.heroName}>Xin chào, {userName}!</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={22} color="#1565C0" />
            </View>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerDecor1} />
          <View style={styles.bannerDecor2} />
          <View style={styles.bannerTag}>
            <Text style={styles.bannerTagText}>{activeFullMock ? 'ĐANG LÀM DỞ' : 'KHUYÊN DÙNG'}</Text>
          </View>
          <Text style={styles.bannerTitle}>Thi thử toàn diện</Text>
          <Text style={styles.bannerSub}>
            {activeFullMock
              ? 'Bạn đang có một bài thi 4 kỹ năng chưa hoàn thành. Tiếp tục để làm nốt các phần còn lại.'
              : 'Trải nghiệm đầy đủ 4 kỹ năng Nghe, Đọc, Nói, Viết với đề random và chỉ nộp bài ở cuối cùng.'}
          </Text>
          <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.85} onPress={() => navigation.navigate('MockTestIntro')}>
            <Text style={styles.bannerBtnText}>{activeFullMock ? 'Tiếp tục thi thử →' : 'Bắt đầu ngay →'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View>
              <Text style={styles.progressCardTitle}>Tiến độ học tập</Text>
              <Text style={styles.progressCardSub}>Mục tiêu: B2 VSTEP</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#E65100" />
              <Text style={styles.streakBadgeText}>{totalActivities} hoạt động gần đây</Text>
            </View>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <Ionicons name="document-text" size={22} color="#1565C0" />
              <Text style={styles.miniStatNum}>{recentActivities.length}</Text>
              <Text style={styles.miniStatLabel}>Hoạt động đang hiển thị</Text>
            </View>
            <View style={[styles.miniStatCard, styles.miniStatCardGreen]}>
              <Ionicons name="radio-button-on" size={22} color="#2E7D32" />
              <Text style={[styles.miniStatNum, { color: '#2E7D32' }]}>{latestFullMock ? latestFullMock.overallBand?.toFixed(1) : '--'}</Text>
              <Text style={styles.miniStatLabel}>Overall gần nhất</Text>
            </View>
          </View>

          <RadarChart />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kỹ năng VSTEP</Text>
        </View>

        <View style={styles.skillGrid}>
          {skills.map((skill) => (
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
              <Text style={styles.skillDesc}>Vào danh sách đề của kỹ năng này</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile', { screen: 'History' })}>
            <Text style={styles.sectionSeeAll}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#1565C0" />
          </View>
        ) : recentActivities.length ? (
          recentActivities.map((item) => {
            const meta = SKILL_META[item.skill] || SKILL_META.listening;
            return (
              <View key={item._id} style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: meta.bgColor }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {item.testTitle || item.title || meta.label}
                  </Text>
                  <Text style={styles.activityMeta}>{getActivityMeta(item)}</Text>
                </View>
                <TouchableOpacity style={styles.activityBtn} onPress={() => openActivityItem(item)}>
                  <Text style={styles.activityBtnText}>Xem lại</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>Chưa có hoạt động nào gần đây.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lần thi gần nhất</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MockTestHistory')}>
            <Text style={styles.sectionSeeAll}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        {latestFullMock ? (
          <View style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="ribbon" size={20} color="#1565C0" />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Mock Test 4 kỹ năng</Text>
              <Text style={styles.activityMeta}>
                {formatDateTime(latestFullMock.completedAt)} • Overall {latestFullMock.overallBand?.toFixed(1) || '0.0'}/9.0
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.activityBtn, { backgroundColor: '#E3F2FD' }]}
              onPress={() => navigation.navigate('MockTestResult', { result: latestFullMock })}
            >
              <Text style={[styles.activityBtnText, { color: '#1565C0' }]}>Chi tiết</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>Chưa có lần thi 4 kỹ năng nào.</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { padding: 16, paddingTop: Platform.OS === 'android' ? 16 : 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: '#757575', fontWeight: '500', marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  avatarBtn: { position: 'relative' },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#F5F7FA',
  },
  banner: {
    backgroundColor: '#1565C0',
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerDecor1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerDecor2: {
    position: 'absolute',
    right: 40,
    bottom: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  bannerTagText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.84)', lineHeight: 20, marginBottom: 18 },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bannerBtnText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  progressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressCardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  progressCardSub: { fontSize: 13, color: '#757575' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  streakBadgeText: { fontSize: 13, fontWeight: '700', color: '#E65100' },
  miniStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    gap: 4,
  },
  miniStatCardGreen: { backgroundColor: '#F1F8E9' },
  miniStatNum: { fontSize: 24, fontWeight: '900', color: '#1565C0' },
  miniStatLabel: { fontSize: 12, color: '#757575', fontWeight: '500' },
  radarContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
  },
  radarCircle1: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#E0E0E0' },
  radarCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#E0E0E0' },
  radarCircle3: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: '#E0E0E0' },
  radarLine: { position: 'absolute', width: 140, height: 1, backgroundColor: '#E0E0E0' },
  radarLabel: { position: 'absolute', fontSize: 11, color: '#757575', fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  sectionSeeAll: { fontSize: 14, color: '#1565C0', fontWeight: '700' },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  skillCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  skillIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  skillDesc: { fontSize: 12, color: '#757575', fontWeight: '500', lineHeight: 18 },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  activityMeta: { fontSize: 12, color: '#757575' },
  activityBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  activityBtnText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  emptyCardText: { fontSize: 13, color: '#78909C', textAlign: 'center', fontWeight: '600' },
});
