import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Correct answer map for mock data
const MOCK_CORRECT = {
  1: { correct: 'B', explanation: 'Thông tin nằm ở câu đầu tiên của bài đọc: "...fundamentally transformed the landscape...".' },
  2: { correct: 'C', explanation: 'Từ "fundamentally" đồng nghĩa với basically / at a deep level.' },
  3: { correct: 'C', explanation: 'Đoạn 2: "Adaptive learning systems now tailor educational experiences to individual student needs...".' },
  4: { correct: 'B', explanation: 'Đoạn 2: "...integration of artificial intelligence... has opened new frontiers."' },
  5: { correct: 'B', explanation: '"pressing challenges" = những thách thức cấp bách.' },
  6: { correct: 'C', explanation: '"extreme weather events" = các hiện tượng thời tiết cực đoan.' },
  7: { correct: 'C', explanation: '"long-term consequences" = hậu quả lâu dài/dài hạn.' },
  8: { correct: 'A', explanation: '"future generations" = các thế hệ tương lai.' },
};

const QUESTION_TYPES = {
  0: 'Trắc nghiệm (MCQ)',
  1: 'Điền vào chỗ trống',
  2: 'Ghép nối',
};

function ScoreCircle({ correct, total }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const getEmoji = () => {
    if (pct >= 90) return { label: 'Xuất sắc!', stars: 3 };
    if (pct >= 70) return { label: 'Tốt!', stars: 2 };
    if (pct >= 50) return { label: 'Khá!', stars: 1 };
    return { label: 'Cần cố gắng!', stars: 0 };
  };
  const { label, stars } = getEmoji();

  return (
    <View style={styles.scoreCircleContainer}>
      <View style={styles.scoreCircleBg}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreCircleNum}>{correct}/{total}</Text>
          <Text style={styles.scoreCircleLabel}>Điểm số</Text>
        </View>
        <View style={styles.starBadge}>
          <Ionicons name="star" size={16} color="#F59E0B" />
        </View>
      </View>
      <Text style={styles.percentText}>
        <Text style={styles.percentNum}>{pct}%</Text>
        <Text style={styles.percentLabel}> {label}</Text>
      </Text>
      <View style={styles.starsRow}>
        {[0, 1, 2].map(i => (
          <Ionicons key={i} name="star" size={20} color={i < stars ? '#F59E0B' : '#E0E0E0'} />
        ))}
      </View>
    </View>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color + '15' }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + '25' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressBar({ label, correct, total, color }) {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <View style={[styles.progressDot, { backgroundColor: color }]} />
          <Text style={styles.progressLabel}>{label}</Text>
        </View>
        <Text style={[styles.progressScore, { color }]}>{correct}/{total} đúng</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressPct}>{Math.round(pct)}%</Text>
    </View>
  );
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ReadingResultScreen({ route, navigation }) {
  const { testId, answers, test, passages, timeTaken } = route.params;

  // Calculate results
  const allQuestions = passages.flatMap(p => p.questions);
  const total = allQuestions.length;

  const [showExplanation, setShowExplanation] = useState(false);

  // Use mock correct answers or real ones
  const correctMap = MOCK_CORRECT;
  let correct = 0;
  allQuestions.forEach(q => {
    const correctAns = correctMap[q.questionNumber]?.correct || correctMap[q.questionNumber];
    if (answers[q.questionNumber] === correctAns) correct++;
  });
  const wrong = total - correct;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Per-passage breakdown (simulate types)
  const passageBreakdowns = passages.map((p, idx) => {
    let pCorrect = 0;
    p.questions.forEach(q => {
      const correctAns = correctMap[q.questionNumber]?.correct || correctMap[q.questionNumber];
      if (answers[q.questionNumber] === correctAns) pCorrect++;
    });
    const typeColors = ['#2E7D32', '#E65100', '#E53935'];
    const typeNames = ['Trắc nghiệm (MCQ)', 'Điền vào chỗ trống', 'Ghép nối'];
    return {
      label: typeNames[idx % 3],
      correct: pCorrect,
      total: p.questions.length,
      color: typeColors[idx % 3],
    };
  });

  // Find weak type
  const weakest = passageBreakdowns.reduce((w, p) => {
    const wPct = w.total > 0 ? w.correct / w.total : 1;
    const pPct = p.total > 0 ? p.correct / p.total : 1;
    return pPct < wPct ? p : w;
  }, passageBreakdowns[0]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kết quả Đọc</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ReadingList')} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Score */}
        <View style={styles.scoreCard}>
          <ScoreCircle correct={correct} total={total} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard icon="checkmark-circle" value={correct} label="Đúng" color="#4CAF50" />
          <StatCard icon="close-circle" value={wrong} label="Sai" color="#FF5252" />
          <StatCard icon="time-outline" value={formatTime(timeTaken || 0)} label="Thời gian" color="#757575" />
        </View>

        {/* Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân tích theo dạng câu</Text>
          {passageBreakdowns.map((p, i) => (
            <ProgressBar key={i} {...p} />
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb" size={18} color="#E65100" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Cần cải thiện</Text>
            <Text style={styles.tipText}>
              Dạng <Text style={styles.tipHighlight}>{weakest?.label}</Text> — luyện thêm để nâng điểm!
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => setShowExplanation(!showExplanation)}
          >
            <Ionicons name={showExplanation ? "bulb" : "bulb-outline"} size={18} color="#2E7D32" />
            <Text style={styles.actionBtnOutlineText}>
              {showExplanation ? "Ẩn giải thích" : "Xem giải thích"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => navigation.navigate('ReadingDetail', { test })}
          >
            <Ionicons name="refresh-outline" size={18} color="#1A1A2E" />
            <Text style={[styles.actionBtnOutlineText, { color: '#1A1A2E' }]}>Làm lại</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Explanations */}
        {showExplanation && (
          <View style={styles.explanationSection}>
            <Text style={styles.explanationSectionTitle}>Chi tiết đáp án</Text>
            {passages.map((p, pIdx) => (
              <View key={pIdx} style={styles.passageExplanationCard}>
                <View style={styles.passageExplanationHeader}>
                  <Text style={styles.passageExplanationTag}>Bài đọc {p.passageNumber}</Text>
                  <Text style={styles.passageExplanationTitle}>{p.title}</Text>
                </View>

                {p.questions.map(q => {
                  const userAns = answers[q.questionNumber];
                  const correctData = correctMap[q.questionNumber];
                  const correctAns = correctData?.correct || correctData;
                  const isCorrect = userAns === correctAns;

                  return (
                    <View key={q.questionNumber} style={[styles.answerRow, isCorrect ? styles.answerRowCorrect : styles.answerRowWrong]}>
                      <View style={[styles.answerStatusIcon, isCorrect ? styles.answerStatusIconCorrect : styles.answerStatusIconWrong]}>
                        <Ionicons name={isCorrect ? 'checkmark' : 'close'} size={14} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.answerRowLabel}>Câu {q.questionNumber}</Text>
                          <Text style={[styles.answerText, isCorrect ? styles.answerTextCorrect : styles.answerTextWrong]}>
                            Đáp án: {correctAns}  {isCorrect ? '✓' : '✗'}
                          </Text>
                        </View>
                        
                        {!isCorrect && (
                          <Text style={styles.userAnsText}>Bạn chọn: {userAns || 'Không làm'}</Text>
                        )}

                        <View style={styles.fullExplanationContainer}>
                          {q.questionText && (
                            <Text style={styles.fullQuestionText}>{q.questionText}</Text>
                          )}
                          {q.options && correctAns && (
                            <View style={styles.fullAnswerRow}>
                              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                              <Text style={styles.fullAnswerText}>{correctAns}. {q.options[correctAns]}</Text>
                            </View>
                          )}
                          {(correctData?.explanation || q.explanation) && (
                            <View style={styles.explanationBox}>
                              <Ionicons name="bulb-outline" size={16} color="#F57C00" style={{ marginTop: 2 }} />
                              <Text style={styles.explanationText}>
                                {correctData?.explanation || q.explanation}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('ReadingList')}
        >
          <Ionicons name="home" size={18} color="#fff" />
          <Text style={styles.homeBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
    backgroundColor: '#F5F7FA',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { paddingBottom: 40 },

  scoreCard: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#E8F5E9',
    borderRadius: 24, padding: 28, alignItems: 'center',
  },
  scoreCircleContainer: { alignItems: 'center' },
  scoreCircleBg: { position: 'relative', marginBottom: 16 },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 5, borderColor: '#2E7D32', backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  scoreCircleNum: { fontSize: 28, fontWeight: '900', color: '#1A1A2E' },
  scoreCircleLabel: { fontSize: 11, color: '#757575', fontWeight: '600', letterSpacing: 0.5 },
  starBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 4, elevation: 3,
  },
  percentText: { flexDirection: 'row', alignItems: 'baseline' },
  percentNum: { fontSize: 36, fontWeight: '900', color: '#2E7D32' },
  percentLabel: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 8 },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16,
  },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
  },
  statIconBg: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#757575', fontWeight: '500' },

  section: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: '#fff',
    borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
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
    marginHorizontal: 16, marginBottom: 14, backgroundColor: '#FFF3E0',
    borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  tipIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFE0B2',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 3 },
  tipText: { fontSize: 13, color: '#5D4037', lineHeight: 20 },
  tipHighlight: { fontWeight: '700', color: '#E65100' },

  actionsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 10 },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#DDD', borderRadius: 16, paddingVertical: 13,
    backgroundColor: '#fff',
  },
  actionBtnOutlineText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },

  homeBtn: {
    marginHorizontal: 16, backgroundColor: '#2E7D32', borderRadius: 16,
    paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25,
    shadowRadius: 8, elevation: 4,
  },
  homeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  explanationSection: { marginTop: 10, marginHorizontal: 16, marginBottom: 16 },
  explanationSectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  passageExplanationCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  passageExplanationHeader: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  passageExplanationTag: { fontSize: 12, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  passageExplanationTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },

  answerRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
    borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  answerRowCorrect: { backgroundColor: '#F1F8E9', borderColor: '#C8E6C9' },
  answerRowWrong: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  answerStatusIcon: {
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: -2,
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
    padding: 10, backgroundColor: '#FFF3E0', borderRadius: 10,
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
  },
  explanationText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 20 },
});
