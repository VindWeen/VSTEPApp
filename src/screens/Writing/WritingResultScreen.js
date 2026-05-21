import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

function ScoreSegments({ value, max = 5, color = '#E65100' }) {
  const { theme, isDarkMode } = useTheme();
  const segments = 10;
  const filled = Math.round((value / max) * segments);
  return (
    <View style={styles.segRow}>
      {Array.from({ length: segments }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.seg,
            i < filled
              ? { backgroundColor: color }
              : { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' },
          ]}
        />
      ))}
    </View>
  );
}

function CriteriaCard({ label, value }) {
  const { theme, isDarkMode } = useTheme();
  const color = isDarkMode
    ? (value >= 4.5 ? '#64B5F6' : value >= 3.5 ? '#81C784' : value >= 2.5 ? '#FFB74D' : '#E57373')
    : (value >= 4.5 ? '#1565C0' : value >= 3.5 ? '#2E7D32' : value >= 2.5 ? '#E65100' : '#D32F2F');
  return (
    <View style={[styles.criteriaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.criteriaLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.criteriaValue, { color }]}>{value?.toFixed(1) ?? '-'}</Text>
      <ScoreSegments value={value || 0} color={color} />
    </View>
  );
}

const normalizeSentence = (text = '') => {
  const cleaned = String(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/^[•\-\s]+/, '')
    .trim();

  if (!cleaned) return '';
  const firstUpper = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(firstUpper) ? firstUpper : `${firstUpper}.`;
};

const normalizeList = (items = []) =>
  items
    .map((item) => normalizeSentence(item))
    .filter(Boolean);

