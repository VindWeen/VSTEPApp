import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import {
  scoreSpeakingTest,
  scoreWritingTest,
  submitResult,
  uploadSpeaking,
} from '../../services/api';
import {
  appendFullMockHistory,
  calculateObjectiveBand,
  calculateOverallBand,
  clearActiveFullMockSession,
  convertFiveScaleToNineBand,
  FULL_MOCK_SKILL_ORDER,
  getFullMockSkillColor,
  getFullMockSkillIcon,
  getFullMockSkillLabel,
  getNextFullMockSkill,
  isFullMockReadyForSubmit,
  loadActiveFullMockSession,
} from '../../utils/fullMockTest';

const inferAudioFileMeta = (uri = '', fallbackBaseName = 'speaking-part') => {
  const cleanUri = String(uri).split('?')[0];
  const match = cleanUri.match(/\.([a-z0-9]+)$/i);
  const extension = (match?.[1] || 'm4a').toLowerCase();

  const mimeByExtension = {
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    aac: 'audio/aac',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    '3gp': 'audio/3gpp',
    amr: 'audio/amr',
  };

  return {
    extension,
    type: mimeByExtension[extension] || 'audio/mp4',
    name: `${fallbackBaseName}.${extension}`,
  };
};

export default function MockTestHubScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const active = await loadActiveFullMockSession();
    setSession(active);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSession();
    }, [refreshSession])
  );

  const goToSkill = (skill) => {
    if (!session) return;

    const test = session.selectedTests?.[skill];
    const progress = session.progress?.[skill] || {};

    if (skill === 'listening') {
      navigation.navigate('FullMockListeningDetail', {
        test,
        resumeState: progress.status !== 'not_started' ? progress : undefined,
        fullMockMode: true,
        fullMockSessionId: session.id,
      });
      return;
    }

    if (skill === 'reading') {
      navigation.navigate('FullMockReadingDetail', {
        test,
        resumeState: progress.status !== 'not_started' ? progress : undefined,
        fullMockMode: true,
        fullMockSessionId: session.id,
      });
      return;
    }

    if (skill === 'speaking') {
      navigation.navigate(
        progress.screen === 'record' ? 'FullMockSpeakingRecord' : 'FullMockSpeakingPrep',
        {
          test,
          taskIndex: progress.taskIndex || 0,
          draftResponses: progress.draftResponses || [],
          resumeState: progress.status !== 'not_started' ? progress : undefined,
          fullMockMode: true,
          fullMockSessionId: session.id,
        }
      );
      return;
    }

    navigation.navigate('FullMockWritingCompose', {
      test,
      taskIndex: progress.taskIndex || 0,
      draftResponses: progress.draftResponses || [],
      resumeState: progress.status !== 'not_started' ? progress : undefined,
      fullMockMode: true,
      fullMockSessionId: session.id,
    });
  };

  const handlePrimaryAction = () => {
    if (!session) return;

    if (isFullMockReadyForSubmit(session)) {
      handleSubmitFullTest();
      return;
    }

    const nextSkill = getNextFullMockSkill(session);
    if (nextSkill) {
      goToSkill(nextSkill);
    }
  };

  const handleSubmitFullTest = async () => {
    if (!session || !isFullMockReadyForSubmit(session) || submitting) return;

    setSubmitting(true);

    try {
      const listeningProgress = session.progress.listening;
      const readingProgress = session.progress.reading;
      const speakingProgress = session.progress.speaking;
      const writingProgress = session.progress.writing;

      setSubmitStep('Đang nộp phần Nghe...');
      const listeningSubmit = await submitResult({
        testId: session.selectedTests.listening._id,
        skill: 'listening',
        answers: Object.entries(listeningProgress.answers || {}).map(([questionNumber, userAnswer]) => ({
          questionNumber: Number(questionNumber),
          userAnswer,
        })),
        duration: listeningProgress.timeTaken || 0,
      });

      setSubmitStep('Đang nộp phần Đọc...');
      const readingSubmit = await submitResult({
        testId: session.selectedTests.reading._id,
        skill: 'reading',
        answers: Object.entries(readingProgress.answers || {}).map(([questionNumber, userAnswer]) => ({
          questionNumber: Number(questionNumber),
          userAnswer,
        })),
        duration: readingProgress.timeTaken || 0,
      });

      setSubmitStep('Đang chấm phần Viết...');
      const writingSubmit = await scoreWritingTest({
        testTitle: session.selectedTests.writing.title,
        level: session.selectedTests.writing.level,
        tasks: (writingProgress.draftResponses || []).map((task) => ({
          title: task.title,
          taskType: task.taskType,
          prompt: task.prompt,
          essay: task.essay,
          level: task.level,
        })),
      });

      setSubmitStep('Đang tải và chấm phần Nói...');
      const speakingIds = [];
      for (const draft of speakingProgress.draftResponses || []) {
        const fileMeta = inferAudioFileMeta(
          draft.localUri,
          String(draft.partType || 'part').replace(/\s+/g, '-').toLowerCase()
        );
        const formData = new FormData();
        formData.append('audio', {
          uri: Platform.OS === 'android' ? draft.localUri : draft.localUri.replace('file://', ''),
          type: fileMeta.type,
          name: fileMeta.name,
        });
        formData.append('title', draft.title || '');
        formData.append('prompt', draft.prompt || '');
        formData.append('level', draft.level || session.selectedTests.speaking.level || 'B1');
        formData.append('partType', draft.partType || 'Part 1');

        const uploadRes = await uploadSpeaking(formData);
        speakingIds.push(uploadRes.data.data.speakingId);
      }

      const speakingSubmit = await scoreSpeakingTest({
        testTitle: session.selectedTests.speaking.title,
        level: session.selectedTests.speaking.level,
        speakingIds,
      });

      const listeningResult = listeningSubmit.data?.data || {};
      const readingResult = readingSubmit.data?.data || {};
      const writingResult = writingSubmit.data?.data || {};
      const speakingResult = speakingSubmit.data?.data || {};

      const finalResult = {
        id: `full-result-${Date.now()}`,
        createdAt: session.createdAt,
        completedAt: new Date().toISOString(),
        selectedTests: session.selectedTests,
        skills: {
          listening: {
            ...listeningResult,
            skill: 'listening',
            testId: session.selectedTests.listening._id,
            testTitle: session.selectedTests.listening.title,
            userAnswers: listeningProgress.answers || {},
            duration: listeningProgress.timeTaken || 0,
            band: calculateObjectiveBand('listening', listeningResult.score, listeningResult.total),
          },
          reading: {
            ...readingResult,
            skill: 'reading',
            testId: session.selectedTests.reading._id,
            testTitle: session.selectedTests.reading.title,
            userAnswers: readingProgress.answers || {},
            duration: readingProgress.timeTaken || 0,
            band: calculateObjectiveBand('reading', readingResult.score, readingResult.total),
          },
          speaking: {
            ...speakingResult,
            skill: 'speaking',
            testTitle: session.selectedTests.speaking.title,
            draftResponses: speakingProgress.draftResponses || [],
            band: convertFiveScaleToNineBand(speakingResult.aiFeedback?.band),
          },
          writing: {
            ...writingResult,
            skill: 'writing',
            testTitle: session.selectedTests.writing.title,
            draftResponses: writingProgress.draftResponses || [],
            band: convertFiveScaleToNineBand(writingResult.aiFeedback?.band),
          },
        },
      };

      finalResult.overallBand = calculateOverallBand([
        finalResult.skills.listening.band,
        finalResult.skills.reading.band,
        finalResult.skills.speaking.band,
        finalResult.skills.writing.band,
      ]);

      await appendFullMockHistory(finalResult);
      await clearActiveFullMockSession();

      navigation.replace('MockTestResult', {
        result: finalResult,
      });
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Không thể nộp bài', error.response?.data?.message || error.message || 'Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={isDarkMode ? '#64B5F6' : '#0F4C81'} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có bài thi đang hoạt động</Text>
          <TouchableOpacity style={[styles.backHomeBtn, { backgroundColor: isDarkMode ? '#1E88E5' : '#0F4C81' }]} onPress={() => navigation.replace('MockTestIntro')}>
            <Text style={styles.backHomeBtnText}>Tạo bài thi mới</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const nextSkill = getNextFullMockSkill(session);
  const primaryBtnColor = isDarkMode ? '#1E88E5' : '#0F4C81';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Bài thi 4 kỹ năng</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Làm lần lượt và chỉ nộp khi đủ cả 4 phần.</Text>
          </View>
        </View>

        {FULL_MOCK_SKILL_ORDER.map((skill, index) => {
          const progress = session.progress?.[skill] || {};
          const baseColor = getFullMockSkillColor(skill);
          const color = isDarkMode
            ? (skill === 'listening' ? '#64B5F6' : skill === 'reading' ? '#81C784' : skill === 'writing' ? '#FFB74D' : '#E040FB')
            : baseColor;
          const status = progress.status || 'not_started';
          const isDone = status === 'completed';
          const isCurrent = nextSkill === skill;
          const test = session.selectedTests?.[skill];

          let chipBg = isDarkMode ? '#333333' : '#ECEFF1';
          let chipText = isDarkMode ? '#A0A0A0' : '#607D8B';
          if (isDone) {
            chipBg = isDarkMode ? '#1B5E20' : '#E8F5E9';
            chipText = isDarkMode ? '#81C784' : '#2E7D32';
          } else if (isCurrent) {
            chipBg = isDarkMode ? '#0D47A1' : '#E3F2FD';
            chipText = isDarkMode ? '#64B5F6' : '#1565C0';
          }

          return (
            <View key={skill} style={[styles.skillCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.skillTop}>
                <View style={[styles.skillBadge, { backgroundColor: `${color}18` }]}>
                  <Ionicons name={getFullMockSkillIcon(skill)} size={18} color={color} />
                </View>
                <View style={styles.skillContent}>
                  <Text style={[styles.skillName, { color: theme.text }]}>
                    {index + 1}. {getFullMockSkillLabel(skill)}
                  </Text>
                  <Text style={[styles.skillMeta, { color: theme.textSecondary }]}>{test?.title || 'Chưa có đề'}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
                  <Text style={[styles.statusChipText, { color: chipText }]}>
                    {isDone ? 'Hoàn thành' : isCurrent ? 'Sẵn sàng' : status === 'in_progress' ? 'Đang làm' : 'Chờ'}
                  </Text>
                </View>
              </View>

              {progress.completedAt ? (
                <Text style={[styles.skillHint, { color: theme.textSecondary }]}>Phần này đã khóa sau khi hoàn thành.</Text>
              ) : status === 'in_progress' ? (
                <Text style={[styles.skillHint, { color: theme.textSecondary }]}>Có tiến trình đang lưu, bạn có thể vào làm tiếp.</Text>
              ) : (
                <Text style={[styles.skillHint, { color: theme.textSecondary }]}>Kỹ năng này sẽ mở theo đúng thứ tự bài thi.</Text>
              )}

              {(isCurrent || status === 'in_progress') && !submitting ? (
                <TouchableOpacity style={[styles.skillActionBtn, { borderColor: color }]} onPress={() => goToSkill(skill)}>
                  <Text style={[styles.skillActionText, { color }]}>
                    {status === 'in_progress' ? `Tiếp tục phần ${getFullMockSkillLabel(skill)}` : `Bắt đầu phần ${getFullMockSkillLabel(skill)}`}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: primaryBtnColor }, submitting && styles.primaryBtnDisabled]}
          onPress={handlePrimaryAction}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.primaryBtnText}>{submitStep || 'Đang nộp bài...'}</Text>
            </>
          ) : (
            <>
              <Ionicons
                name={isFullMockReadyForSubmit(session) ? 'checkmark-circle' : 'play'}
                size={18}
                color="#fff"
              />
              <Text style={styles.primaryBtnText}>
                {isFullMockReadyForSubmit(session)
                  ? 'Nộp bài & chấm điểm toàn bộ'
                  : `Bắt đầu ${getFullMockSkillLabel(nextSkill)}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 14 },
  backHomeBtn: { backgroundColor: '#0F4C81', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  backHomeBtnText: { color: '#fff', fontWeight: '800' },
  headerRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 18 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#607D8B', lineHeight: 19 },
  skillCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  skillTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillContent: { flex: 1 },
  skillName: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  skillMeta: { fontSize: 13, color: '#607D8B' },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusChipText: { fontSize: 12, fontWeight: '800' },
  statusDone: { backgroundColor: '#E8F5E9' },
  statusDoneText: { color: '#2E7D32' },
  statusCurrent: { backgroundColor: '#E3F2FD' },
  statusCurrentText: { color: '#1565C0' },
  statusIdle: { backgroundColor: '#ECEFF1' },
  statusIdleText: { color: '#607D8B' },
  skillHint: { fontSize: 12, color: '#78909C', marginTop: 10, lineHeight: 18 },
  skillActionBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skillActionText: { fontSize: 14, fontWeight: '800' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#0F4C81',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
