import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { getListeningAnswers, submitResult } from '../../services/api';

const BAND_LABELS = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1' };

export default function ListeningResultScreen({ route, navigation }) {
  const { testId, answers, detail } = route.params;
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, band: 0 });

  useEffect(() => {
    fetchAndScore();
  }, []);

  const fetchAndScore = async () => {
    try {
      const res = await getListeningAnswers(testId);
      // Backend trả về flat array: [{ questionNumber, correctAnswer, explanation }]
      const answersList = res.data.data;

      const answerMap = {};
      answersList.forEach((item) => {
        answerMap[item.questionNumber] = {
          correct: item.correctAnswer,
          explanation: item.explanation,
        };
      });

      // Đếm đúng/sai từ answers user đã chọn
      let correct = 0;
      let total = 0;
      Object.entries(answerMap).forEach(([num, item]) => {
        total++;
        if (answers[Number(num)] === item.correct) correct++;
      });

      setCorrectAnswers(answerMap);
      const band = calculateBand(correct, total);
      setScore({ correct, total, band });

      // Submit result - đúng field names theo backend controller
      await submitResult({
        testId,                    // backend dùng testId
        skill: 'listening',
        answers: Object.entries(answers).map(([num, ans]) => ({
          questionNumber: Number(num),
          userAnswer: ans,         // backend dùng userAnswer
        })),
        duration: 0,
      });
      setSubmitted(true);
    } catch (e) {
      console.error('Lỗi fetch answers:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateBand = (correct, total) => {
    const pct = correct / total;
    if (pct >= 0.85) return 5;
    if (pct >= 0.70) return 4;
    if (pct >= 0.55) return 3;
    if (pct >= 0.35) return 2;
    return 1;
  };

  const getBandColor = (band) => {
    const colors = { 1: '#EF5350', 2: '#FF9800', 3: '#FFC107', 4: '#66BB6A', 5: '#2196F3' };
    return colors[band] || '#888';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang chấm điểm...</Text>
      </View>
    );
  }

  // Gộp tất cả câu hỏi kèm options từ detail (đã load sẵn khi làm bài)
  const allQuestions = detail.parts.flatMap((p) => p.questions);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.congratsText}>🎯 Kết quả bài thi</Text>
        <View style={[styles.bandCircle, { borderColor: getBandColor(score.band) }]}>
          <Text style={[styles.bandNumber, { color: getBandColor(score.band) }]}>
            {score.band}
          </Text>
          <Text style={styles.bandLabel}>BAND</Text>
        </View>
        <Text style={styles.levelText}>
          Tương đương: {BAND_LABELS[score.band] || '—'}
        </Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{score.correct}</Text>
            <Text style={styles.scoreBoxLabel}>Đúng</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{score.total - score.correct}</Text>
            <Text style={styles.scoreBoxLabel}>Sai</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{score.total}</Text>
            <Text style={styles.scoreBoxLabel}>Tổng</Text>
          </View>
        </View>
      </View>

      {/* Detailed Review */}
      <Text style={styles.reviewTitle}>📋 Xem đáp án chi tiết</Text>
      {allQuestions.map((q) => {
        const userAns = answers[q.questionNumber];
        const correctAns = correctAnswers[q.questionNumber]?.correct;
        const isCorrect = userAns === correctAns;
        return (
          <View key={q.questionNumber} style={[styles.qCard, isCorrect ? styles.qCorrect : styles.qWrong]}>
            <View style={styles.qCardHeader}>
              <Text style={styles.qNum}>Câu {q.questionNumber}</Text>
              <Text style={isCorrect ? styles.correctIcon : styles.wrongIcon}>
                {isCorrect ? '✅ Đúng' : '❌ Sai'}
              </Text>
            </View>
            <Text style={styles.qText}>{q.questionText}</Text>
            {!isCorrect && userAns && (
              <Text style={styles.userAnsText}>Bạn chọn: {userAns}. {q.options?.[userAns]}</Text>
            )}
            <Text style={styles.correctAnsText}>
              Đáp án: {correctAns}. {q.options?.[correctAns]}
            </Text>
            {correctAnswers[q.questionNumber]?.explanation && (
              <Text style={styles.explanText}>
                💡 {correctAnswers[q.questionNumber].explanation}
              </Text>
            )}
          </View>
        );
      })}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.navigate('ListeningDetail', { test: detail })}
        >
          <Text style={styles.retryBtnText}>🔁 Làm lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('ListeningList')}
        >
          <Text style={styles.homeBtnText}>📚 Đề khác</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15 },
  scoreCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 24,
    alignItems: 'center', elevation: 4,
  },
  congratsText: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  bandCircle: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  bandNumber: { fontSize: 40, fontWeight: '900' },
  bandLabel: { fontSize: 11, color: '#888', fontWeight: '700', letterSpacing: 2 },
  levelText: { color: '#555', fontSize: 14, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  scoreBox: { flex: 1, alignItems: 'center' },
  scoreNum: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  scoreBoxLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  scoreDivider: { width: 1, height: 40, backgroundColor: '#EEE' },
  reviewTitle: { marginHorizontal: 16, marginBottom: 10, fontSize: 16, fontWeight: '700', color: '#333' },
  qCard: { marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  qCorrect: { backgroundColor: '#F1F8E9', borderLeftColor: '#66BB6A' },
  qWrong: { backgroundColor: '#FFF8F8', borderLeftColor: '#EF5350' },
  qCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  qNum: { fontSize: 12, fontWeight: '700', color: '#888' },
  correctIcon: { color: '#43A047', fontWeight: '700', fontSize: 12 },
  wrongIcon: { color: '#E53935', fontWeight: '700', fontSize: 12 },
  qText: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 8, lineHeight: 20 },
  userAnsText: { color: '#E53935', fontSize: 13, marginBottom: 4 },
  correctAnsText: { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  explanText: { color: '#555', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  actions: { flexDirection: 'row', margin: 16, gap: 12 },
  retryBtn: {
    flex: 1, backgroundColor: '#E3F2FD', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  retryBtnText: { color: '#2196F3', fontWeight: '700', fontSize: 15 },
  homeBtn: {
    flex: 1, backgroundColor: '#2196F3', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
