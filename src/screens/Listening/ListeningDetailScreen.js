import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform, Animated, Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import { getListeningDetail } from '../../services/api';

const SPEEDS = [0.75, 1, 1.25, 1.5];
const SPEED_LABELS = { 0.75: '0.75x', 1: '1x', 1.25: '1.25x', 1.5: '1.5x' };

export default function ListeningDetailScreen({ route, navigation }) {
  const { test } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPart, setCurrentPart] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  // Waveform animation
  const waveAnims = useRef(Array.from({ length: 9 }, () => new Animated.Value(0.3))).current;
  const waveLoopRef = useRef(null);

  const startWave = () => {
    const anims = waveAnims.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 60),
          Animated.timing(val, { toValue: 1, duration: 350 + i * 40, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(val, { toValue: 0.2, duration: 350 + i * 40, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        ])
      )
    );
    waveLoopRef.current = Animated.parallel(anims);
    waveLoopRef.current.start();
  };

  const stopWave = () => {
    waveLoopRef.current?.stop();
    waveAnims.forEach(v => v.setValue(0.3));
  };

  // Hide Bottom Tab Bar when this screen is active
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              height: 65, paddingBottom: 8, paddingTop: 4,
              backgroundColor: '#fff', borderTopWidth: 1,
              borderTopColor: '#F0F0F0', elevation: 10,
            }
          });
        }
      };
    }, [navigation])
  );

  useEffect(() => {
    fetchDetail();
    return () => { sound?.unloadAsync(); stopWave(); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
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

  const loadAndPlayAudio = async (audioUrl) => {
    try {
      setLoadingAudio(true);
      if (sound) await sound.unloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPos(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
            if (status.isPlaying) startWave(); else stopWave();
          }
        }
      );
      setSound(newSound);
      startWave();
    } catch (e) {
      Alert.alert('Lỗi audio', 'Không thể phát file audio. Vui lòng thử lại.');
    } finally {
      setLoadingAudio(false);
    }
  };

  const togglePlay = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      stopWave();
    } else {
      await sound.playAsync();
      startWave();
    }
  };

  const handleSeek = async (value) => {
    if (sound) { await sound.setPositionAsync(value); setPlaybackPos(value); }
  };

  const skipBackward = async () => {
    if (sound) {
      const newPos = Math.max(0, playbackPos - 10000);
      await sound.setPositionAsync(newPos); setPlaybackPos(newPos);
    }
  };

  const skipForward = async () => {
    if (sound && duration > 0) {
      const newPos = Math.min(duration, playbackPos + 10000);
      await sound.setPositionAsync(newPos); setPlaybackPos(newPos);
    }
  };

  const changeSpeed = async (rate) => {
    setPlaybackRate(rate);
    if (sound) await sound.setRateAsync(rate, true);
  };

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNextPart = async () => {
    if (sound) { await sound.stopAsync(); await sound.unloadAsync(); setSound(null); }
    stopWave(); setIsPlaying(false); setPlaybackPos(0);
    if (currentPart < detail.parts.length - 1) {
      setCurrentPart(p => p + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    navigation.navigate('ListeningResult', { testId: test._id, answers, detail });
  };

  const handleClose = () => {
    Alert.alert(
      'Dừng làm bài?',
      'Kết quả hiện tại sẽ không được lưu lại. Bạn có chắc chắn muốn thoát?',
      [
        { text: 'Tiếp tục làm', style: 'cancel' },
        {
          text: 'Thoát', style: 'destructive',
          onPress: () => { if (sound) { sound.stopAsync(); sound.unloadAsync(); } stopWave(); navigation.goBack(); }
        },
      ]
    );
  };

  const selectAnswer = (questionNumber, option) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: option }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Đang tải đề thi...</Text>
      </View>
    );
  }

  const part = detail?.parts?.[currentPart];
  if (!part) return null;

  const answeredInPart = part.questions.filter(q => answers[q.questionNumber]).length;
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = detail.parts.flatMap(p => p.questions).length;
  const isTimeLow = timeLeft < 300;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={18} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{test.title}</Text>
          <Text style={styles.headerSub}>{totalAnswered}/{totalQuestions} câu đã trả lời</Text>
        </View>
        <View style={[styles.timerBadge, isTimeLow && styles.timerBadgeRed]}>
          <Ionicons name="time-outline" size={14} color={isTimeLow ? '#fff' : '#E53935'} />
          <Text style={[styles.timerText, isTimeLow && styles.timerTextWhite]}>
            {formatCountdown(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Blue progress line under header */}
      <View style={styles.progressLine}>
        <View style={[styles.progressLineFill, { width: `${(totalAnswered / Math.max(totalQuestions, 1)) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Audio Player Card */}
        <View style={styles.audioCard}>
          {/* Part tag + title */}
          <View style={styles.audioCardTopRow}>
            <View style={styles.partTag}>
              <Ionicons name="menu-outline" size={12} color="#fff" />
              <Text style={styles.partTagText}>Phần {part.partNumber}: {part.partTitle}</Text>
            </View>
          </View>

          <View style={styles.audioTrackRow}>
            <View style={styles.audioIconBg}>
              <Ionicons name="musical-notes" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.audioTrackTitle} numberOfLines={1}>
                {part.partTitle || `Track ${part.partNumber}.1`}
              </Text>
              <Text style={styles.audioTrackMeta}>
                Audio • {duration > 0 ? formatTime(duration) : '--:--'}
              </Text>
            </View>
          </View>

          {/* Waveform */}
          <View style={styles.waveformRow}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 36] }),
                    opacity: isPlaying ? 1 : 0.4,
                  },
                ]}
              />
            ))}
          </View>

          {/* Slider */}
          <View style={styles.sliderRow}>
            <Text style={styles.timeLabel}>{formatTime(playbackPos)}</Text>
            <Slider
              style={{ flex: 1, height: 36 }}
              minimumValue={0}
              maximumValue={duration || 1}
              value={playbackPos}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor="#BBDEFB"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#fff"
              disabled={!sound}
            />
            <Text style={styles.timeLabel}>{duration > 0 ? formatTime(duration) : '--:--'}</Text>
          </View>

          {/* Controls */}
          {loadingAudio ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.skipBtn} onPress={skipBackward} disabled={!sound}>
                <Ionicons name="reload-outline" size={22} color={!sound ? 'rgba(255,255,255,0.4)' : '#fff'} style={{ transform: [{ scaleX: -1 }] }} />
                <Text style={[styles.skipLabel, !sound && styles.skipLabelDisabled]}>-10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => sound ? togglePlay() : loadAndPlayAudio(part.audioUrl)}
              >
                <Ionicons
                  name={!sound ? 'play' : isPlaying ? 'pause' : 'play'}
                  size={30}
                  color="#1565C0"
                  style={{ marginLeft: (!sound || !isPlaying) ? 3 : 0 }}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn} onPress={skipForward} disabled={!sound}>
                <Ionicons name="reload-outline" size={22} color={!sound ? 'rgba(255,255,255,0.4)' : '#fff'} />
                <Text style={[styles.skipLabel, !sound && styles.skipLabelDisabled]}>+10s</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Speed */}
          <View style={styles.speedRow}>
            {SPEEDS.map(rate => (
              <TouchableOpacity
                key={rate}
                style={[styles.speedBtn, playbackRate === rate && styles.speedBtnActive]}
                onPress={() => changeSpeed(rate)}
              >
                <Text style={[styles.speedBtnText, playbackRate === rate && styles.speedBtnTextActive]}>
                  {SPEED_LABELS[rate]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Questions */}
        <View style={styles.questionsSection}>
          <View style={styles.questionsSectionHeader}>
            <Text style={styles.questionsSectionTitle}>
              Câu hỏi{' '}
              <Text style={styles.questionsSectionRange}>
                ({part.questions[0]?.questionNumber}–{part.questions[part.questions.length - 1]?.questionNumber})
              </Text>
            </Text>
          </View>

          {part.questions.map((q) => (
            <View key={q.questionNumber} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.qNumBadge}>
                  <Text style={styles.qNumText}>{q.questionNumber}</Text>
                </View>
                <Text style={styles.questionText}>{q.questionText}</Text>
              </View>

              {['A', 'B', 'C', 'D'].map(opt => {
                const isSelected = answers[q.questionNumber] === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => selectAnswer(q.questionNumber, opt)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                      {isSelected && <View style={styles.optionRadioDot} />}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt}. {q.options?.[opt] || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerCount}>
          Đã trả lời: <Text style={styles.footerCountBold}>{totalAnswered}/{totalQuestions}</Text> câu
        </Text>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={currentPart < (detail?.parts?.length || 1) - 1 ? handleNextPart : handleSubmit}
          activeOpacity={0.85}
        >
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>Nộp bài</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, color: '#757575', fontSize: 15, fontWeight: '500' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16,
    paddingVertical: 12, paddingTop: Platform.OS === 'android' ? 18 : 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  headerSub: { fontSize: 12, color: '#757575', marginTop: 2 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  timerBadgeRed: { backgroundColor: '#E53935' },
  timerText: { fontSize: 14, fontWeight: '800', color: '#E53935' },
  timerTextWhite: { color: '#fff' },

  progressLine: { height: 3, backgroundColor: '#F0F0F0' },
  progressLineFill: { height: '100%', backgroundColor: '#1565C0' },

  scroll: { flex: 1 },

  // Audio card
  audioCard: {
    margin: 16, backgroundColor: '#1565C0', borderRadius: 20, padding: 18,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  audioCardTopRow: { marginBottom: 14 },
  partTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  partTagText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  audioTrackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  audioIconBg: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  audioTrackTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  audioTrackMeta: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  waveformRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 3, marginBottom: 14, height: 44,
  },
  waveBar: { width: 4, borderRadius: 2, backgroundColor: '#fff' },

  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  timeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', width: 36 },

  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 36, marginTop: 12, marginBottom: 18,
  },
  skipBtn: { alignItems: 'center', gap: 4 },
  skipLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },
  skipLabelDisabled: { color: 'rgba(255,255,255,0.4)' },
  playBtn: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },

  speedRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  speedBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  speedBtnActive: { backgroundColor: '#fff' },
  speedBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  speedBtnTextActive: { color: '#1565C0' },

  // Questions
  questionsSection: { paddingHorizontal: 16 },
  questionsSectionHeader: { marginBottom: 14, marginTop: 4 },
  questionsSectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  questionsSectionRange: { fontSize: 14, fontWeight: '500', color: '#757575' },

  questionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5',
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  qNumBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1,
  },
  qNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  questionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E', lineHeight: 22 },

  option: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#EEEEEE', backgroundColor: '#FAFAFA', marginBottom: 8, gap: 10,
  },
  optionSelected: { borderColor: '#1565C0', backgroundColor: '#EEF4FF' },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#B0BEC5',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  optionRadioSelected: { borderColor: '#1565C0' },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1565C0' },
  optionText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  optionTextSelected: { color: '#1565C0', fontWeight: '600' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F0F2F5', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
  },
  footerCount: { fontSize: 13, color: '#757575' },
  footerCountBold: { fontWeight: '700', color: '#1565C0' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1565C0',
    borderRadius: 16, paddingVertical: 14, width: '100%', justifyContent: 'center',
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
