import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReadingAnswers, getReadingDetail, submitResult } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

function ScoreCircle({ correct, total }) {
  const { isDarkMode, theme } = useTheme();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const getLevel = () => {
    if (pct >= 90) return { label: 'Xuất sắc!', stars: 3 };
    if (pct >= 70) return { label: 'Tốt!', stars: 2 };
    if (pct >= 50) return { label: 'Khá!', stars: 1 };
    return { label: 'Cần cố gắng!', stars: 0 };
  };

  const { label, stars } = getLevel();

  return (
    <View style={styles.scoreCircleContainer}>
      <View style={styles.scoreCircleBg}>
        <View style={[styles.scoreCircle, { borderColor: isDarkMode ? '#81C784' : '#2E7D32', backgroundColor: theme.card }]}>
          <Text style={[styles.scoreCircleNum, { color: theme.text }]}>{correct}/{total}</Text>
          <Text style={[styles.scoreCircleLabel, { color: theme.textSecondary }]}>Điểm số</Text>
        </View>
        <View style={[styles.starBadge, { backgroundColor: isDarkMode ? '#334155' : '#FFF3E0' }]}>
          <Ionicons name="star" size={16} color="#F59E0B" />
        </View>
      </View>
      <Text style={styles.percentText}>
        <Text style={[styles.percentNum, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>{pct}%</Text>
        <Text style={[styles.percentLabel, { color: theme.text }]}> {label}</Text>
      </Text>
      <View style={styles.starsRow}>
        {[0, 1, 2].map((i) => (
          <Ionicons key={i} name="star" size={20} color={i < stars ? '#F59E0B' : (isDarkMode ? '#334155' : '#E0E0E0')} />
        ))}
      </View>
    </View>
  );
}

function StatCard({ icon, value, label, color }) {
  const { isDarkMode, theme } = useTheme();
  return (
    <View style={[
      styles.statCard,
      {
        backgroundColor: isDarkMode ? theme.card : `${color}15`,
        borderWidth: isDarkMode ? 1 : 0,
        borderColor: theme.border,
      }
    ]}>
      <View style={[styles.statIconBg, { backgroundColor: isDarkMode ? '#1E293B' : `${color}25` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({ label, correct, total, color }) {
  const { isDarkMode, theme } = useTheme();
  const pct = total > 0 ? (correct / total) * 100 : 0;
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <View style={[styles.progressDot, { backgroundColor: color }]} />
          <Text style={[styles.progressLabel, { color: theme.text }]}>{label}</Text>
        </View>
        <Text style={[styles.progressScore, { color }]}>{correct}/{total} đúng</Text>
      </View>
      <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#222' : '#F0F0F0' }]}>
        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.progressPct, { color: theme.textSecondary }]}>{Math.round(pct)}%</Text>
    </View>
  );
}

const formatTime = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function ReadingResultScreen({ route, navigation }) {
  const { isDarkMode, theme } = useTheme();
  const { testId, answers, test, passages = [], timeTaken, historyResult, fromHistory, fromFullMock } = route.params;
  const [correctMap, setCorrectMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [resolvedTest, setResolvedTest] = useState(test || null);
  const [resolvedPassages, setResolvedPassages] = useState(passages || []);

  const selectedAnswers = useMemo(() => {
    if (!fromHistory) return answers || {};

    return (historyResult?.answers || []).reduce((acc, item) => {
      acc[item.questionNumber] = item.userAnswer;
      return acc;
    }, {});
  }, [answers, fromHistory, historyResult]);

  useEffect(() => {
    const prepareResult = async () => {
      try {
        if (!passages.length) {
          const detailRes = await getReadingDetail(testId);
          const data = detailRes.data.data;
          setResolvedTest(data);
          setResolvedPassages(data.parts || data.passages || []);
        }

        const res = await getReadingAnswers(testId);
        const map = {};
        (res.data.data || []).forEach((item) => {
          map[item.questionNumber] = {
            correct: item.correctAnswer,
            explanation: item.explanation,
          };
        });
        setCorrectMap(map);

        if (!fromHistory && !fromFullMock) {
          await submitResult({
            testId,
            skill: 'reading',
            answers: Object.entries(selectedAnswers).map(([num, ans]) => ({
              questionNumber: Number(num),
              userAnswer: ans,
            })),
            duration: timeTaken || 0,
          });
        }
      } catch (error) {
        console.error('Lỗi load reading answers:', error.message);
      } finally {
        setLoading(false);
      }
    };

    prepareResult();
  }, [fromHistory, fromFullMock, passages.length, selectedAnswers, testId, timeTaken]);

  const navigateAfterReview = () => {
    if (fromFullMock) {
      navigation.goBack();
      return;
    }

    if (fromHistory) {
      navigation.popToTop();
      navigation.getParent()?.navigate('Profile', { screen: 'History' });
      return;
    }

    navigation.popToTop();
  };

  const allQuestions = resolvedPassages.flatMap((part) => part.questions || []);
  const total = allQuestions.length;
  const correct = allQuestions.reduce((sum, q) => {
    const expected = correctMap[q.questionNumber]?.correct;
    return sum + (selectedAnswers[q.questionNumber] === expected ? 1 : 0);
  }, 0);
  const wrong = total - correct;

  const passageBreakdowns = resolvedPassages.map((part, idx) => {
    const partCorrect = (part.questions || []).reduce((sum, q) => {
      const expected = correctMap[q.questionNumber]?.correct;
      return sum + (selectedAnswers[q.questionNumber] === expected ? 1 : 0);
    }, 0);

    return {
      label: part.partTitle || part.passageTitle || `Phần ${idx + 1}`,
      correct: partCorrect,
      total: (part.questions || []).length,
      color: ['#2E7D32', '#E65100', '#6A1B9A', '#1565C0'][idx % 4],
    };
  });

  const weakest = passageBreakdowns.reduce((weakestItem, current) => {
    if (!weakestItem) return current;
    const weakestPct = weakestItem.total > 0 ? weakestItem.correct / weakestItem.total : 1;
    const currentPct = current.total > 0 ? current.correct / current.total : 1;
    return currentPct < weakestPct ? current : weakestItem;
  }, null);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#81C784' : '#2E7D32'} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang chấm điểm...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? theme.background : '#F5F7FA'} />

      <View style={[styles.header, { backgroundColor: isDarkMode ? theme.background : '#F5F7FA' }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Kết quả Đọc</Text>
        <TouchableOpacity onPress={navigateAfterReview} style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.scoreCard, { backgroundColor: isDarkMode ? '#1E293B' : '#E8F5E9' }]}>
          <ScoreCircle correct={correct} total={total} />
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="checkmark-circle" value={correct} label="Đúng" color="#4CAF50" />
          <StatCard icon="close-circle" value={wrong} label="Sai" color="#FF5252" />
          <StatCard
            icon="time-outline"
            value={formatTime(fromHistory ? historyResult?.duration || 0 : timeTaken || 0)}
            label="Thời gian"
            color={isDarkMode ? '#90A4AE' : '#757575'}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Phân tích theo phần</Text>
          {passageBreakdowns.map((item, index) => (
            <ProgressBar key={index} {...item} />
          ))}
        </View>

        {weakest ? (
          <View style={[
            styles.tipCard,
            {
              backgroundColor: isDarkMode ? '#2D1B0F' : '#FFF3E0',
              borderColor: isDarkMode ? '#4D2A10' : '#FFE0B2',
            }
          ]}>
            <View style={[styles.tipIcon, { backgroundColor: isDarkMode ? '#4D2A10' : '#FFE0B2' }]}>
              <Ionicons name="bulb" size={18} color={isDarkMode ? '#FF9800' : '#E65100'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: isDarkMode ? '#FF9800' : '#E65100' }]}>Cần cải thiện</Text>
              <Text style={[styles.tipText, { color: isDarkMode ? '#FFE0B2' : '#5D4037' }]}>
                Phần <Text style={[styles.tipHighlight, { color: isDarkMode ? '#FF9800' : '#E65100' }]}>{weakest.label}</Text> đang là phần yếu nhất.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setShowExplanation(!showExplanation)}
          >
            <Ionicons name={showExplanation ? 'bulb' : 'bulb-outline'} size={18} color={isDarkMode ? '#81C784' : '#2E7D32'} />
            <Text style={[styles.actionBtnOutlineText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>
              {showExplanation ? 'Ẩn giải thích' : 'Xem giải thích'}
            </Text>
          </TouchableOpacity>
          {!fromHistory && !fromFullMock ? (
            <TouchableOpacity
              style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('ReadingDetail', { test: resolvedTest })}
            >
              <Ionicons name="refresh-outline" size={18} color={theme.text} />
              <Text style={[styles.actionBtnOutlineText, { color: theme.text }]}>Làm lại</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {showExplanation ? (
          <View style={styles.explanationSection}>
            <Text style={[styles.explanationSectionTitle, { color: theme.text }]}>Chi tiết đáp án</Text>
            {resolvedPassages.map((part, partIndex) => (
              <View key={partIndex} style={[styles.passageExplanationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.passageExplanationHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.passageExplanationTag, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>{part.partTitle || `Phần ${partIndex + 1}`}</Text>
                  <Text style={[styles.passageExplanationTitle, { color: theme.text }]}>{part.passageTitle || part.title || ''}</Text>
                </View>

                {(part.questions || []).map((q) => {
                  const userAns = selectedAnswers[q.questionNumber];
                  const correctData = correctMap[q.questionNumber];
                  const correctAns = correctData?.correct;
                  const isCorrect = userAns === correctAns;

                  return (
                    <View
                      key={q.questionNumber}
                      style={[
                        styles.answerRow,
                        isCorrect
                          ? (isDarkMode ? { backgroundColor: '#1B2E1C', borderColor: '#2E4C30' } : styles.answerRowCorrect)
                          : (isDarkMode ? { backgroundColor: '#2E1B1B', borderColor: '#4C2E2E' } : styles.answerRowWrong)
                      ]}
                    >
                      <View
                        style={[
                          styles.answerStatusIcon,
                          isCorrect ? styles.answerStatusIconCorrect : styles.answerStatusIconWrong,
                        ]}
                      >
                        <Ionicons name={isCorrect ? 'checkmark' : 'close'} size={14} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={[styles.answerRowLabel, { color: theme.text }]}>Câu {q.questionNumber}</Text>
                          <Text
                            style={[
                              styles.answerText,
                              isCorrect
                                ? [styles.answerTextCorrect, isDarkMode && { color: '#81C784' }]
                                : [styles.answerTextWrong, isDarkMode && { color: '#E57373' }],
                            ]}
                          >
                            Đáp án: {correctAns} {isCorrect ? '✓' : '✗'}
                          </Text>
                        </View>

                        {!isCorrect ? (
                          <Text style={[styles.userAnsText, isDarkMode && { color: '#E57373' }]}>Bạn chọn: {userAns || 'Không làm'}</Text>
                        ) : null}

                        <View style={[styles.fullExplanationContainer, { borderTopColor: theme.border }]}>
                          {q.questionText ? <Text style={[styles.fullQuestionText, { color: theme.text }]}>{q.questionText}</Text> : null}
                          {q.options && correctAns ? (
                            <View style={styles.fullAnswerRow}>
                              <Ionicons name="checkmark-circle" size={16} color={isDarkMode ? '#81C784' : '#2E7D32'} />
                              <Text style={[styles.fullAnswerText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>{correctAns}. {q.options[correctAns]}</Text>
                            </View>
                          ) : null}
                          {correctData?.explanation ? (
                            <View style={[styles.explanationBox, { backgroundColor: isDarkMode ? '#2A1F10' : '#FFF3E0' }]}>
                              <Ionicons name="bulb-outline" size={16} color={isDarkMode ? '#FFB74D' : '#F57C00'} style={{ marginTop: 2 }} />
                              <Text style={[styles.explanationText, { color: isDarkMode ? '#FFB74D' : '#E65100' }]}>{correctData.explanation}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={[styles.homeBtn, { backgroundColor: isDarkMode ? '#388E3C' : '#2E7D32' }]} onPress={navigateAfterReview}>
          <Ionicons name="home" size={18} color="#fff" />
          <Text style={styles.homeBtnText}>Về trang kỹ năng đọc</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 16, color: '#757575', fontSize: 16, fontWeight: '500' },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
    backgroundColor: '#F5F7FA',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { paddingBottom: 40 },
  scoreCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  scoreCircleContainer: { alignItems: 'center' },
  scoreCircleBg: { position: 'relative', marginBottom: 16 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: '#2E7D32',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleNum: { fontSize: 28, fontWeight: '900', color: '#1A1A2E' },
  scoreCircleLabel: { fontSize: 11, color: '#757575', fontWeight: '600', letterSpacing: 0.5 },
  starBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: { flexDirection: 'row', alignItems: 'baseline' },
  percentNum: { fontSize: 36, fontWeight: '900', color: '#2E7D32' },
  percentLabel: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#757575', fontWeight: '500' },
  section: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 16 },
  progressItem: { marginBottom: 18 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  progressScore: { fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontSize: 12, color: '#757575', fontWeight: '500' },
  tipCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 3 },
  tipText: { fontSize: 13, color: '#5D4037', lineHeight: 20 },
  tipHighlight: { fontWeight: '700', color: '#E65100' },
  actionsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 10 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 16,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  actionBtnOutlineText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  homeBtn: {
    marginHorizontal: 16,
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  homeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  explanationSection: { marginTop: 10, marginHorizontal: 16, marginBottom: 16 },
  explanationSectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  passageExplanationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  passageExplanationHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  passageExplanationTag: { fontSize: 12, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  passageExplanationTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  answerRowCorrect: { backgroundColor: '#F1F8E9', borderColor: '#C8E6C9' },
  answerRowWrong: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  answerStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  answerStatusIconCorrect: { backgroundColor: '#4CAF50' },
  answerStatusIconWrong: { backgroundColor: '#F44336' },
  answerRowLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  answerText: { fontSize: 13, fontWeight: '700' },
  answerTextCorrect: { color: '#2E7D32' },
  answerTextWrong: { color: '#D32F2F' },
  userAnsText: { fontSize: 13, color: '#D32F2F', marginTop: 4, fontWeight: '600' },
  fullExplanationContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
  fullQuestionText: { fontSize: 14, color: '#1A1A2E', fontWeight: '600', marginBottom: 6, lineHeight: 20 },
  fullAnswerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  fullAnswerText: { flex: 1, fontSize: 14, color: '#2E7D32', fontWeight: '500', lineHeight: 20 },
  explanationBox: {
    padding: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  explanationText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 20 },
});
