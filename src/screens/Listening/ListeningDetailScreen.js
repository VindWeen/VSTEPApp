import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { getListeningDetail } from '../../services/api';

export default function ListeningDetailScreen({ route, navigation }) {
  const { test } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPart, setCurrentPart] = useState(0);
  const [answers, setAnswers] = useState({});       // { questionNumber: 'A'|'B'|'C'|'D' }
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);

  useEffect(() => {
    fetchDetail();
    return () => { sound?.unloadAsync(); };
  }, []);

  const fetchDetail = async () => {
    try {
      const res = await getListeningDetail(test._id);
      setDetail(res.data.data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải đề thi');
    } finally {
      setLoading(false);
    }
  };

  // ── Audio controls ────────────────────────────────────────
  const loadAndPlayAudio = async (audioUrl) => {
    try {
      setLoadingAudio(true);
      if (sound) await sound.unloadAsync();

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPos(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
          }
        }
      );
      setSound(newSound);
    } catch (e) {
      Alert.alert('Lỗi audio', 'Không thể phát file audio. Vui lòng thử lại.');
    } finally {
      setLoadingAudio(false);
    }
  };

  const togglePlay = async () => {
    if (!sound) return;
    isPlaying ? await sound.pauseAsync() : await sound.playAsync();
  };

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // ── Navigation ────────────────────────────────────────────
  const handleNextPart = async () => {
    if (sound) { await sound.stopAsync(); await sound.unloadAsync(); setSound(null); }
    setIsPlaying(false);
    setPlaybackPos(0);
    if (currentPart < detail.parts.length - 1) {
      setCurrentPart((p) => p + 1);
    } else {
      navigation.navigate('ListeningResult', { testId: test._id, answers, detail });
    }
  };

  const selectAnswer = (questionNumber, option) => {
    setAnswers((prev) => ({ ...prev, [questionNumber]: option }));
  };

  // ── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải đề thi...</Text>
      </View>
    );
  }

  const part = detail?.parts?.[currentPart];
  if (!part) return null;

  const answeredCount = part.questions.filter((q) => answers[q.questionNumber]).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.testTitle} numberOfLines={1}>{test.title}</Text>
        <Text style={styles.partLabel}>Part {part.partNumber}/{detail.parts.length}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Part info */}
        <View style={styles.partCard}>
          <Text style={styles.partTitle}>{part.partTitle}</Text>
          <Text style={styles.partDesc}>{part.partDescription}</Text>
        </View>

        {/* Audio player */}
        <View style={styles.audioCard}>
          <Text style={styles.audioLabel}>🔊 File nghe</Text>
          {loadingAudio ? (
            <ActivityIndicator color="#2196F3" style={{ marginVertical: 12 }} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => sound ? togglePlay() : loadAndPlayAudio(part.audioUrl)}
              >
                <Text style={styles.playBtnText}>
                  {!sound ? '▶ Phát Audio' : isPlaying ? '⏸ Tạm dừng' : '▶ Tiếp tục'}
                </Text>
              </TouchableOpacity>
              {duration > 0 && (
                <Text style={styles.timeText}>
                  {formatTime(playbackPos)} / {formatTime(duration)}
                </Text>
              )}
            </>
          )}
          <Text style={styles.audioNote}>
            * Lắng nghe xong mới trả lời câu hỏi bên dưới
          </Text>
        </View>

        {/* Questions */}
        <Text style={styles.qSectionTitle}>
          Câu hỏi ({answeredCount}/{part.questions.length} đã trả lời)
        </Text>
        {part.questions.map((q) => (
          <View key={q.questionNumber} style={styles.questionCard}>
            <Text style={styles.questionNum}>Câu {q.questionNumber}</Text>
            <Text style={styles.questionText}>{q.questionText}</Text>
            <View style={styles.options}>
              {['A', 'B', 'C', 'D'].map((opt) => {
                const isSelected = answers[q.questionNumber] === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, isSelected && styles.optionSelected]}
                    onPress={() => selectAnswer(q.questionNumber, opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                      {opt}
                    </Text>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {q.options?.[opt] || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Next button */}
        <TouchableOpacity
          style={[styles.nextBtn, answeredCount < part.questions.length && styles.nextBtnDisabled]}
          onPress={handleNextPart}
          disabled={answeredCount < part.questions.length}
        >
          <Text style={styles.nextBtnText}>
            {currentPart < (detail?.parts?.length || 1) - 1 ? 'Part tiếp theo →' : '✅ Nộp bài'}
          </Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 12, color: '#666' },
  header: {
    backgroundColor: '#1565C0', paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  testTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1 },
  partLabel: { color: '#BBDEFB', fontSize: 13 },
  scroll: { flex: 1 },
  partCard: {
    margin: 16, backgroundColor: '#E3F2FD', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#2196F3',
  },
  partTitle: { fontSize: 16, fontWeight: '700', color: '#1565C0' },
  partDesc: { color: '#555', marginTop: 4, fontSize: 13 },
  audioCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 16, elevation: 2,
  },
  audioLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10 },
  playBtn: {
    backgroundColor: '#2196F3', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center',
  },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  timeText: { textAlign: 'center', color: '#888', marginTop: 8, fontSize: 13 },
  audioNote: { color: '#aaa', fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  qSectionTitle: {
    marginHorizontal: 16, marginBottom: 10, fontSize: 15, fontWeight: '700', color: '#333',
  },
  questionCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, elevation: 2,
  },
  questionNum: { fontSize: 12, fontWeight: '700', color: '#2196F3', marginBottom: 4 },
  questionText: { fontSize: 15, color: '#1A1A2E', fontWeight: '600', lineHeight: 22 },
  options: { marginTop: 12 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: '#DDD', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  optionSelected: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  optionLetter: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0',
    textAlign: 'center', lineHeight: 28, fontWeight: '700', color: '#555',
  },
  optionLetterSelected: { backgroundColor: '#2196F3', color: '#fff' },
  optionText: { flex: 1, color: '#444', fontSize: 14 },
  optionTextSelected: { color: '#1565C0', fontWeight: '600' },
  nextBtn: {
    marginHorizontal: 16, backgroundColor: '#2196F3', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  nextBtnDisabled: { backgroundColor: '#BDBDBD' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
