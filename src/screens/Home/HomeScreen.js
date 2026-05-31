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
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
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
import {
  calculateObjectiveBand,
  getLatestFullMockHistory,
  loadActiveFullMockSession,
  convertFiveScaleToNineBand,
  loadFullMockHistory,
} from '../../utils/fullMockTest';
import { getCache, setCache } from '../../utils/cache';

import Svg, { Circle, Line, Polygon } from 'react-native-svg';

const getDefaultBand = (level) => {
  switch (level?.toUpperCase()) {
    case 'A2': return 3.0;
    case 'B1': return 4.5;
    case 'B2': return 6.0;
    case 'C1': return 7.5;
    default: return 6.0;
  }
};

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
    return `${formatDateTime(item.dateValue)} • Band ${band.toFixed(1)}/10.0`;
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

function RadarChart({ reading = 0, listening = 0, writing = 0, speaking = 0, isDarkMode, theme }) {
  const maxR = 70;
  const centerX = 120;
  const centerY = 100;

  const rR = (reading / 10) * maxR;
  const rL = (listening / 10) * maxR;
  const rS = (speaking / 10) * maxR;
  const rW = (writing / 10) * maxR;

  return (
    <View style={styles.radarContainer}>
      <Svg width="240" height="200" style={StyleSheet.absoluteFill}>
        {/* Concentric grid circles */}
        <Circle cx={centerX} cy={centerY} r="28" stroke={isDarkMode ? '#333333' : '#E2E8F0'} strokeWidth="1" fill="none" />
        <Circle cx={centerX} cy={centerY} r="42" stroke={isDarkMode ? '#333333' : '#E2E8F0'} strokeWidth="1" fill="none" />
        <Circle cx={centerX} cy={centerY} r="70" stroke={isDarkMode ? '#444444' : '#CBD5E1'} strokeWidth="1" fill="none" />

        {/* Grid axis lines */}
        <Line x1={centerX - 70} y1={centerY} x2={centerX + 70} y2={centerY} stroke={isDarkMode ? '#333333' : '#E2E8F0'} strokeWidth="1" />
        <Line x1={centerX} y1={centerY - 70} x2={centerX} y2={centerY + 70} stroke={isDarkMode ? '#333333' : '#E2E8F0'} strokeWidth="1" />

        {/* Shaded/Filled Polygon area */}
        <Polygon
          points={`${centerX},${centerY - rR} ${centerX + rL},${centerY} ${centerX},${centerY + rS} ${centerX - rW},${centerY}`}
          fill={isDarkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(21, 101, 192, 0.25)'}
          stroke={isDarkMode ? '#2196F3' : '#1565C0'}
          strokeWidth="2"
        />

        {/* Glowing data dots */}
        <Circle cx={centerX} cy={centerY - rR} r="6.5" fill={isDarkMode ? '#2196F3' : '#1565C0'} opacity={0.3} />
        <Circle cx={centerX} cy={centerY - rR} r="4" fill={isDarkMode ? '#2196F3' : '#1565C0'} stroke={isDarkMode ? '#1E1E1E' : '#ffffff'} strokeWidth="1.5" />

        <Circle cx={centerX + rL} cy={centerY} r="6.5" fill={isDarkMode ? '#2196F3' : '#1565C0'} opacity={0.3} />
        <Circle cx={centerX + rL} cy={centerY} r="4" fill={isDarkMode ? '#2196F3' : '#1565C0'} stroke={isDarkMode ? '#1E1E1E' : '#ffffff'} strokeWidth="1.5" />

        <Circle cx={centerX} cy={centerY + rS} r="6.5" fill={isDarkMode ? '#2196F3' : '#1565C0'} opacity={0.3} />
        <Circle cx={centerX} cy={centerY + rS} r="4" fill={isDarkMode ? '#2196F3' : '#1565C0'} stroke={isDarkMode ? '#1E1E1E' : '#ffffff'} strokeWidth="1.5" />

        <Circle cx={centerX - rW} cy={centerY} r="6.5" fill={isDarkMode ? '#2196F3' : '#1565C0'} opacity={0.3} />
        <Circle cx={centerX - rW} cy={centerY} r="4" fill={isDarkMode ? '#2196F3' : '#1565C0'} stroke={isDarkMode ? '#1E1E1E' : '#ffffff'} strokeWidth="1.5" />
      </Svg>

      {/* Centered Labels */}
      <Text style={[styles.radarLabel, { top: 6, left: 0, right: 0, textAlign: 'center', color: theme.textSecondary }]}>
        Đọc
      </Text>
      <Text style={[styles.radarLabel, { bottom: 6, left: 0, right: 0, textAlign: 'center', color: theme.textSecondary }]}>
        Nói
      </Text>
      <Text style={[styles.radarLabel, { top: 92, right: 2, color: theme.textSecondary }]}>
        Nghe
      </Text>
      <Text style={[styles.radarLabel, { top: 92, left: 2, color: theme.textSecondary }]}>
        Viết
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { isDarkMode, theme, notificationsEnabled } = useTheme();
  const userName = user?.name ? user.name.split(' ').pop() : 'bạn';
  const [recentActivities, setRecentActivities] = useState([]);
  const [latestFullMock, setLatestFullMock] = useState(null);
  const [activeFullMock, setActiveFullMock] = useState(null);
  const [averageBands, setAverageBands] = useState({ listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States cho Notifications
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [notificationsList, setNotificationsList] = useState([
    {
      id: '1',
      title: 'AI Feedback bài nói mới',
      body: 'Kết quả chấm điểm nói đề Speaking Test 2 đã hoàn thành. Hãy xem phân tích chi tiết.',
      time: '10 phút trước',
      type: 'speaking',
      icon: 'mic',
      iconBg: '#F3E5F5',
      iconColor: '#6A1B9A',
      unread: true,
    },
    {
      id: '2',
      title: 'Đề thi Writing mới cập nhật',
      body: 'Chủ đề Writing Task 1 VSTEP mới "Thư xin việc" vừa được đăng tải.',
      time: '2 giờ trước',
      type: 'writing',
      icon: 'create',
      iconBg: '#FBE9E7',
      iconColor: '#E65100',
      unread: true,
    },
    {
      id: '3',
      title: 'Giữ vững streak học tập!',
      body: 'Nhắc nhở học tập hàng ngày: Bạn chỉ cần làm 1 bài thi Nghe hoặc Đọc để duy trì streak.',
      time: '1 ngày trước',
      type: 'streak',
      icon: 'flame',
      iconBg: '#FFF3E0',
      iconColor: '#FF9800',
      unread: false,
    },
    {
      id: '4',
      title: 'AI Feedback bài viết',
      body: 'Bài viết Task 2 của bạn đã được chấm đạt Band 4.0/5.0. Xem mẹo cải thiện.',
      time: '2 ngày trước',
      type: 'writing',
      icon: 'create',
      iconBg: '#FBE9E7',
      iconColor: '#E65100',
      unread: false,
    },
  ]);

  const handleBellPress = () => {
    if (!notificationsEnabled) {
      Alert.alert(
        'Thông báo đã tắt',
        'Bạn đang tắt thông báo học tập. Vui lòng bật lại trong mục Cài đặt ở trang Hồ sơ để nhận thông tin chấm điểm tự động từ AI và các cập nhật mới nhất.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đi đến Cài đặt', onPress: () => navigation.getParent()?.navigate('Profile', { screen: 'ProfileSettings' }) }
        ]
      );
    } else {
      setIsNotificationsModalVisible(true);
    }
  };

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

      // Calculate averages
      const defaultVal = getDefaultBand(user?.level);
      const listeningBands = [];
      const readingBands = [];
      const writingBands = [];
      const speakingBands = [];

      (objectiveRes.data?.data || []).forEach(item => {
        if (item.skill === 'listening' && item.total > 0) {
          listeningBands.push(calculateObjectiveBand('listening', item.score, item.total));
        } else if (item.skill === 'reading' && item.total > 0) {
          readingBands.push(calculateObjectiveBand('reading', item.score, item.total));
        }
      });

      (writingRes.data?.data || []).forEach(item => {
        const score = item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand;
        if (score) {
          writingBands.push(convertFiveScaleToNineBand(score));
        }
      });

      (speakingRes.data?.data || []).forEach(item => {
        const score = item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand;
        if (score) {
          speakingBands.push(convertFiveScaleToNineBand(score));
        }
      });

      const mockHistory = await loadFullMockHistory();
      (mockHistory || []).forEach(mock => {
        if (mock.skills?.listening?.band) listeningBands.push(mock.skills.listening.band);
        if (mock.skills?.reading?.band) readingBands.push(mock.skills.reading.band);
        if (mock.skills?.writing?.band) writingBands.push(mock.skills.writing.band);
        if (mock.skills?.speaking?.band) speakingBands.push(mock.skills.speaking.band);
      });

      const average = (arr) => arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : null;
      const avgL = average(listeningBands) ?? defaultVal;
      const avgR = average(readingBands) ?? defaultVal;
      const avgW = average(writingBands) ?? defaultVal;
      const avgS = average(speakingBands) ?? defaultVal;

      const newBands = {
        listening: avgL,
        reading: avgR,
        writing: avgW,
        speaking: avgS,
      };

      setAverageBands(newBands);

      // Cache home data
      await setCache('home_data', {
        recentActivities: merged,
        latestFullMock: latestMock,
        activeFullMock: activeSession,
        averageBands: newBands,
      });
    } catch (error) {
      console.error('Lỗi tải dữ liệu home:', error.message);
      setRecentActivities([]);
      setLatestFullMock(null);
      setActiveFullMock(null);
    } finally {
      setLoading(false);
    }
  }, [user?.level]);

  const loadCacheAndFetch = useCallback(async () => {
    const cached = await getCache('home_data');
    if (cached) {
      setRecentActivities(cached.recentActivities || []);
      setLatestFullMock(cached.latestFullMock || null);
      setActiveFullMock(cached.activeFullMock || null);
      setAverageBands(cached.averageBands || { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 });
      setLoading(false);
    } else {
      setLoading(true);
    }
    await fetchHomeData();
  }, [fetchHomeData]);

  useFocusEffect(
    useCallback(() => {
      loadCacheAndFetch();
    }, [loadCacheAndFetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  }, [fetchHomeData]);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.heroName, { color: theme.text }]} numberOfLines={1}>Xin chào, {userName}!</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleBellPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={hasUnreadNotifications && notificationsEnabled ? "notifications" : "notifications-outline"}
                size={22}
                color={theme.text}
              />
              {hasUnreadNotifications && notificationsEnabled && (
                <View style={[styles.unreadDot, { borderColor: theme.card }]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.avatarInner, { backgroundColor: isDarkMode ? '#1E3A8A33' : '#E3F2FD', borderColor: theme.card }]}>
                <Ionicons name="person" size={22} color={isDarkMode ? '#90CAF9' : '#1565C0'} />
              </View>
              <View style={[styles.onlineDot, { borderColor: theme.background }]} />
            </TouchableOpacity>
          </View>
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

        <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.progressCardHeader}>
            <View>
              <Text style={[styles.progressCardTitle, { color: theme.text }]}>Tiến độ học tập</Text>
              <Text style={[styles.progressCardSub, { color: theme.textSecondary }]}>Mục tiêu: {user?.level || 'B2'} VSTEP</Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: isDarkMode ? 'rgba(230, 81, 0, 0.15)' : '#FFF3E0' }]}>
              <Ionicons name="flame" size={14} color="#E65100" />
              <Text style={[styles.streakBadgeText, { color: isDarkMode ? '#FFB74D' : '#E65100' }]}>{totalActivities} hoạt động gần đây</Text>
            </View>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={[styles.miniStatCard, { backgroundColor: isDarkMode ? 'rgba(21, 101, 192, 0.15)' : '#F0F7FF' }]}>
              <Ionicons name="document-text" size={22} color={isDarkMode ? '#90CAF9' : '#1565C0'} />
              <Text style={[styles.miniStatNum, { color: isDarkMode ? '#90CAF9' : '#1565C0' }]}>{recentActivities.length}</Text>
              <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Hoạt động đang hiển thị</Text>
            </View>
            <View style={[styles.miniStatCard, styles.miniStatCardGreen, { backgroundColor: isDarkMode ? 'rgba(46, 125, 50, 0.15)' : '#F1F8E9' }]}>
              <Ionicons name="radio-button-on" size={22} color={isDarkMode ? '#81C784' : '#2E7D32'} />
              <Text style={[styles.miniStatNum, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>{latestFullMock ? latestFullMock.overallBand?.toFixed(1) : '--'}</Text>
              <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Overall gần nhất</Text>
            </View>
          </View>

          <RadarChart
            reading={averageBands.reading}
            listening={averageBands.listening}
            writing={averageBands.writing}
            speaking={averageBands.speaking}
            isDarkMode={isDarkMode}
            theme={theme}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Kỹ năng VSTEP</Text>
        </View>

        <View style={styles.skillGrid}>
          {skills.map((skill) => {
            const skillColor = isDarkMode ? (skill.id === 'listening' ? '#90CAF9' : skill.id === 'reading' ? '#81C784' : skill.id === 'writing' ? '#FFB74D' : '#BA68C8') : skill.color;
            const skillBgColor = isDarkMode ? (skill.id === 'listening' ? 'rgba(144, 202, 249, 0.15)' : skill.id === 'reading' ? 'rgba(129, 199, 132, 0.15)' : skill.id === 'writing' ? 'rgba(255, 183, 77, 0.15)' : 'rgba(186, 104, 200, 0.15)') : skill.bgColor;

            return (
              <TouchableOpacity
                key={skill.id}
                style={[styles.skillCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => navigation.navigate(skill.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.skillIconBg, { backgroundColor: skillBgColor }]}>
                  <Ionicons name={skill.icon} size={24} color={skillColor} />
                </View>
                <Text style={[styles.skillLabel, { color: theme.text }]}>{skill.label}</Text>
                <Text style={[styles.skillDesc, { color: theme.textSecondary }]}>Vào danh sách đề của kỹ năng này</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hoạt động gần đây</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile', { screen: 'History' })}>
            <Text style={[styles.sectionSeeAll, { color: isDarkMode ? '#90CAF9' : '#1565C0' }]}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={[styles.loadingBox, { backgroundColor: theme.card }]}>
            <ActivityIndicator color={isDarkMode ? '#90CAF9' : '#1565C0'} />
          </View>
        ) : recentActivities.length ? (
          recentActivities.map((item) => {
            const meta = SKILL_META[item.skill] || SKILL_META.listening;
            const metaColor = isDarkMode ? (item.skill === 'listening' ? '#90CAF9' : item.skill === 'reading' ? '#81C784' : item.skill === 'writing' ? '#FFB74D' : '#BA68C8') : meta.color;
            const metaBgColor = isDarkMode ? (item.skill === 'listening' ? 'rgba(144, 202, 249, 0.15)' : item.skill === 'reading' ? 'rgba(129, 199, 132, 0.15)' : item.skill === 'writing' ? 'rgba(255, 183, 77, 0.15)' : 'rgba(186, 104, 200, 0.15)') : meta.bgColor;
            const btnBg = isDarkMode ? 'rgba(129, 199, 132, 0.15)' : '#E8F5E9';
            const btnText = isDarkMode ? '#81C784' : '#2E7D32';

            return (
              <View key={item._id} style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.activityIcon, { backgroundColor: metaBgColor }]}>
                  <Ionicons name={meta.icon} size={20} color={metaColor} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.testTitle || item.title || meta.label}
                  </Text>
                  <Text style={[styles.activityMeta, { color: theme.textSecondary }]}>{getActivityMeta(item)}</Text>
                </View>
                <TouchableOpacity style={[styles.activityBtn, { backgroundColor: btnBg }]} onPress={() => openActivityItem(item)}>
                  <Text style={[styles.activityBtnText, { color: btnText }]}>Xem lại</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyCardText, { color: theme.textSecondary }]}>Chưa có hoạt động nào gần đây.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Lần thi gần nhất</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MockTestHistory')}>
            <Text style={[styles.sectionSeeAll, { color: isDarkMode ? '#90CAF9' : '#1565C0' }]}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        {latestFullMock ? (
          <View style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.activityIcon, { backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.15)' : '#E3F2FD' }]}>
              <Ionicons name="ribbon" size={20} color={isDarkMode ? '#90CAF9' : '#1565C0'} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>Mock Test 4 kỹ năng</Text>
              <Text style={[styles.activityMeta, { color: theme.textSecondary }]}>
                {formatDateTime(latestFullMock.completedAt)} • Overall {latestFullMock.overallBand?.toFixed(1) || '0.0'}/10.0
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.activityBtn, { backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.15)' : '#E3F2FD' }]}
              onPress={() => navigation.navigate('MockTestResult', { result: latestFullMock })}
            >
              <Text style={[styles.activityBtnText, { color: isDarkMode ? '#90CAF9' : '#1565C0' }]}>Chi tiết</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyCardText, { color: theme.textSecondary }]}>Chưa có lần thi 4 kỹ năng nào.</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={isNotificationsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.popupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Header popup */}
            <View style={[styles.popupHeader, { borderBottomColor: isDarkMode ? '#2C2C2C' : '#F1F5F9' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.bellIconContainer, { backgroundColor: isDarkMode ? '#1565C033' : '#E3F2FD' }]}>
                  <Ionicons name="notifications" size={20} color={isDarkMode ? '#90CAF9' : '#1565C0'} />
                </View>
                <Text style={[styles.popupTitle, { color: theme.text }]}>Thông báo</Text>
              </View>
              <TouchableOpacity
                style={[styles.popupCloseBtn, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F1F5F9' }]}
                onPress={() => setIsNotificationsModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={isDarkMode ? '#A0A0A0' : '#546E7A'} />
              </TouchableOpacity>
            </View>

            {/* Notifications Scroll */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.notifScroll}>
              {notificationsList.length > 0 ? (
                notificationsList.map((item) => {
                  const adjustedBg = isDarkMode ? `${item.iconColor}22` : item.iconBg;
                  const adjustedColor = isDarkMode ? (item.iconColor === '#757575' ? '#A0A0A0' : item.iconColor) : item.iconColor;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.notifItem,
                        { borderColor: isDarkMode ? '#2C2C2C' : '#F1F5F9' },
                        item.unread && { backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF' }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        // Đánh dấu thông báo này là đã đọc
                        setNotificationsList(prev =>
                          prev.map(n => n.id === item.id ? { ...n, unread: false } : n)
                        );
                        // Cập nhật xem còn thông báo chưa đọc nào không
                        setTimeout(() => {
                          setNotificationsList(currentList => {
                            const stillUnread = currentList.some(n => n.unread);
                            setHasUnreadNotifications(stillUnread);
                            return currentList;
                          });
                        }, 50);

                        // Nếu là speaking hoặc writing, có thể điều hướng hoặc hiện Alert thông tin
                        if (item.type === 'speaking' || item.type === 'writing') {
                          Alert.alert(
                            item.title,
                            item.body,
                            [
                              { text: 'Đóng', style: 'cancel' },
                              { 
                                text: 'Xem kết quả', 
                                onPress: () => {
                                  setIsNotificationsModalVisible(false);
                                  // Điều hướng đến lịch sử
                                  navigation.getParent()?.navigate('Profile', { screen: 'History' });
                                } 
                              }
                            ]
                          );
                        } else {
                          Alert.alert(item.title, item.body);
                        }
                      }}
                    >
                      <View style={[styles.notifIconBg, { backgroundColor: adjustedBg }]}>
                        <Ionicons name={item.icon} size={18} color={adjustedColor} />
                      </View>
                      <View style={styles.notifContent}>
                        <View style={styles.notifTitleRow}>
                          <Text style={[styles.notifTitle, { color: theme.text }, item.unread && styles.boldText]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.unread && <View style={styles.blueUnreadDot} />}
                        </View>
                        <Text style={[styles.notifBody, { color: theme.textSecondary }]} numberOfLines={2}>
                          {item.body}
                        </Text>
                        <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                          {item.time}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyNotifContainer}>
                  <Ionicons name="notifications-off-outline" size={48} color={isDarkMode ? '#444' : '#CFD8DC'} />
                  <Text style={[styles.emptyNotifText, { color: theme.textSecondary }]}>Bạn chưa có thông báo nào.</Text>
                </View>
              )}
            </ScrollView>

            {/* Footer popup */}
            {notificationsList.some(n => n.unread) && (
              <TouchableOpacity
                style={[styles.markAllBtn, { borderTopColor: isDarkMode ? '#2C2C2C' : '#F1F5F9' }]}
                onPress={() => {
                  setNotificationsList(prev => prev.map(n => ({ ...n, unread: false })));
                  setHasUnreadNotifications(false);
                }}
              >
                <Ionicons name="checkmark-done-outline" size={18} color="#1565C0" />
                <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
    width: 240,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
    alignSelf: 'center',
  },
  radarCircle1: { position: 'absolute', width: 46.6, height: 46.6, borderRadius: 23.3, borderWidth: 1, borderColor: '#E2E8F0' },
  radarCircle2: { position: 'absolute', width: 93.3, height: 93.3, borderRadius: 46.6, borderWidth: 1, borderColor: '#E2E8F0' },
  radarCircle3: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: '#CBD5E1' },
  radarLine: { position: 'absolute', width: 140, height: 1, backgroundColor: '#E2E8F0' },
  radarDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1565C0',
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  radarLabel: {
    position: 'absolute',
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
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

  // Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
    borderWidth: 2,
  },

  // Modal Popup Notifications
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  bellIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  popupCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifScroll: {
    marginHorizontal: -4,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  notifIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  boldText: {
    fontWeight: '800',
  },
  blueUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1565C0',
    marginLeft: 6,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyNotifContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyNotifText: {
    fontSize: 14,
    fontWeight: '500',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
});
