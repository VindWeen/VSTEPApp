import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Platform, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import {
  getMyResults,
  getWritingHistory,
  getSpeakingHistory,
} from '../../services/api';
import {
  calculateObjectiveBand,
  convertFiveScaleToNineBand,
  loadFullMockHistory,
} from '../../utils/fullMockTest';

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

export default function ProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { isDarkMode, theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [totalTests, setTotalTests] = useState(0);
  const [averageBands, setAverageBands] = useState({ listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 });

  const name = user?.name || 'Nguyễn Văn Minh';
  const email = user?.email || 'minhnv@gmail.com';
  const level = user?.level || 'B2';
  const role = user?.role || 'user';
  const isAdmin = role === 'admin';

  const fetchProfileData = useCallback(async () => {
    try {
      const [objectiveRes, writingRes, speakingRes, mockHistory] = await Promise.all([
        getMyResults({ limit: 100 }),
        getWritingHistory({ limit: 100 }),
        getSpeakingHistory({ limit: 100 }),
        loadFullMockHistory(),
      ]);

      const objCount = objectiveRes.data?.data?.length || 0;
      const writeCount = writingRes.data?.data?.length || 0;
      const speakCount = speakingRes.data?.data?.length || 0;
      const mockCount = mockHistory?.length || 0;
      setTotalTests(objCount + writeCount + speakCount + mockCount);

      // Compute averages
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

      const mockHistoryData = mockHistory || [];
      mockHistoryData.forEach(mock => {
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

      setAverageBands({
        listening: avgL,
        reading: avgR,
        writing: avgW,
        speaking: avgS,
      });
    } catch (error) {
      console.error('Lỗi tải dữ liệu profile:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.level]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfileData();
    }, [fetchProfileData])
  );

  const avgLR = (averageBands.listening + averageBands.reading) / 2;
  const avgWS = (averageBands.writing + averageBands.speaking) / 2;

  const skillBars = [
    { label: 'Nghe', icon: 'headset', color: '#1565C0', bgColor: '#E3F2FD', score: averageBands.listening },
    { label: 'Đọc', icon: 'book', color: '#2E7D32', bgColor: '#E8F5E9', score: averageBands.reading },
    { label: 'Viết', icon: 'create', color: '#E65100', bgColor: '#FBE9E7', score: averageBands.writing },
    { label: 'Nói', icon: 'mic', color: '#6A1B9A', bgColor: '#F3E5F5', score: averageBands.speaking },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Hồ sơ</Text>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F0F0F0' }]}
          onPress={() => navigation.navigate('ProfileSettings')}
        >
          <Ionicons name="settings-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* User card */}
        <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.avatarBg, isDarkMode && { backgroundColor: '#1565C022' }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={34} color={isDarkMode ? '#2196F3' : '#1565C0'} />
            )}
            <View style={[styles.avatarVerified, { borderColor: theme.card }]}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{name}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
            {isAdmin ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>ADMIN</Text>
              </View>
            ) : null}
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{email}</Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: isDarkMode ? '#2196F3' : '#1565C0' }]}
            onPress={() => navigation.navigate('ProfileSettings', { openEditProfile: true })}
          >
            <Text style={[styles.editBtnText, { color: isDarkMode ? '#2196F3' : '#1565C0' }]}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.text }]}>{loading ? '--' : totalTests}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Bài đã{'\n'}làm</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="flame" size={16} color={isDarkMode ? '#FFB74D' : '#E65100'} />
            <Text style={[styles.statNum, { color: isDarkMode ? '#FFB74D' : '#E65100' }]}>{user?.streak || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>ngày{'\n'}Streak</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.text }]}>{loading ? '--' : avgLR.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Nghe/{'\n'}Đọc</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.text }]}>{loading ? '--' : avgWS.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Viết/{'\n'}Nói</Text>
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

        {isAdmin ? (
          <TouchableOpacity
            style={[styles.adminBtn, isDarkMode && { backgroundColor: '#3A2E0B', borderColor: '#5C4810', borderWidth: 1 }]}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <View style={[styles.adminIconWrap, isDarkMode && { backgroundColor: '#5C481033' }]}>
              <Ionicons name="shield-checkmark" size={20} color={isDarkMode ? '#FFE082' : '#102A43'} />
            </View>
            <View style={styles.adminTextWrap}>
              <Text style={[styles.adminTitle, isDarkMode && { color: '#FFE082' }]}>Khu quản trị đề thi</Text>
              <Text style={[styles.adminSubtitle, isDarkMode && { color: '#FFE082CC' }]}>Tạo nhanh đề Listening, Reading, Writing và Speaking</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#FFE082' : '#102A43'} />
          </TouchableOpacity>
        ) : null}

        {/* Skill progress */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tiến độ kỹ năng</Text>
          {skillBars.map(s => {
            const pct = Math.round((s.score / 10.0) * 100);
            return (
              <View key={s.label} style={styles.skillRow}>
                <View style={[styles.skillIconBg, { backgroundColor: isDarkMode ? `${s.color}22` : s.bgColor }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <View style={styles.skillBarArea}>
                  <View style={styles.skillLabelRow}>
                    <Text style={[styles.skillLabelText, { color: theme.text }]}>{s.label}</Text>
                    <Text style={[styles.skillPct, { color: s.color }]}>{pct}% ({s.score.toFixed(1)})</Text>
                  </View>
                  <View style={[styles.skillBarBg, { backgroundColor: theme.border }]}>
                    <View style={[styles.skillBarFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Radar chart */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Biểu đồ kỹ năng</Text>
          {loading ? (
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={isDarkMode ? '#2196F3' : '#1565C0'} />
            </View>
          ) : (
            <RadarChart
              reading={averageBands.reading}
              listening={averageBands.listening}
              writing={averageBands.writing}
              speaking={averageBands.speaking}
              isDarkMode={isDarkMode}
              theme={theme}
            />
          )}
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
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
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#102A43',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: { fontSize: 11, fontWeight: '800', color: '#fff' },
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
  adminBtn: {
    backgroundColor: '#FEC84B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF7D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminTextWrap: { flex: 1 },
  adminTitle: { color: '#102A43', fontSize: 15, fontWeight: '800' },
  adminSubtitle: { color: '#334E68', fontSize: 12, marginTop: 3, lineHeight: 17 },

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
  radarContainer: {
    width: 240,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
    alignSelf: 'center',
  },
  radarLabel: {
    position: 'absolute',
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },

});
