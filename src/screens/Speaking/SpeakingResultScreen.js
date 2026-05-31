import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

function ScoreSegments({ value, max = 10, color }) {
  const { theme, isDarkMode } = useTheme();
  const segments = 10;
  const filled = Math.round((value / max) * segments);
  const activeColor = color || (isDarkMode ? '#E040FB' : '#6A1B9A');
  return (
    <View style={styles.segRow}>
      {Array.from({ length: segments }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.seg,
            i < filled
              ? { backgroundColor: activeColor }
              : { backgroundColor: isDarkMode ? '#333333' : '#E0E0E0' }
          ]}
        />
      ))}
    </View>
  );
}

function CriteriaCard({ label, value }) {
  const { theme, isDarkMode } = useTheme();
  const purpleAccent = isDarkMode ? '#E040FB' : '#6A1B9A';
  return (
    <View style={[styles.criteriaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.criteriaLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.criteriaValue, { color: theme.text }]}>{value?.toFixed(1) ?? '-'}</Text>
      <ScoreSegments value={value || 0} color={purpleAccent} />
    </View>
  );
}

const formatTime = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

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
    : (isDarkMode ? '#E040FB' : '#6A1B9A');

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
          <Text style={[styles.bulletMark, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>•</Text>
          <Text style={[styles.bulletText, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PartCriteriaRow({ label, value }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.partCriteriaRow, { borderTopColor: theme.border }]}>
      <Text style={[styles.partCriteriaLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.partCriteriaValue, { color: theme.text }]}>{typeof value === 'number' ? value.toFixed(1) : '-'}</Text>
    </View>
  );
}

export default function SpeakingResultScreen({ route, navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { result, test, fromHistory, fromFullMock } = route.params;
  const [expandedPartKey, setExpandedPartKey] = useState(null);
  const [playingPartKey, setPlayingPartKey] = useState(null);
  const soundRef = useRef(null);

  const feedback = result?.aiFeedback || result || {};
  const partResults = result?.partResults || result?.partResponses || [];
  const { band, fluency, lexical, grammar, pronunciation, strengths, improvements, suggestions } =
    feedback;

  useEffect(() => () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
    }
  }, []);

  const togglePart = (key) => {
    setExpandedPartKey((current) => (current === key ? null : key));
  };

  const navigateAfterReview = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingPartKey(null);

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

  const togglePartPlayback = async (partKey, audioUrl) => {
    if (!audioUrl) return;

    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setPlayingPartKey(partKey);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPlayingPartKey(null);
          }
        });
        return;
      }

      const status = await soundRef.current.getStatusAsync();

      if (playingPartKey === partKey && status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlayingPartKey(null);
        return;
      }

      await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingPartKey(partKey);
      sound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.didJustFinish) {
          setPlayingPartKey(null);
        }
      });
    } catch (error) {
      console.error('Không thể phát audio speaking history:', error.message);
      setPlayingPartKey(null);
    }
  };

  const purpleAccent = isDarkMode ? '#E040FB' : '#6A1B9A';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.card} />

      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F5F5F5' }]} onPress={navigateAfterReview}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Kết quả Speaking</Text>
        <View style={styles.shareBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.scoreSection, { backgroundColor: theme.card, marginBottom: 16 }]}>
          <View style={[styles.bandCircle, { borderColor: purpleAccent, backgroundColor: isDarkMode ? '#25162C' : '#F3E5F5' }]}>
            <Text style={[styles.bandNum, { color: purpleAccent }]}>{band?.toFixed(1) ?? '-'}</Text>
            <Text style={[styles.bandLabel, { color: isDarkMode ? '#CE93D8' : '#9575CD' }]}>BAND SCORE</Text>
          </View>
          <Text style={[styles.testTitle, { color: theme.text }]}>{test?.title || result?.testTitle || 'Speaking Test'}</Text>
          {typeof result?.totalAudioDuration === 'number' ? (
            <Text style={[styles.testMeta, { color: theme.textSecondary }]}>Tổng thời lượng: {formatTime(result.totalAudioDuration)}</Text>
          ) : null}
        </View>

        {!!partResults.length && (
          <View style={[styles.partCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.partCardTitle, { color: theme.text }]}>Tổng hợp theo part</Text>
            <Text style={[styles.partCardSubtitle, { color: theme.textSecondary }]}>
              Mở từng part để xem transcript và nhận xét chi tiết.
            </Text>

            {partResults.map((part, index) => {
              const partKey = `${part.partType}-${index}`;
              const expanded = expandedPartKey === partKey;
              const partFeedback = part.aiFeedback || {};

              return (
                <View key={partKey} style={[styles.partItem, { borderTopColor: theme.border }]}>
                  <TouchableOpacity style={styles.partRow} onPress={() => togglePart(partKey)}>
                    <View style={styles.partRowLeft}>
                      <Text style={[styles.partName, { color: theme.text }]}>{part.partType}</Text>
                      <Text style={[styles.partMeta, { color: theme.textSecondary }]}>
                        {formatTime(part.audioDuration)} • Band {partFeedback.band?.toFixed(1) ?? '-'}
                      </Text>
                    </View>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={purpleAccent}
                    />
                  </TouchableOpacity>

                  {expanded ? (
                    <View style={styles.partDetail}>
                      {part.prompt ? (
                        <View style={[styles.detailBlock, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA' }]}>
                          <Text style={[styles.detailLabel, { color: purpleAccent }]}>Đề bài</Text>
                          <Text style={[styles.detailText, { color: theme.text }]}>{part.prompt}</Text>
                        </View>
                      ) : null}

                      <View style={[styles.detailBlock, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA' }]}>
                        <Text style={[styles.detailLabel, { color: purpleAccent }]}>Transcript</Text>
                        <Text style={[styles.transcriptText, { color: theme.text }]}>
                          {normalizeSentence(part.transcript) || 'Chưa có transcript.'}
                        </Text>
                      </View>

                      {part.audioUrl ? (
                        <TouchableOpacity
                          style={[styles.audioBtn, { backgroundColor: isDarkMode ? '#25162C' : '#F3E5F5' }]}
                          onPress={() => togglePartPlayback(partKey, part.audioUrl)}
                        >
                          <Ionicons
                            name={playingPartKey === partKey ? 'pause-circle' : 'play-circle'}
                            size={18}
                            color={purpleAccent}
                          />
                          <Text style={[styles.audioBtnText, { color: purpleAccent }]}>
                            {playingPartKey === partKey ? 'Tạm dừng audio của part này' : 'Nghe lại audio của part này'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      <View style={[styles.partCriteriaCard, { backgroundColor: isDarkMode ? '#252525' : '#FAFAFA' }]}>
                        <Text style={[styles.detailLabel, { color: purpleAccent }]}>Điểm từng tiêu chí</Text>
                        <PartCriteriaRow label="Pronunciation" value={partFeedback.pronunciation} />
                        <PartCriteriaRow label="Fluency" value={partFeedback.fluency} />
                        <PartCriteriaRow label="Lexical" value={partFeedback.lexical} />
                        <PartCriteriaRow label="Grammar" value={partFeedback.grammar} />
                      </View>

                      <FeedbackList
                        title="Ưu điểm của part này"
                        items={partFeedback.strengths}
                        icon="checkmark-circle"
                        tone="positive"
                      />
                      <FeedbackList
                        title="Điểm cần cải thiện"
                        items={partFeedback.improvements}
                        icon="alert-circle"
                        tone="warning"
                      />
                      <FeedbackList
                        title="Gợi ý luyện thêm"
                        items={partFeedback.suggestions}
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
          <CriteriaCard label="PRONUNCIATION" value={pronunciation || 0} />
          <CriteriaCard label="FLUENCY" value={fluency || 0} />
          <CriteriaCard label="LEXICAL" value={lexical || 0} />
          <CriteriaCard label="GRAMMAR" value={grammar || 0} />
        </View>

        <View style={[styles.feedbackContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
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

        <TouchableOpacity style={[styles.newBtn, { backgroundColor: purpleAccent }]} onPress={navigateAfterReview}>
          <Text style={styles.newBtnText}>Về trang kỹ năng nói</Text>
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
    borderColor: '#6A1B9A',
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bandNum: { fontSize: 42, fontWeight: '900', color: '#6A1B9A' },
  bandLabel: { fontSize: 11, color: '#9575CD', fontWeight: '700', letterSpacing: 1 },
  testTitle: { marginTop: 14, fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  testMeta: { marginTop: 6, fontSize: 13, color: '#757575' },
  partCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  partCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  partCardSubtitle: { marginTop: 4, marginBottom: 8, fontSize: 12, color: '#757575' },
  partItem: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  partRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  partRowLeft: { flex: 1, gap: 4 },
  partName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  partMeta: { fontSize: 12, color: '#757575' },
  partDetail: {
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
    color: '#6A1B9A',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailText: { fontSize: 14, color: '#444', lineHeight: 21 },
  transcriptText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  audioBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6A1B9A',
  },
  partCriteriaCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
  },
  partCriteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  partCriteriaLabel: { fontSize: 13, color: '#555' },
  partCriteriaValue: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10, marginBottom: 14 },
  criteriaCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  criteriaLabel: { fontSize: 10, fontWeight: '800', color: '#9E9E9E', letterSpacing: 0.8, marginBottom: 4 },
  criteriaValue: { fontSize: 26, fontWeight: '900', color: '#1A1A2E', marginBottom: 8 },
  segRow: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  segFilled: { backgroundColor: '#6A1B9A' },
  segEmpty: { backgroundColor: '#E0E0E0' },
  feedbackContainer: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
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
    color: '#6A1B9A',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  newBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#6A1B9A',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  newBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
