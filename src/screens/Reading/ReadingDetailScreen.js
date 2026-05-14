import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReadingAnswers, submitResult } from '../../services/api';

// Mock reading test data
const MOCK_TEST = {
  _id: 'mock1',
  title: 'Đề Đọc Số 1',
  level: 'B1',
  totalQuestions: 30,
  duration: 60,
  passages: [
    {
      passageNumber: 1,
      passageType: 'Đọc hiểu',
      title: 'The Impact of Technology on Education',
      content: `In recent decades, technology has <highlight>fundamentally</highlight> transformed the landscape of education worldwide. Digital tools, online platforms, and interactive media have revolutionized how students learn and how teachers instruct. The proliferation of devices such as tablets, laptops, and smartphones has made educational resources more accessible than ever before, enabling learners to access information instantaneously from virtually any location.

Furthermore, the integration of artificial intelligence in educational settings has opened new frontiers. Adaptive learning systems now tailor educational experiences to individual student needs, providing personalized feedback and adjusting difficulty levels accordingly. This shift represents a paradigm change from the one-size-fits-all approach that dominated classrooms for decades.`,
      questions: [
        {
          questionNumber: 1,
          questionText: 'According to the passage, technology has...',
          options: {
            A: 'Replaced traditional teaching methods',
            B: 'Transformed education worldwide',
            C: 'Eliminated the need for teachers',
            D: 'Reduced access to information',
          },
        },
        {
          questionNumber: 2,
          questionText: 'The word "fundamentally" in paragraph 1 means...',
          options: {
            A: 'Slightly',
            B: 'Temporarily',
            C: 'Basically / at a deep level',
            D: 'Rapidly',
          },
        },
        {
          questionNumber: 3,
          questionText: 'Adaptive learning systems mentioned in the passage are used to...',
          options: {
            A: 'Replace human teachers entirely',
            B: 'Standardize education across regions',
            C: 'Personalize learning experiences',
            D: 'Reduce educational costs',
          },
        },
        {
          questionNumber: 4,
          questionText: 'What does the passage say about AI in education?',
          options: {
            A: 'It is still being developed',
            B: 'It has opened new frontiers',
            C: 'It is too expensive to use',
            D: 'It is harmful to students',
          },
        },
      ],
    },
    {
      passageNumber: 2,
      passageType: 'Điền vào chỗ trống',
      title: 'Environmental Challenges',
      content: `Climate change remains one of the most pressing (1)___ of our time. Rising temperatures have led to more frequent extreme weather (2)___, threatening ecosystems and human settlements alike. Scientists warn that without immediate action, the (3)___ consequences could be irreversible, affecting future (4)___.`,
      questions: [
        {
          questionNumber: 5,
          questionText: '(1) ___',
          options: { A: 'opportunities', B: 'challenges', C: 'developments', D: 'achievements' },
        },
        {
          questionNumber: 6,
          questionText: '(2) ___',
          options: { A: 'forecasts', B: 'patterns', C: 'events', D: 'seasons' },
        },
        {
          questionNumber: 7,
          questionText: '(3) ___',
          options: { A: 'positive', B: 'minimal', C: 'long-term', D: 'short-term' },
        },
        {
          questionNumber: 8,
          questionText: '(4) ___',
          options: { A: 'generations', B: 'economies', C: 'scientists', D: 'policies' },
        },
      ],
    },
  ],
};

const TOTAL_TIME = 60 * 60; // 60 minutes in seconds

