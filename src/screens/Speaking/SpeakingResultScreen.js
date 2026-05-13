import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ScoreSegments({ value, max = 5 }) {
  const segments = 10;
  const filled = Math.round((value / max) * segments);
  return (
    <View style={styles.segRow}>
      {Array.from({ length: segments }).map((_, i) => (
        <View key={i} style={[styles.seg, i < filled ? styles.segFilled : styles.segEmpty]} />
      ))}
    </View>
  );
}

function CriteriaCard({ label, value }) {
  return (
    <View style={styles.criteriaCard}>
      <Text style={styles.criteriaLabel}>{label}</Text>
      <Text style={styles.criteriaValue}>{value?.toFixed(1) ?? '—'}</Text>
      <ScoreSegments value={value || 0} />
    </View>
  );
}

function BandPrediction({ band }) {
  if (!band) return null;
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

export default function SpeakingResultScreen({ route, navigation }) {
  const { result, transcript, topic, level, duration, test } = route.params;
  const feedback = result?.aiFeedback || result || {};
  const { band, fluency, lexical, grammar, pronunciation, strengths, improvements, suggestions } = feedback;

  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.navigate('SpeakingList')}
        >
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Band Score Circle */}
        <View style={styles.scoreSection}>
          <View style={styles.bandCircleOuter}>
            <View style={styles.bandCircle}>
              <Text style={styles.bandNum}>{band?.toFixed(1) ?? '—'}</Text>
              <Text style={styles.bandLabel}>BAND SCORE</Text>
            </View>
            <View style={styles.starBadge}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
          </View>
          <BandPrediction band={band} />
        </View>

        {/* Transcript */}
        {transcript ? (
          <View style={styles.transcriptCard}>
            <View style={styles.transcriptHeader}>
              <Text style={styles.transcriptIcon}>📝</Text>
              <Text style={styles.transcriptTitle}>Transcript</Text>
            </View>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}

        {/* Criteria grid */}
        <View style={styles.criteriaGrid}>
          <CriteriaCard label="PRONUNCIATION" value={pronunciation} />
          <CriteriaCard label="FLUENCY" value={fluency} />
          <CriteriaCard label="CONTENT" value={grammar} />
          <CriteriaCard label="GRAMMAR" value={lexical} />
        </View>

        {/* AI Feedback toggle */}
        <TouchableOpacity
          style={styles.aiFeedbackToggle}
          onPress={() => setShowFeedback(!showFeedback)}
          activeOpacity={0.8}
        >
          <View style={styles.aiFeedbackLeft}>
            <Text style={styles.aiFeedbackIcon}>🤖</Text>
            <Text style={styles.aiFeedbackTitle}>AI Feedback</Text>
          </View>
          <Ionicons
            name={showFeedback ? 'chevron-up' : 'chevron-down'}
            size={20} color="#6A1B9A"
          />
        </TouchableOpacity>

        {showFeedback && (
          <View style={styles.feedbackContainer}>
            {strengths?.length > 0 && (
              <View style={styles.feedbackSection}>
                <View style={styles.feedbackSectionHeader}>
                  <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                  <Text style={[styles.feedbackSectionTitle, { color: '#2E7D32' }]}>Ưu điểm</Text>
                </View>
                {strengths.map((s, i) => (
                  <Text key={i} style={styles.feedbackItem}>• {s}</Text>
                ))}
              </View>
            )}
            {improvements?.length > 0 && (
              <View style={styles.feedbackSection}>
                <View style={styles.feedbackSectionHeader}>
                  <Ionicons name="alert-circle" size={16} color="#E65100" />
                  <Text style={[styles.feedbackSectionTitle, { color: '#E65100' }]}>Cần cải thiện</Text>
                </View>
                {improvements.map((s, i) => (
                  <Text key={i} style={styles.feedbackItem}>• {s}</Text>
                ))}
              </View>
            )}
            {suggestions?.length > 0 && (
              <View style={styles.feedbackSection}>
                <View style={styles.feedbackSectionHeader}>
                  <Ionicons name="bulb" size={16} color="#1565C0" />
                  <Text style={[styles.feedbackSectionTitle, { color: '#1565C0' }]}>Gợi ý học tập</Text>
                </View>
                {suggestions.map((s, i) => (
                  <Text key={i} style={styles.feedbackItem}>• {s}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Main action */}
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('SpeakingList')}
          activeOpacity={0.85}
        >
          <Text style={styles.newBtnText}>Làm bài mới</Text>
        </TouchableOpacity>

        {/* Secondary actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('SpeakingPrep', { test: test || {} })}
          >
            <Ionicons name="volume-medium-outline" size={18} color="#6A1B9A" />
            <Text style={styles.secondaryBtnText}>Nghe lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Ionicons name="bookmark-outline" size={18} color="#6A1B9A" />
            <Text style={styles.secondaryBtnText}>Lưu</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff',
    marginBottom: 16,
  },
  bandCircleOuter: { position: 'relative', marginBottom: 16 },
  bandCircle: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 5, borderColor: '#6A1B9A', backgroundColor: '#F3E5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  bandNum: { fontSize: 42, fontWeight: '900', color: '#6A1B9A' },
  bandLabel: { fontSize: 11, color: '#9575CD', fontWeight: '700', letterSpacing: 1 },
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

  transcriptCard: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  transcriptIcon: { fontSize: 16 },
  transcriptTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  transcriptText: { fontSize: 14, color: '#555', lineHeight: 22, fontStyle: 'italic' },

  criteriaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10, marginBottom: 14,
  },
  criteriaCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  criteriaLabel: { fontSize: 10, fontWeight: '800', color: '#9E9E9E', letterSpacing: 0.8, marginBottom: 4 },
  criteriaValue: { fontSize: 26, fontWeight: '900', color: '#1A1A2E', marginBottom: 8 },
  segRow: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  segFilled: { backgroundColor: '#6A1B9A' },
  segEmpty: { backgroundColor: '#E0E0E0' },

  aiFeedbackToggle: {
    marginHorizontal: 16, marginBottom: 2, backgroundColor: '#F3E5F5',
    borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  aiFeedbackLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiFeedbackIcon: { fontSize: 18 },
  aiFeedbackTitle: { fontSize: 15, fontWeight: '700', color: '#6A1B9A' },

  feedbackContainer: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  feedbackSection: { marginBottom: 14 },
  feedbackSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  feedbackSectionTitle: { fontSize: 14, fontWeight: '700' },
  feedbackItem: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 4 },

  newBtn: {
    marginHorizontal: 16, marginTop: 14, backgroundColor: '#6A1B9A', borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: '#6A1B9A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  newBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  secondaryActions: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#CE93D8', borderRadius: 16, paddingVertical: 13, backgroundColor: '#fff',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#6A1B9A' },
});
