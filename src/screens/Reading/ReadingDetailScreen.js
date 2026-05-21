import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReadingDetail } from '../../services/api';
import { clearPracticeState, savePracticeState } from '../../utils/practiceState';
import { updateFullMockProgress } from '../../utils/fullMockTest';

const MOCK_TEST = {
  _id: 'mock1',
  title: 'Đề Đọc Số 1',
  level: 'B1',
  totalQuestions: 8,
  duration: 60,
  passages: [
    {
      passageNumber: 1,
      passageType: 'Đọc hiểu',
      title: 'The Impact of Technology on Education',
      content:
        'In recent decades, technology has transformed the landscape of education worldwide.',
      questions: [],
    },
  ],
};

const normalizeReadingTest = (rawTest) => {
  if (!rawTest) return MOCK_TEST;
  if (rawTest.passages?.length) return rawTest;

  const passages = (rawTest.parts || []).map((part, index) => ({
    passageNumber: part.partNumber || index + 1,
    passageType: part.partDescription || `Phần ${part.partNumber || index + 1}`,
    title: part.passageTitle || part.partTitle || `Passage ${index + 1}`,
    content: part.passageText || '',
    questions: part.questions || [],
  }));

  return {
    ...rawTest,
    passages,
  };
};

export default function ReadingDetailScreen({ route, navigation }) {
  const initialTest = route.params?.test || MOCK_TEST;
  const resumeState = route.params?.resumeState || null;
  const fullMockMode = route.params?.fullMockMode || false;
  const [test, setTest] = useState(normalizeReadingTest(initialTest));
  const [loading, setLoading] = useState(!initialTest?.passages?.length && !initialTest?.parts?.length);
  const [answers, setAnswers] = useState(resumeState?.answers || {});
  const [timeLeft, setTimeLeft] = useState(resumeState?.timeLeft || ((initialTest?.duration || 60) * 60));
  const [expandedPassage, setExpandedPassage] = useState(0);
  const timerRef = useRef(null);
  const testStorageKey = initialTest?._id || initialTest?.title;

  useEffect(() => {
    let cancelled = false;

    const loadFullTest = async () => {
      if (initialTest?.passages?.length || initialTest?.parts?.length || !initialTest?._id) {
        const normalized = normalizeReadingTest(initialTest);
        setTest(normalized);
        if (!resumeState) {
          setTimeLeft((normalized.duration || 60) * 60);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await getReadingDetail(initialTest._id);
        if (cancelled) return;
        const normalized = normalizeReadingTest(res.data.data);
        setTest(normalized);
        if (!resumeState) {
          setTimeLeft((normalized.duration || 60) * 60);
        }
      } catch (error) {
        console.error('Lỗi load reading detail:', error.message);
        if (!cancelled) {
          setTest(normalizeReadingTest(initialTest));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFullTest();

    return () => {
      cancelled = true;
    };
  }, [initialTest]);

  const passages = useMemo(() => test.passages || [], [test]);
  const allQuestions = useMemo(() => passages.flatMap((p) => p.questions || []), [passages]);
  const totalQ = allQuestions.length;
  const totalTime = (test.duration || 60) * 60;
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (loading) return undefined;

    timerRef.current = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, totalQ]);

  useEffect(() => {
    if (loading || !test?._id) return;

    savePracticeState('reading', testStorageKey, {
      testId: testStorageKey,
      title: test.title,
      level: test.level,
      answers,
      timeLeft,
    }).catch(() => {});

    if (fullMockMode) {
      updateFullMockProgress('reading', {
        status: 'in_progress',
        answers,
        timeLeft,
      }).catch(() => {});
    }
  }, [loading, test?._id, answers, timeLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleAnswer = (qNum, option) => {
    setAnswers((prev) => ({ ...prev, [qNum]: option }));
  };

  const doSubmit = () => {
    clearInterval(timerRef.current);
    clearPracticeState('reading', testStorageKey).catch(() => {});

    if (fullMockMode) {
      updateFullMockProgress('reading', {
        status: 'completed',
        answers,
        timeLeft,
        timeTaken: totalTime - timeLeft,
        completedAt: new Date().toISOString(),
      }).finally(() => {
        navigation.replace('MockTestHub', {
          sessionId: route.params?.fullMockSessionId,
          justCompleted: 'reading',
        });
      });
      return;
    }

    navigation.replace('ReadingResult', {
      testId: test._id,
      answers,
      test,
      passages,
      timeTaken: totalTime - timeLeft,
    });
  };

  const handleSubmit = (auto = false) => {
    if (!auto && answeredCount < totalQ) {
      Alert.alert(
        'Nộp bài?',
        `Bạn còn ${totalQ - answeredCount} câu chưa trả lời. Bạn có chắc muốn nộp bài?`,
        [
          { text: 'Tiếp tục làm', style: 'cancel' },
          { text: 'Nộp bài', style: 'destructive', onPress: doSubmit },
        ]
      );
      return;
    }

    doSubmit();
  };

  const handleExit = () => {
    Alert.alert(
      'Thoát bài thi?',
      'Tiến trình hiện tại sẽ được lưu tạm để bạn tiếp tục sau. Bạn có chắc chắn muốn thoát?',
      [
        { text: 'Tiếp tục làm bài', style: 'cancel' },
        {
          text: 'Thoát',
          style: 'destructive',
          onPress: () => {
            clearInterval(timerRef.current);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Đang tải đầy đủ đề đọc...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{test.title || 'Đề Đọc'}</Text>
          <Text style={styles.headerSub}>{answeredCount}/{totalQ} câu đã trả lời</Text>
        </View>
        <View style={[styles.timerBadge, timeLeft < 300 && styles.timerBadgeWarning]}>
          <Ionicons name="time-outline" size={16} color={timeLeft < 300 ? '#fff' : '#2E7D32'} />
          <Text style={[styles.timerText, timeLeft < 300 && styles.timerTextWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {passages.map((passage, pIdx) => (
          <View key={pIdx} style={styles.passageSection}>
            <View style={styles.passageHeader}>
              <View style={styles.passageTag}>
                <Ionicons name="document-text" size={13} color="#2E7D32" />
                <Text style={styles.passageTagText}>
                  Bài đọc {passage.passageNumber}/{passages.length}
                </Text>
              </View>
              <Text style={styles.passageType}>{passage.passageType}</Text>
            </View>

            <View style={styles.passageCard}>
              {passage.title ? <Text style={styles.passageTitle}>{passage.title}</Text> : null}
              <Text style={styles.passageContent}>
                {expandedPassage === pIdx
                  ? passage.content
                  : `${String(passage.content || '').slice(0, 700)}${String(passage.content || '').length > 700 ? '...' : ''}`}
              </Text>
              {expandedPassage !== pIdx && String(passage.content || '').length > 700 ? (
                <TouchableOpacity style={styles.expandBtn} onPress={() => setExpandedPassage(pIdx)}>
                  <Text style={styles.expandBtnText}>Xem toàn bộ passage</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.questionsHeader}>
              <Text style={styles.questionsTitle}>
                Câu hỏi ({passage.questions?.[0]?.questionNumber}–{passage.questions?.[passage.questions.length - 1]?.questionNumber})
              </Text>
              <Text style={styles.questionsAnswered}>
                {(passage.questions || []).filter((q) => answers[q.questionNumber]).length}/{passage.questions?.length || 0} đã trả lời
              </Text>
            </View>

            {(passage.questions || []).map((q) => (
              <View key={q.questionNumber} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumBadge}>
                    <Text style={styles.questionNumText}>{q.questionNumber}</Text>
                  </View>
                  <Text style={styles.questionText}>{q.questionText}</Text>
                </View>

                {Object.entries(q.options || {}).map(([key, val]) => {
                  const isSelected = answers[q.questionNumber] === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => handleAnswer(q.questionNumber, key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                        {isSelected ? <View style={styles.optionRadioDot} /> : null}
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {key}. {val}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerCount}>Đã trả lời: {answeredCount}/{totalQ} câu</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={() => handleSubmit(false)} activeOpacity={0.85}>
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>Nộp bài</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    gap: 12,
  },
  loadingText: { fontSize: 15, color: '#2E7D32', fontWeight: '700' },
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    paddingTop: Platform.OS === 'android' ? 16 : 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  headerSub: { fontSize: 12, color: '#757575', marginTop: 2 },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerBadgeWarning: { backgroundColor: '#FF5252' },
  timerText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  timerTextWarning: { color: '#fff' },
  scroll: { padding: 16 },
  passageSection: { marginBottom: 8 },
  passageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  passageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  passageTagText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  passageType: { fontSize: 13, color: '#757575', fontWeight: '500' },
  passageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  passageTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  passageContent: { fontSize: 14, color: '#444', lineHeight: 22 },
  expandBtn: { marginTop: 8, alignSelf: 'flex-end' },
  expandBtnText: { fontSize: 13, color: '#2E7D32', fontWeight: '700' },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  questionsTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  questionsAnswered: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  questionNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  questionNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  questionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E', lineHeight: 22 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
    gap: 10,
  },
  optionSelected: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B0BEC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: { borderColor: '#2E7D32' },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  optionText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  optionTextSelected: { color: '#2E7D32', fontWeight: '700' },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    alignItems: 'center',
    gap: 8,
  },
  footerCount: { fontSize: 13, color: '#757575', fontWeight: '500' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
