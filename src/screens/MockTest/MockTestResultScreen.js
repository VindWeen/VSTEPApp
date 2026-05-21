import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getFullMockSkillColor, getFullMockSkillIcon, getFullMockSkillLabel } from '../../utils/fullMockTest';

const formatDateTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MockTestResultScreen({ route, navigation }) {
  const { theme, isDarkMode } = useTheme();
  const result = route.params?.result;
  const fromHistory = route.params?.fromHistory;

  const handleClose = () => {
    if (fromHistory) {
      navigation.popToTop();
      navigation.navigate('Profile', { screen: 'History' });
    } else {
      navigation.popToTop();
    }
  };

  if (!result) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Không có dữ liệu kết quả.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openSkillReview = (skill) => {
    const skillResult = result.skills?.[skill];
    const selectedTest = result.selectedTests?.[skill];

    if (skill === 'listening') {
      navigation.navigate('FullMockListeningResult', {
        testId: skillResult.testId,
        answers: skillResult.userAnswers,
        detail: { _id: skillResult.testId },
        fromFullMock: true,
      });
      return;
    }

    if (skill === 'reading') {
      navigation.navigate('FullMockReadingResult', {
        testId: skillResult.testId,
        answers: skillResult.userAnswers,
        test: selectedTest,
        passages: [],
        timeTaken: skillResult.duration || 0,
        fromFullMock: true,
      });
      return;
    }

    if (skill === 'writing') {
      navigation.navigate('FullMockWritingResult', {
        result: skillResult,
        test: selectedTest,
        draftResponses: skillResult.draftResponses || [],
        fromFullMock: true,
      });
      return;
    }

    navigation.navigate('FullMockSpeakingResult', {
      result: skillResult,
      test: selectedTest,
      fromFullMock: true,
    });
  };

  const homeBtnColor = isDarkMode ? '#1E88E5' : '#0F4C81';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.card }]} onPress={handleClose}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Kết quả thi thử 4 kỹ năng</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: isDarkMode ? theme.card : '#0F4C81', borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
          <Text style={[styles.heroLabel, { color: isDarkMode ? theme.textSecondary : '#B9D9F3' }]}>OVERALL BAND</Text>
          <Text style={[styles.heroBand, { color: isDarkMode ? '#64B5F6' : '#fff' }]}>{result.overallBand?.toFixed(1) || '0.0'}</Text>
          <Text style={[styles.heroMeta, { color: isDarkMode ? theme.textSecondary : '#D7EAF7' }]}>{formatDateTime(result.completedAt)}</Text>
        </View>

        {['listening', 'reading', 'speaking', 'writing'].map((skill) => {
          const skillResult = result.skills?.[skill];
          const baseColor = getFullMockSkillColor(skill);
          const color = isDarkMode
            ? (skill === 'listening' ? '#64B5F6' : skill === 'reading' ? '#81C784' : skill === 'writing' ? '#FFB74D' : '#E040FB')
            : baseColor;

          return (
            <View key={skill} style={[styles.skillCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.skillRow}>
                <View style={[styles.skillIcon, { backgroundColor: `${color}18` }]}>
                  <Ionicons name={getFullMockSkillIcon(skill)} size={18} color={color} />
                </View>
                <View style={styles.skillInfo}>
                  <Text style={[styles.skillName, { color: theme.text }]}>{getFullMockSkillLabel(skill)}</Text>
                  <Text style={[styles.skillMeta, { color: theme.textSecondary }]}>{skillResult?.testTitle || result.selectedTests?.[skill]?.title}</Text>
                </View>
                <Text style={[styles.skillBand, { color }]}>{skillResult?.band?.toFixed(1) || '0.0'}</Text>
              </View>

              <TouchableOpacity style={[styles.reviewBtn, { borderColor: color }]} onPress={() => openSkillReview(skill)}>
                <Text style={[styles.reviewBtnText, { color }]}>Xem lại kỹ năng này</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={[styles.homeBtn, { backgroundColor: homeBtnColor }]} onPress={handleClose}>
          <Text style={styles.homeBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#607D8B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  spacer: { width: 36, height: 36 },
  container: { padding: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#0F4C81',
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: { fontSize: 12, fontWeight: '800', color: '#B9D9F3', letterSpacing: 1.2 },
  heroBand: { fontSize: 54, fontWeight: '900', color: '#fff', marginVertical: 8 },
  heroMeta: { fontSize: 13, color: '#D7EAF7' },
  skillCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  skillMeta: { fontSize: 12, color: '#607D8B' },
  skillBand: { fontSize: 24, fontWeight: '900' },
  reviewBtn: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 11,
    alignItems: 'center',
  },
  reviewBtnText: { fontSize: 14, fontWeight: '800' },
  homeBtn: {
    marginTop: 8,
    backgroundColor: '#0F4C81',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
