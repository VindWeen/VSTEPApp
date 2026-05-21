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

export default function ListeningResultScreen({ route, navigation }) {
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
      navigation.getParent()?.navigate('Profile', { screen: 'History' });
      return;
    }

    navigation.navigate('ListeningList');
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Đang chấm điểm...</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kết quả</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={navigateAfterReview}
        >
          <Ionicons name="close" size={18} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreCard}>
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              <Text style={styles.circleScore}>{score.correct}/{score.total}</Text>
              <Text style={styles.circleLabel}>Điểm số</Text>
            </View>
            <View style={styles.starBadge}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
          </View>

          <Text style={styles.pctRow}>
            <Text style={styles.pctNum}>{pct}%</Text>
            {'  '}
            <Text style={styles.pctLabel}>{pctLabel}</Text>
          </Text>

          <View style={styles.starsRow}>
            {[0, 1, 2].map((i) => (
              <Ionicons
                key={i}
                name="star"
                size={22}
                color={i < stars ? '#F59E0B' : '#E0E0E0'}
              />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={styles.statIconBg}>
              <Ionicons name="checkmark-circle" size={22} color="#2E7D32" />
            </View>
            <Text style={styles.statNum}>{score.correct}</Text>
            <Text style={styles.statLabel}>Câu đúng</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRed]}>
            <View style={[styles.statIconBg, styles.statIconBgRed]}>
              <Ionicons name="close-circle" size={22} color="#D32F2F" />
            </View>
            <Text style={[styles.statNum, styles.statNumRed]}>{score.wrong}</Text>
            <Text style={styles.statLabel}>Câu sai</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGray]}>
            <View style={[styles.statIconBg, styles.statIconBgGray]}>
              <Ionicons name="time-outline" size={22} color="#455A64" />
            </View>
            <Text style={[styles.statNum, styles.statNumGray]}>
              {fromHistory ? '--:--' : '30:00'}
            </Text>
            <Text style={styles.statLabel}>Thời gian</Text>
          </View>
        </View>

        <Text style={styles.detailTitle}>Chi tiết đáp án</Text>

        {allQuestions.map((q) => {
          const userAns = selectedAnswers[q.questionNumber];
          const correctAns = correctAnswers[q.questionNumber]?.correct;
          const isCorrect = userAns === correctAns;

          return (
            <View
              key={q.questionNumber}
              style={[styles.answerRow, isCorrect ? styles.answerRowCorrect : styles.answerRowWrong]}
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
                  <Text style={styles.answerRowLabel}>Câu {q.questionNumber}</Text>
                  <Text
                    style={[
                      styles.answerText,
                      isCorrect ? styles.answerTextCorrect : styles.answerTextWrong,
                    ]}
                  >
                    Đáp án: {correctAns} {isCorrect ? '✓' : '✗'}
                  </Text>
                </View>
                {!isCorrect ? (
                  <Text style={styles.userAnsText}>Bạn chọn: {userAns || 'Không làm'}</Text>
                ) : null}
                {showExplanation ? (
                  <View style={styles.fullExplanationContainer}>
                    {q.questionText ? <Text style={styles.fullQuestionText}>{q.questionText}</Text> : null}
                    {q.options && correctAns ? (
                      <View style={styles.fullAnswerRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                        <Text style={styles.fullAnswerText}>{correctAns}. {q.options[correctAns]}</Text>
                      </View>
                    ) : null}
                    {correctAnswers[q.questionNumber]?.explanation ? (
                      <View style={styles.explanationBox}>
                        <Ionicons
                          name="bulb-outline"
                          size={16}
                          color="#F57C00"
                          style={{ marginTop: 2 }}
                        />
                        <Text style={styles.explanationText}>
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
            style={styles.actionBtnOutline}
            onPress={() => setShowExplanation(!showExplanation)}
          >
            <Ionicons name={showExplanation ? 'bulb' : 'bulb-outline'} size={18} color="#1565C0" />
            <Text style={styles.actionBtnOutlineText}>
              {showExplanation ? 'Ẩn giải thích' : 'Xem giải thích'}
            </Text>
          </TouchableOpacity>
          {!fromHistory && !fromFullMock ? (
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => navigation.navigate('ListeningDetail', { test: { _id: testId, ...detailData } })}
            >
              <Ionicons name="refresh-outline" size={18} color="#1A1A2E" />
              <Text style={[styles.actionBtnOutlineText, { color: '#1A1A2E' }]}>Làm lại</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.homeBtn}
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
