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
import { getListeningAnswers, getListeningDetail, submitResult } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function ListeningResultScreen({ route, navigation }) {
  const { isDarkMode, theme } = useTheme();
  const { testId, answers, detail, historyResult, fromHistory, fromFullMock } = route.params;
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({ correct: 0, wrong: 0, total: 0 });
  const [showExplanation, setShowExplanation] = useState(false);
  const [detailData, setDetailData] = useState(detail || null);

  const selectedAnswers = useMemo(() => {
    if (!fromHistory) return answers || {};

    return (historyResult?.answers || []).reduce((acc, item) => {
      acc[item.questionNumber] = item.userAnswer;
      return acc;
    }, {});
  }, [answers, fromHistory, historyResult]);

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

  useEffect(() => {
    const fetchAndScore = async () => {
      try {
        if (!detail?.parts?.length) {
          const detailRes = await getListeningDetail(testId);
          setDetailData(detailRes.data.data);
        }

        const res = await getListeningAnswers(testId);
        const answersList = res.data.data || [];
        const answerMap = {};

        answersList.forEach((item) => {
          answerMap[item.questionNumber] = {
            correct: item.correctAnswer,
            explanation: item.explanation,
          };
        });

        let correct = 0;
        let total = 0;
        Object.entries(answerMap).forEach(([num, item]) => {
          total += 1;
          if (selectedAnswers[Number(num)] === item.correct) correct += 1;
        });

        setCorrectAnswers(answerMap);
        setScore({ correct, wrong: total - correct, total });

        if (!fromHistory && !fromFullMock) {
          await submitResult({
            testId,
            skill: 'listening',
            answers: Object.entries(selectedAnswers).map(([num, ans]) => ({
              questionNumber: Number(num),
              userAnswer: ans,
            })),
            duration: 0,
          });
        }
      } catch (e) {
        console.error('Lỗi fetch answers:', e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAndScore();
  }, [fromHistory, fromFullMock, selectedAnswers, testId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#60A5FA' : '#1565C0'} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang chấm điểm...</Text>
      </View>
    );
  }

  const allQuestions = (detailData?.parts || []).flatMap((part) => part.questions || []);
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const getLabel = () => {
    if (pct >= 90) return { text: 'Xuất sắc!', stars: 3 };
    if (pct >= 70) return { text: 'Tốt!', stars: 2 };
    if (pct >= 50) return { text: 'Khá!', stars: 1 };
    return { text: 'Cần cố gắng!', stars: 0 };
  };

  const { text: pctLabel, stars } = getLabel();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? theme.background : '#F5F7FA'} />

      <View style={[styles.header, { backgroundColor: isDarkMode ? theme.background : '#F5F7FA' }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Kết quả</Text>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]}
          onPress={navigateAfterReview}
        >
          <Ionicons name="close" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.scoreCard, { backgroundColor: isDarkMode ? '#1E293B' : '#DBEAFE' }]}>
          <View style={styles.circleOuter}>
            <View style={[styles.circleInner, { borderColor: isDarkMode ? '#60A5FA' : '#1565C0', backgroundColor: theme.card }]}>
              <Text style={[styles.circleScore, { color: theme.text }]}>{score.correct}/{score.total}</Text>
              <Text style={[styles.circleLabel, { color: theme.textSecondary }]}>Điểm số</Text>
            </View>
            <View style={[styles.starBadge, { backgroundColor: isDarkMode ? '#334155' : '#FFF3E0' }]}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
          </View>

          <Text style={styles.pctRow}>
            <Text style={[styles.pctNum, { color: isDarkMode ? '#60A5FA' : '#1565C0' }]}>{pct}%</Text>
            {'  '}
            <Text style={[styles.pctLabel, { color: theme.text }]}>{pctLabel}</Text>
          </Text>

          <View style={styles.starsRow}>
            {[0, 1, 2].map((i) => (
              <Ionicons
                key={i}
                name="star"
                size={22}
                color={i < stars ? '#F59E0B' : (isDarkMode ? '#334155' : '#E0E0E0')}
              />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, isDarkMode ? { backgroundColor: '#142F19' } : styles.statCardGreen]}>
            <View style={[styles.statIconBg, isDarkMode && { backgroundColor: '#064E3B' }]}>
              <Ionicons name="checkmark-circle" size={22} color={isDarkMode ? '#81C784' : '#2E7D32'} />
            </View>
            <Text style={[styles.statNum, isDarkMode && { color: '#81C784' }]}>{score.correct}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Câu đúng</Text>
          </View>
          <View style={[styles.statCard, isDarkMode ? { backgroundColor: '#3B1A1A' } : styles.statCardRed]}>
            <View style={[styles.statIconBg, isDarkMode ? { backgroundColor: '#7F1D1D' } : styles.statIconBgRed]}>
              <Ionicons name="close-circle" size={22} color={isDarkMode ? '#E57373' : '#D32F2F'} />
            </View>
            <Text style={[styles.statNum, isDarkMode ? { color: '#E57373' } : styles.statNumRed]}>{score.wrong}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Câu sai</Text>
          </View>
          <View style={[styles.statCard, isDarkMode ? { backgroundColor: '#2D3748' } : styles.statCardGray]}>
            <View style={[styles.statIconBg, isDarkMode ? { backgroundColor: '#1A202C' } : styles.statIconBgGray]}>
              <Ionicons name="time-outline" size={22} color={isDarkMode ? '#90A4AE' : '#455A64'} />
            </View>
            <Text style={[styles.statNum, isDarkMode ? { color: '#90A4AE' } : styles.statNumGray]}>
              {fromHistory ? '--:--' : '30:00'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Thời gian</Text>
          </View>
        </View>

        <Text style={[styles.detailTitle, { color: theme.text }]}>Chi tiết đáp án</Text>

        {allQuestions.map((q) => {
          const userAns = selectedAnswers[q.questionNumber];
          const correctAns = correctAnswers[q.questionNumber]?.correct;
          const isCorrect = userAns === correctAns;

          return (
            <View
              key={q.questionNumber}
              style={[
                styles.answerRow,
                isCorrect
                  ? (isDarkMode ? { backgroundColor: '#1B2E1C' } : styles.answerRowCorrect)
                  : (isDarkMode ? { backgroundColor: '#2E1B1B' } : styles.answerRowWrong)
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
                {showExplanation ? (
                  <View style={[styles.fullExplanationContainer, { borderTopColor: theme.border }]}>
                    {q.questionText ? <Text style={[styles.fullQuestionText, { color: theme.text }]}>{q.questionText}</Text> : null}
                    {q.options && correctAns ? (
                      <View style={styles.fullAnswerRow}>
                        <Ionicons name="checkmark-circle" size={16} color={isDarkMode ? '#81C784' : '#2E7D32'} />
                        <Text style={[styles.fullAnswerText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>{correctAns}. {q.options[correctAns]}</Text>
                      </View>
                    ) : null}
                    {correctAnswers[q.questionNumber]?.explanation ? (
                      <View style={[styles.explanationBox, { backgroundColor: isDarkMode ? '#2A1F10' : '#FFF3E0' }]}>
                        <Ionicons
                          name="bulb-outline"
                          size={16}
                          color={isDarkMode ? '#FFB74D' : '#F57C00'}
                          style={{ marginTop: 2 }}
                        />
                        <Text style={[styles.explanationText, { color: isDarkMode ? '#FFB74D' : '#E65100' }]}>
                          {correctAnswers[q.questionNumber].explanation}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setShowExplanation(!showExplanation)}
          >
            <Ionicons name={showExplanation ? 'bulb' : 'bulb-outline'} size={18} color={isDarkMode ? '#60A5FA' : '#1565C0'} />
            <Text style={[styles.actionBtnOutlineText, { color: isDarkMode ? '#60A5FA' : '#1565C0' }]}>
              {showExplanation ? 'Ẩn giải thích' : 'Xem giải thích'}
            </Text>
          </TouchableOpacity>
          {!fromHistory && !fromFullMock ? (
            <TouchableOpacity
              style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('ListeningDetail', { test: { _id: testId, ...detailData } })}
            >
              <Ionicons name="refresh-outline" size={18} color={theme.text} />
              <Text style={[styles.actionBtnOutlineText, { color: theme.text }]}>Làm lại</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: isDarkMode ? '#2563EB' : '#1565C0' }]}
          onPress={navigateAfterReview}
          activeOpacity={0.85}
        >
          <Ionicons name="home" size={18} color="#fff" />
          <Text style={styles.homeBtnText}>Về trang kỹ năng nghe</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
    backgroundColor: '#F5F7FA',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
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
    backgroundColor: '#DBEAFE',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  circleOuter: { position: 'relative', marginBottom: 14 },
  circleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: '#1565C0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleScore: { fontSize: 28, fontWeight: '900', color: '#1A1A2E' },
  circleLabel: { fontSize: 11, color: '#757575', fontWeight: '600', letterSpacing: 0.5 },
  starBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pctRow: { fontSize: 16, marginBottom: 10 },
  pctNum: { fontSize: 36, fontWeight: '900', color: '#1565C0' },
  pctLabel: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  starsRow: { flexDirection: 'row', gap: 6 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
  statCardGreen: { backgroundColor: '#E8F5E9' },
  statCardRed: { backgroundColor: '#FFEBEE' },
  statCardGray: { backgroundColor: '#ECEFF1' },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIconBgRed: { backgroundColor: '#FFCDD2' },
  statIconBgGray: { backgroundColor: '#CFD8DC' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },
  statNumRed: { color: '#D32F2F' },
  statNumGray: { color: '#455A64' },
  statLabel: { fontSize: 12, color: '#757575', fontWeight: '500' },
  detailTitle: { marginHorizontal: 16, marginBottom: 12, fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  answerRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  answerRowCorrect: { backgroundColor: '#E8F5E9' },
  answerRowWrong: { backgroundColor: '#FFEBEE' },
  answerStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  answerStatusIconCorrect: { backgroundColor: '#4CAF50' },
  answerStatusIconWrong: { backgroundColor: '#F44336' },
  answerRowLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  answerText: { fontSize: 13, fontWeight: '700' },
  answerTextCorrect: { color: '#2E7D32' },
  answerTextWrong: { color: '#D32F2F' },
  userAnsText: { fontSize: 13, color: '#D32F2F', marginTop: 4, fontWeight: '500' },
  fullExplanationContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
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
  actionsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginTop: 20, marginBottom: 10 },
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
  actionBtnOutlineText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },
  homeBtn: {
    marginHorizontal: 16,
    backgroundColor: '#1565C0',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  homeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