export default function ReadingDetailScreen({ route, navigation }) {
  const test = route.params?.test || MOCK_TEST;
  const allQuestions = (test.passages || MOCK_TEST.passages).flatMap(p => p.questions);
  const totalQ = allQuestions.length;

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [expandedPassage, setExpandedPassage] = useState(0);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleAnswer = (qNum, option) => {
    setAnswers(prev => ({ ...prev, [qNum]: option }));
  };

  const handleSubmit = (auto = false) => {
    if (!auto && answeredCount < totalQ) {
      Alert.alert(
        'Nộp bài?',
        `Bạn còn ${totalQ - answeredCount} câu chưa trả lời. Bạn có chắc muốn nộp bài?`,
        [
          { text: 'Tiếp tục làm', style: 'cancel' },
          { text: 'Nộp bài', style: 'destructive', onPress: () => doSubmit() },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = () => {
    clearInterval(timerRef.current);
    navigation.replace('ReadingResult', {
      testId: test._id,
      answers,
      test,
      passages: test.passages || MOCK_TEST.passages,
      timeTaken: TOTAL_TIME - timeLeft,
    });
  };

  const handleExit = () => {
    Alert.alert(
      'Thoát bài thi?',
      'Tiến trình làm bài sẽ bị mất. Bạn có chắc chắn muốn thoát?',
      [
        { text: 'Tiếp tục làm bài', style: 'cancel' },
        { text: 'Thoát', style: 'destructive', onPress: () => { clearInterval(timerRef.current); navigation.goBack(); } },
      ]
    );
  };

  const passages = test.passages || MOCK_TEST.passages;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{test.title || 'Đề Đọc Số 1'}</Text>
          <Text style={styles.headerSub}>{answeredCount}/{totalQ} câu đã trả lời</Text>
        </View>
        <View style={[styles.timerBadge, timeLeft < 300 && styles.timerBadgeWarning]}>
          <Ionicons name="time-outline" size={16} color={timeLeft < 300 ? '#fff' : '#2E7D32'} />
          <Text style={[styles.timerText, timeLeft < 300 && styles.timerTextWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {passages.map((passage, pIdx) => (
          <View key={pIdx} style={styles.passageSection}>
            {/* Passage Header */}
            <View style={styles.passageHeader}>
              <View style={styles.passageTag}>
                <Ionicons name="document-text" size={13} color="#2E7D32" />
                <Text style={styles.passageTagText}>Bài đọc {passage.passageNumber}/{passages.length}</Text>
              </View>
              <Text style={styles.passageType}>{passage.passageType}</Text>
            </View>

            {/* Passage Content */}
            <View style={styles.passageCard}>
              {passage.title && <Text style={styles.passageTitle}>{passage.title}</Text>}
              <Text style={styles.passageContent}>{passage.content}</Text>
              {pIdx === expandedPassage ? null : (
                <TouchableOpacity style={styles.expandBtn} onPress={() => setExpandedPassage(pIdx)}>
                  <Text style={styles.expandBtnText}>... tiếp theo ∨</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Questions for this passage */}
            <View style={styles.questionsHeader}>
              <Text style={styles.questionsTitle}>
                Câu hỏi ({passage.questions[0].questionNumber}–{passage.questions[passage.questions.length - 1].questionNumber})
              </Text>
              <Text style={styles.questionsAnswered}>
                {passage.questions.filter(q => answers[q.questionNumber]).length}/{passage.questions.length} đã trả lời
              </Text>
            </View>

            {passage.questions.map((q, qIdx) => (
              <View key={q.questionNumber} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumBadge}>
                    <Text style={styles.questionNumText}>{q.questionNumber}</Text>
                  </View>
                  <Text style={styles.questionText}>{q.questionText}</Text>
                </View>

                {Object.entries(q.options).map(([key, val]) => {
                  const isSelected = answers[q.questionNumber] === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => handleAnswer(q.questionNumber, key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                        {isSelected && <View style={styles.optionRadioDot} />}
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

        {/* Bottom padding for submit button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
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
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
    paddingTop: Platform.OS === 'android' ? 16 : 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  headerSub: { fontSize: 12, color: '#757575', marginTop: 2 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  timerBadgeWarning: { backgroundColor: '#FF5252' },
  timerText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  timerTextWarning: { color: '#fff' },

  scroll: { padding: 16 },

  passageSection: { marginBottom: 8 },
  passageHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  passageTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  passageTagText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  passageType: { fontSize: 13, color: '#757575', fontWeight: '500' },

  passageCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  passageTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  passageContent: { fontSize: 14, color: '#444', lineHeight: 22 },
  expandBtn: { marginTop: 8, alignSelf: 'flex-end' },
  expandBtnText: { fontSize: 13, color: '#757575', fontStyle: 'italic' },

  questionsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, paddingHorizontal: 2,
  },
  questionsTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  questionsAnswered: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  questionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  questionNumBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  questionNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  questionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E', lineHeight: 22 },

  option: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', marginBottom: 8, gap: 10,
  },
  optionSelected: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#B0BEC5',
    justifyContent: 'center', alignItems: 'center',
  },
  optionRadioSelected: { borderColor: '#2E7D32' },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  optionText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  optionTextSelected: { color: '#2E7D32', fontWeight: '700' },

  footer: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1, borderTopColor: '#F0F2F5',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 6,
    alignItems: 'center', gap: 8,
  },
  footerCount: { fontSize: 13, color: '#757575', fontWeight: '500' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2E7D32',
    borderRadius: 16, paddingVertical: 14, width: '100%', justifyContent: 'center',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
