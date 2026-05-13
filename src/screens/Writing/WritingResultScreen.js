import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ScoreSegments({ value, max = 5, color = '#E65100' }) {
  const segments = 10;
  const filled = Math.round((value / max) * segments);
  return (
    <View style={styles.segRow}>
      {Array.from({ length: segments }).map((_, i) => (
        <View key={i} style={[styles.seg, i < filled ? { ...styles.segFilled, backgroundColor: color } : styles.segEmpty]} />
      ))}
    </View>
  );
}

function CriteriaCard({ label, value }) {
  const getColor = (v) => {
    if (v >= 4.5) return '#1565C0';
    if (v >= 3.5) return '#2E7D32';
    if (v >= 2.5) return '#E65100';
    return '#D32F2F';
  };
  const color = getColor(value || 0);

  return (
    <View style={styles.criteriaCard}>
      <Text style={styles.criteriaLabel}>{label}</Text>
      <Text style={[styles.criteriaValue, { color }]}>{value?.toFixed(1) ?? '—'}</Text>
      <ScoreSegments value={value || 0} color={color} />
    </View>
  );
}

function BandPrediction({ band }) {
  const levelMap = {
    5: 'C1 High-Range', 4.5: 'C1 Low-Range', 4: 'B2 High-Range',
    3.5: 'B2 Mid-Range', 3: 'B2 Low-Range', 2.5: 'B1 High-Range', 2: 'B1 Low-Range',
  };
  const label = levelMap[band] || (band >= 4.5 ? 'C1' : band >= 3.5 ? 'B2' : band >= 2.5 ? 'B1' : 'A2');
  return (
    <View style={styles.predictionBadge}>
      <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
      <Text style={styles.predictionText}>Dự đoán: {label}</Text>
    </View>
  );
}

export default function WritingResultScreen({ route, navigation }) {
  const { result, prompt, essay, level, taskType, test } = route.params;
  const feedback = result?.aiFeedback || result || {};
  const { band, taskAchievement, coherence, lexical, grammar, strengths, improvements, suggestions } = feedback;

  const wordCount = essay?.trim().split(/\s+/).filter(Boolean).length || 0;

  const getCircleColor = (b) => {
    if (!b) return '#E65100';
    if (b >= 4.5) return '#1565C0';
    if (b >= 3.5) return '#2E7D32';
    if (b >= 2.5) return '#E65100';
    return '#D32F2F';
  };
  const circleColor = getCircleColor(band);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.navigate('WritingList')}
        >
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả chi tiết</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Band Score */}
        <View style={styles.scoreSection}>
          <View style={styles.bandCircleOuter}>
            <View style={[styles.bandCircle, { borderColor: circleColor }]}>
              <Text style={[styles.bandNum, { color: circleColor }]}>{band?.toFixed(1) ?? '—'}</Text>
              <Text style={styles.bandLabel}>BAND SCORE</Text>
            </View>
            <View style={styles.starBadge}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
          </View>
          <BandPrediction band={band} />
        </View>

        {/* Criteria grid 2x2 */}
        <View style={styles.criteriaGrid}>
          <CriteriaCard label="TASK ACHIEV." value={taskAchievement} />
          <CriteriaCard label="COHERENCE" value={coherence} />
          <CriteriaCard label="LEXICAL" value={lexical} />
          <CriteriaCard label="GRAMMAR" value={grammar} />
        </View>

        {/* AI Feedback section */}
        <View style={styles.aiFeedbackSection}>
          <View style={styles.aiFeedbackHeader}>
            <Text style={styles.aiFeedbackIcon}>🤖</Text>
            <Text style={styles.aiFeedbackTitle}>AI Feedback</Text>
          </View>

          {/* Strengths */}
          {strengths?.length > 0 && (
            <View style={[styles.feedbackBlock, styles.feedbackBlockGreen]}>
              <View style={styles.feedbackBlockHeader}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                <Text style={[styles.feedbackBlockTitle, { color: '#2E7D32' }]}>Ưu điểm</Text>
              </View>
              <Text style={styles.feedbackBlockText}>
                {strengths.join(' ')}
              </Text>
            </View>
          )}

          {/* Improvements */}
          {improvements?.length > 0 && (
            <View style={[styles.feedbackBlock, styles.feedbackBlockOrange]}>
              <View style={styles.feedbackBlockHeader}>
                <Ionicons name="warning" size={18} color="#E65100" />
                <Text style={[styles.feedbackBlockTitle, { color: '#E65100' }]}>Cần cải thiện</Text>
              </View>
              <Text style={styles.feedbackBlockText}>
                {improvements.join(' ')}
              </Text>
            </View>
          )}

          {/* Suggestions */}
          {suggestions?.length > 0 && (
            <View style={[styles.feedbackBlock, styles.feedbackBlockBlue]}>
              <View style={styles.feedbackBlockHeader}>
                <Ionicons name="bulb" size={18} color="#1565C0" />
                <Text style={[styles.feedbackBlockTitle, { color: '#1565C0' }]}>Gợi ý học tập</Text>
              </View>
              {suggestions.map((s, i) => (
                <Text key={i} style={styles.feedbackItem}>• {s}</Text>
              ))}
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('WritingList')}
          activeOpacity={0.85}
        >
          <Text style={styles.newBtnText}>Làm bài mới</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  shareBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  scroll: { paddingBottom: 40 },

  scoreSection: {
    alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', marginBottom: 16,
  },
  bandCircleOuter: { position: 'relative', marginBottom: 16 },
  bandCircle: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 5,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F5',
  },
  bandNum: { fontSize: 42, fontWeight: '900' },
  bandLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '700', letterSpacing: 1 },
  starBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },

  predictionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  predictionText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },

  criteriaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10, marginBottom: 16,
  },
  criteriaCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  criteriaLabel: { fontSize: 10, fontWeight: '800', color: '#9E9E9E', letterSpacing: 0.8, marginBottom: 4 },
  criteriaValue: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  segRow: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  segFilled: {},
  segEmpty: { backgroundColor: '#F0F0F0' },

  aiFeedbackSection: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff',
    borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  aiFeedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  aiFeedbackIcon: { fontSize: 20 },
  aiFeedbackTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },

  feedbackBlock: { borderRadius: 12, padding: 14, marginBottom: 10 },
  feedbackBlockGreen: { backgroundColor: '#E8F5E9' },
  feedbackBlockOrange: { backgroundColor: '#FFF3E0' },
  feedbackBlockBlue: { backgroundColor: '#E3F2FD' },
  feedbackBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  feedbackBlockTitle: { fontSize: 14, fontWeight: '700' },
  feedbackBlockText: { fontSize: 14, color: '#444', lineHeight: 22 },
  feedbackItem: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 4 },

  newBtn: {
    marginHorizontal: 16, backgroundColor: '#E65100', borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: '#E65100', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  newBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
