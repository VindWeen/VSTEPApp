import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const BAND_COLOR = (b) => {
  if (b >= 4.5) return '#2196F3';
  if (b >= 3.5) return '#4CAF50';
  if (b >= 2.5) return '#FFC107';
  return '#EF5350';
};

function BandBar({ label, value }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${(value / 5) * 100}%`, backgroundColor: BAND_COLOR(value) }]} />
      </View>
      <Text style={[styles.barValue, { color: BAND_COLOR(value) }]}>{value}</Text>
    </View>
  );
}

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function SpeakingResultScreen({ route, navigation }) {
  const { result, transcript, topic, level, duration } = route.params;
  const feedback = result?.aiFeedback || result || {};
  const { band, fluency, lexical, grammar, pronunciation, strengths, improvements, suggestions } = feedback;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Nói lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả Speaking</Text>
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
            <Text style={styles.levelText}>{level} • {formatTime(duration || 0)}</Text>
            <Text style={styles.topicPreview} numberOfLines={2}>{topic}</Text>
          </View>
        </View>

        {/* Criteria */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Điểm theo tiêu chí</Text>
          <BandBar label="Fluency" value={fluency} />
          <BandBar label="Lexical" value={lexical} />
          <BandBar label="Grammar" value={grammar} />
          <BandBar label="Pronunciation" value={pronunciation} />
        </View>

        {/* Transcript */}
        {transcript && (
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#6A1B9A' }]}>
            <Text style={styles.cardTitle}>📝 Nội dung bài nói (AI chuyển ngữ)</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        {/* Strengths */}
        {strengths?.length > 0 && (
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#4CAF50' }]}>
            <Text style={styles.cardTitle}>✅ Điểm mạnh</Text>
            {strengths.map((s, i) => <Text key={i} style={styles.listItem}>• {s}</Text>)}
          </View>
        )}

        {/* Improvements */}
        {improvements?.length > 0 && (
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#FF9800' }]}>
            <Text style={styles.cardTitle}>⚠️ Cần cải thiện</Text>
            {improvements.map((s, i) => <Text key={i} style={styles.listItem}>• {s}</Text>)}
          </View>
        )}

        {/* Suggestions */}
        {suggestions?.length > 0 && (
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#2196F3' }]}>
            <Text style={styles.cardTitle}>💡 Gợi ý học tập</Text>
            {suggestions.map((s, i) => <Text key={i} style={styles.listItem}>• {s}</Text>)}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>🎙 Nói lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Speaking')}>
            <Text style={styles.homeText}>📚 Chủ đề mới</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#6A1B9A', paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end',
  },
  backBtn: { width: 60 },
  backText: { color: '#CE93D8', fontSize: 14 },
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
  levelText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  topicPreview: { color: '#777', fontSize: 12, marginTop: 4, lineHeight: 18 },
  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff',
    borderRadius: 16, padding: 16, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  barLabel: { width: 110, fontSize: 12, color: '#666' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 28, textAlign: 'right', fontWeight: '700', fontSize: 14 },
  transcriptText: { color: '#444', fontSize: 13, lineHeight: 22, fontStyle: 'italic' },
  listItem: { color: '#555', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  actions: { flexDirection: 'row', margin: 16, gap: 12 },
  retryBtn: {
    flex: 1, backgroundColor: '#F3E5F5', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  retryText: { color: '#6A1B9A', fontWeight: '700', fontSize: 15 },
  homeBtn: {
    flex: 1, backgroundColor: '#6A1B9A', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  homeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
