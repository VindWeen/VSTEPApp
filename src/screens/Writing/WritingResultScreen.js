import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const CRITERIA_MAP = {
  taskAchievement: 'Task Achievement',
  coherence: 'Coherence & Cohesion',
  lexical: 'Lexical Resource',
  grammar: 'Grammatical Range',
};

const BAND_COLOR = (b) => {
  if (b >= 4.5) return '#2196F3';
  if (b >= 3.5) return '#4CAF50';
  if (b >= 2.5) return '#FFC107';
  return '#EF5350';
};

function BandBar({ label, value }) {
  const pct = (value / 5) * 100;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: BAND_COLOR(value) }]} />
      </View>
      <Text style={[styles.barValue, { color: BAND_COLOR(value) }]}>{value}</Text>
    </View>
  );
}

export default function WritingResultScreen({ route, navigation }) {
  const { result, prompt, essay, level, taskType } = route.params;
  const { band, taskAchievement, coherence, lexical, grammar, strengths, improvements, suggestions } = result?.aiFeedback || result || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Viết lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả Writing</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Band Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.bandCircle, { borderColor: BAND_COLOR(band) }]}>
            <Text style={[styles.bandNum, { color: BAND_COLOR(band) }]}>{band}</Text>
            <Text style={styles.bandLabel}>BAND</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.taskTypeText}>{taskType} • {level}</Text>
            <Text style={styles.wordCountText}>
              {essay.trim().split(/\s+/).filter(Boolean).length} từ đã viết
            </Text>
          </View>
        </View>

        {/* Criteria Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Điểm theo tiêu chí</Text>
          <BandBar label="Task Achievement" value={taskAchievement} />
          <BandBar label="Coherence" value={coherence} />
          <BandBar label="Lexical" value={lexical} />
          <BandBar label="Grammar" value={grammar} />
        </View>

        {/* Strengths */}
        {strengths?.length > 0 && (
          <View style={[styles.card, styles.strengthCard]}>
            <Text style={styles.cardTitle}>✅ Điểm mạnh</Text>
            {strengths.map((s, i) => (
              <Text key={i} style={styles.listItem}>• {s}</Text>
            ))}
          </View>
        )}

        {/* Improvements */}
        {improvements?.length > 0 && (
          <View style={[styles.card, styles.improveCard]}>
            <Text style={styles.cardTitle}>⚠️ Cần cải thiện</Text>
            {improvements.map((s, i) => (
              <Text key={i} style={styles.listItem}>• {s}</Text>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {suggestions?.length > 0 && (
          <View style={[styles.card, styles.suggestCard]}>
            <Text style={styles.cardTitle}>💡 Gợi ý học tập</Text>
            {suggestions.map((s, i) => (
              <Text key={i} style={styles.listItem}>• {s}</Text>
            ))}
          </View>
        )}

        {/* Essay review */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 Bài viết đã nộp</Text>
          <Text style={styles.essayText}>{essay}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>✏️ Viết lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => navigation.navigate('Writing', { screen: 'WritingCompose' })}
          >
            <Text style={styles.newText}>📝 Đề mới</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#00695C', paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end',
  },
  backBtn: { width: 60 },
  backText: { color: '#B2DFDB', fontSize: 14 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '700' },
  scoreCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 24,
    flexDirection: 'row', alignItems: 'center', gap: 20, elevation: 4,
  },
  bandCircle: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  bandNum: { fontSize: 36, fontWeight: '900' },
  bandLabel: { fontSize: 10, color: '#888', fontWeight: '700', letterSpacing: 2 },
  scoreInfo: { flex: 1 },
  taskTypeText: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  wordCountText: { color: '#888', fontSize: 13, marginTop: 4 },
  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff',
    borderRadius: 16, padding: 16, elevation: 2,
  },
  strengthCard: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  improveCard: { borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  suggestCard: { borderLeftWidth: 4, borderLeftColor: '#2196F3' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  barLabel: { width: 110, fontSize: 12, color: '#666' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 28, textAlign: 'right', fontWeight: '700', fontSize: 14 },
  listItem: { color: '#555', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  essayText: { color: '#444', fontSize: 13, lineHeight: 22, fontStyle: 'italic' },
  actions: { flexDirection: 'row', margin: 16, gap: 12 },
  retryBtn: {
    flex: 1, backgroundColor: '#E8F5E9', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  retryText: { color: '#00695C', fontWeight: '700', fontSize: 15 },
  newBtn: {
    flex: 1, backgroundColor: '#00695C', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  newText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