function FeedbackList({ title, items, icon, tone = 'default' }) {
  const { theme, isDarkMode } = useTheme();
  const normalizedItems = useMemo(() => normalizeList(items), [items]);

  if (!normalizedItems.length) return null;

  const iconColor = tone === 'positive'
    ? (isDarkMode ? '#81C784' : '#2E7D32')
    : tone === 'warning'
    ? (isDarkMode ? '#FFB74D' : '#EF6C00')
    : (isDarkMode ? '#FF9800' : '#E65100');

  return (
    <View style={styles.feedbackGroup}>
      <View style={styles.feedbackGroupHeader}>
        <Ionicons
          name={icon}
          size={16}
          color={iconColor}
        />
        <Text style={[styles.feedbackGroupTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {normalizedItems.map((item, index) => (
        <View key={`${title}-${index}`} style={styles.bulletRow}>
          <Text style={[styles.bulletMark, { color: isDarkMode ? '#FF9800' : '#E65100' }]}>•</Text>
          <Text style={[styles.bulletText, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function TaskCriteriaRow({ label, value }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.taskCriteriaRow, { borderTopColor: theme.border }]}>
      <Text style={[styles.taskCriteriaLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.taskCriteriaValue, { color: theme.text }]}>{typeof value === 'number' ? value.toFixed(1) : '-'}</Text>
    </View>
  );
}

export default function WritingResultScreen({ route, navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { result, test, draftResponses = [], fromHistory, fromFullMock } = route.params;
  const [expandedTaskKey, setExpandedTaskKey] = useState(null);

  const feedback = result?.aiFeedback || result || {};
  const taskResults = (result?.taskResults || result?.taskResponses || []).map((task, index) => ({
    ...task,
    prompt: task.prompt || draftResponses[index]?.prompt || '',
    essay: task.essay || draftResponses[index]?.essay || '',
  }));

  const {
    band,
    taskAchievement,
    coherence,
    lexical,
    grammar,
    strengths,
    improvements,
    suggestions,
  } = feedback;

  const totalWordCount =
    result?.totalWordCount ||
    taskResults.reduce((sum, task) => sum + (task.wordCount || 0), 0);

  const toggleTask = (key) => {
    setExpandedTaskKey((current) => (current === key ? null : key));
  };

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

  const orangeAccent = isDarkMode ? '#FF9800' : '#E65100';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.card} />

      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F5F5F5' }]} onPress={navigateAfterReview}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Kết quả bài Writing</Text>
        <View style={styles.shareBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.scoreSection, { backgroundColor: theme.card, marginBottom: 16 }]}>
          <View style={[styles.bandCircle, { borderColor: orangeAccent, backgroundColor: isDarkMode ? '#2C1B12' : '#FFF8F5' }]}>
            <Text style={[styles.bandNum, { color: orangeAccent }]}>{band?.toFixed(1) ?? '-'}</Text>
            <Text style={[styles.bandLabel, { color: theme.textSecondary }]}>BAND SCORE</Text>
          </View>
          <Text style={[styles.wordCountText, { color: theme.textSecondary }]}>
            {test?.title || result?.testTitle || 'Writing Test'} • {totalWordCount} từ
          </Text>
        </View>

        {!!taskResults.length && (
          <View style={[styles.taskSummaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.taskSummaryTitle, { color: theme.text }]}>Tổng hợp theo task</Text>
            <Text style={[styles.taskSummarySubtitle, { color: theme.textSecondary }]}>
              Mở từng task để xem lại bài viết và điểm chi tiết.
            </Text>

            {taskResults.map((task, index) => {
              const taskKey = `${task.taskType}-${index}`;
              const expanded = expandedTaskKey === taskKey;
              const taskFeedback = task.aiFeedback || {};

              return (
                <View key={taskKey} style={[styles.taskItem, { borderTopColor: theme.border }]}>
                  <TouchableOpacity style={styles.taskSummaryRow} onPress={() => toggleTask(taskKey)}>
                    <View style={styles.taskSummaryLeft}>
                      <Text style={[styles.taskSummaryName, { color: theme.text }]}>{task.title || task.taskType}</Text>
                      <Text style={[styles.taskSummaryMeta, { color: theme.textSecondary }]}>{task.wordCount || 0} từ</Text>
                    </View>
                    <View style={styles.taskSummaryRight}>
                      <Text style={[styles.taskSummaryBand, { color: orangeAccent }]}>
                        Band {taskFeedback.band?.toFixed(1) ?? '-'}
                      </Text>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={orangeAccent}
                      />
                    </View>
                  </TouchableOpacity>

                  {expanded ? (
                    <View style={styles.taskDetail}>
                      {task.prompt ? (
                        <View style={[styles.detailBlock, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA' }]}>
                          <Text style={[styles.detailLabel, { color: orangeAccent }]}>Đề bài</Text>
                          <Text style={[styles.detailText, { color: theme.text }]}>{task.prompt}</Text>
                        </View>
                      ) : null}

                      <View style={[styles.detailBlock, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA' }]}>
                        <Text style={[styles.detailLabel, { color: orangeAccent }]}>Bài viết của bạn</Text>
                        <Text style={[styles.essayText, { color: theme.text }]}>{task.essay || 'Chưa có nội dung.'}</Text>
                      </View>

                      <View style={[styles.taskCriteriaCard, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA' }]}>
                        <Text style={[styles.detailLabel, { color: orangeAccent }]}>Điểm từng tiêu chí</Text>
                        <TaskCriteriaRow
                          label="Task Achievement"
                          value={taskFeedback.taskAchievement}
                        />
                        <TaskCriteriaRow label="Coherence" value={taskFeedback.coherence} />
                        <TaskCriteriaRow label="Lexical" value={taskFeedback.lexical} />
                        <TaskCriteriaRow label="Grammar" value={taskFeedback.grammar} />
                      </View>

                      <FeedbackList
                        title="Ưu điểm của task này"
                        items={taskFeedback.strengths}
                        icon="checkmark-circle"
                        tone="positive"
                      />
                      <FeedbackList
                        title="Điểm cần cải thiện"
                        items={taskFeedback.improvements}
                        icon="alert-circle"
                        tone="warning"
                      />
                      <FeedbackList
                        title="Gợi ý luyện thêm"
                        items={taskFeedback.suggestions}
                        icon="bulb"
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.criteriaGrid}>
          <CriteriaCard label="TASK ACHIEV." value={taskAchievement || 0} />
          <CriteriaCard label="COHERENCE" value={coherence || 0} />
          <CriteriaCard label="LEXICAL" value={lexical || 0} />
          <CriteriaCard label="GRAMMAR" value={grammar || 0} />
        </View>

        <View style={[styles.feedbackCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.feedbackTitle, { color: theme.text }]}>Đánh giá tổng quan</Text>
          <FeedbackList
            title="Ưu điểm"
            items={strengths}
            icon="checkmark-circle"
            tone="positive"
          />
          <FeedbackList
            title="Cần cải thiện"
            items={improvements}
            icon="alert-circle"
            tone="warning"
          />
          <FeedbackList
            title="Gợi ý tiếp theo"
            items={suggestions}
            icon="bulb"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: orangeAccent }]}
          onPress={navigateAfterReview}
        >
          <Text style={styles.primaryBtnText}>Về trang kỹ năng viết</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  shareBtn: { width: 36, height: 36 },
  scroll: { paddingBottom: 40 },
  scoreSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', marginBottom: 16 },
  bandCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: '#E65100',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
  },
  bandNum: { fontSize: 42, fontWeight: '900', color: '#E65100' },
  bandLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '700', letterSpacing: 1 },
  wordCountText: { marginTop: 12, color: '#757575', fontWeight: '600' },
  taskSummaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  taskSummaryTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  taskSummarySubtitle: { marginTop: 4, marginBottom: 8, fontSize: 12, color: '#757575' },
  taskItem: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  taskSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  taskSummaryLeft: { flex: 1 },
  taskSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskSummaryName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  taskSummaryMeta: { fontSize: 12, color: '#757575', marginTop: 2 },
  taskSummaryBand: { fontSize: 14, fontWeight: '700', color: '#E65100' },
  taskDetail: {
    paddingBottom: 14,
    gap: 12,
  },
  detailBlock: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E65100',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailText: { fontSize: 14, color: '#444', lineHeight: 21 },
  essayText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 24,
  },
  taskCriteriaCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
  },
  taskCriteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  taskCriteriaLabel: { fontSize: 13, color: '#555' },
  taskCriteriaValue: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  criteriaCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  criteriaLabel: { fontSize: 10, fontWeight: '800', color: '#9E9E9E', letterSpacing: 0.8, marginBottom: 4 },
  criteriaValue: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  segRow: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  segFilled: {},
  segEmpty: { backgroundColor: '#F0F0F0' },
  feedbackCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  feedbackTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  feedbackGroup: {
    marginBottom: 12,
  },
  feedbackGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  feedbackGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  bulletMark: {
    fontSize: 16,
    lineHeight: 22,
    color: '#E65100',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  primaryBtn: {
    marginHorizontal: 16,
    backgroundColor: '#E65100',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
