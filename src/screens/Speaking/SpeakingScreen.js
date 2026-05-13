import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, Animated, Easing,
  SafeAreaView, StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { uploadSpeaking, transcribeSpeaking, scoreSpeaking } from '../../services/api';

const MOCK_TASK = {
  _id: '1',
  prompt: 'Describe a place in your city that you enjoy visiting. Why do you like it?...',
  level: 'B1',
  duration: 90,
  title: 'Speaking Task 1',
};

export default function SpeakingScreen({ route, navigation }) {
  const test = route.params?.test || MOCK_TASK;
  const MAX_TIME = test.duration || 90;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const recordingRef = useRef(null);
  const timerRef = useRef(null);

  // Waveform animation values
  const waveAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0.3))).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const waveLoopRef = useRef(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      waveLoopRef.current?.stop();
    };
  }, []);

  const startWaveAnimation = () => {
    const animations = waveAnims.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(val, { toValue: 1, duration: 400 + i * 60, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(val, { toValue: 0.2, duration: 400 + i * 60, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        ])
      )
    );
    const micPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(micPulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    waveLoopRef.current = Animated.parallel([...animations, micPulse]);
    waveLoopRef.current.start();
  };

  const stopWaveAnimation = () => {
    waveLoopRef.current?.stop();
    waveAnims.forEach(val => val.setValue(0.3));
    micPulseAnim.setValue(1);
  };

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  };

  const startRecording = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng dùng microphone trong cài đặt.');
      return;
    }

    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav', outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000, numberOfChannels: 1, bitRate: 256000,
        },
        ios: {
          extension: '.wav', outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000, numberOfChannels: 1, bitRate: 256000,
          linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false,
        },
        web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
      startWaveAnimation();

      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t + 1 >= MAX_TIME) {
            clearInterval(timerRef.current);
            stopAndProcess();
            return MAX_TIME;
          }
          return t + 1;
        });
      }, 1000);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm: ' + e.message);
    }
  };

  const stopAndProcess = async () => {
    if (!recordingRef.current) return;
    clearInterval(timerRef.current);
    stopWaveAnimation();
    setIsRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('Không lấy được file ghi âm');

      setProcessing(true);

      // Upload
      setProcessingStep('Đang tải lên...');
      const formData = new FormData();
      formData.append('audio', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: 'audio/wav', name: 'speaking.wav',
      });
      formData.append('prompt', test.prompt || MOCK_TASK.prompt);
      formData.append('level', test.level || 'B1');
      formData.append('partType', 'Part 2');

      const uploadRes = await uploadSpeaking(formData);
      const id = uploadRes.data.data.speakingId;

      // Transcribe
      setProcessingStep('Đang chuyển giọng nói thành văn bản...');
      const transcribeRes = await transcribeSpeaking(id);

      // Score
      setProcessingStep('AI đang chấm điểm...');
      const scoreRes = await scoreSpeaking(id);

      navigation.replace('SpeakingResult', {
        result: scoreRes.data.data,
        transcript: transcribeRes.data.data.transcript,
        topic: test.prompt || MOCK_TASK.prompt,
        level: test.level || 'B1',
        duration: recordingTime,
        test,
      });
    } catch (e) {
      setProcessing(false);
      Alert.alert(
        'Lỗi',
        'Không thể xử lý bài nói.\n\n' + (e.response?.data?.message || e.message)
      );
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const progressPct = (recordingTime / MAX_TIME) * 100;

  if (processing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#6A1B9A" />
          <Text style={styles.processingText}>{processingStep}</Text>
          <Text style={styles.processingSubText}>Vui lòng chờ trong giây lát...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            if (isRecording) {
              Alert.alert('Dừng ghi âm?', 'Bài ghi âm sẽ bị huỷ.', [
                { text: 'Tiếp tục', style: 'cancel' },
                { text: 'Huỷ', style: 'destructive', onPress: () => {
                  clearInterval(timerRef.current);
                  stopWaveAnimation();
                  recordingRef.current?.stopAndUnloadAsync();
                  navigation.goBack();
                }},
              ]);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi âm</Text>
        <View style={[styles.timerBadge, isRecording && styles.timerBadgeActive]}>
          <Ionicons name="time-outline" size={14} color={isRecording ? '#6A1B9A' : '#9E9E9E'} />
          <Text style={[styles.timerBadgeText, isRecording && styles.timerBadgeTextActive]}>
            {formatTime(recordingTime)} / {MAX_TIME}s
          </Text>
        </View>
      </View>

      {/* Progress bar at top */}
      {isRecording && (
        <View style={styles.topProgressBg}>
          <View style={[styles.topProgressFill, { width: `${progressPct}%` }]} />
        </View>
      )}

      {/* Task prompt */}
      <View style={styles.promptCard}>
        <Text style={styles.promptLabel}>ĐỀ BÀI</Text>
        <Text style={styles.promptText} numberOfLines={3}>
          {test.prompt || MOCK_TASK.prompt}
        </Text>
      </View>

      {/* Main recording area */}
      <View style={styles.recordArea}>
        {/* Mic button with pulse rings */}
        <View style={styles.micContainer}>
          {isRecording && (
            <>
              <Animated.View style={[styles.micRing, styles.micRing3, { opacity: 0.15 }]} />
              <Animated.View style={[styles.micRing, styles.micRing2, { opacity: 0.25 }]} />
              <Animated.View style={[styles.micRing, styles.micRing1, { opacity: 0.35 }]} />
            </>
          )}
          <Animated.View style={[styles.micBtn, { transform: [{ scale: micPulseAnim }] }]}>
            <Ionicons name="mic" size={40} color="#fff" />
          </Animated.View>
        </View>

        {/* Waveform */}
        <View style={styles.waveContainer}>
          {waveAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.wavebar,
                {
                  height: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 40] }),
                  opacity: isRecording ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>

        {/* Play/Playback icon */}
        <View style={styles.playbackRow}>
          <View style={styles.playbackBtn}>
            <Ionicons name="play-circle-outline" size={36} color="#6A1B9A" />
          </View>
        </View>

        <Text style={styles.recordHint}>
          {isRecording ? 'Nhấn để dừng ghi âm' : 'Nhấn nút mic để bắt đầu'}
        </Text>
      </View>

      {/* Progress footer */}
      <View style={styles.progressFooter}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Tiến độ ghi âm</Text>
          <Text style={styles.progressTime}>{recordingTime} / {MAX_TIME} giây</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
      </View>

      {/* Action button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, isRecording ? styles.actionBtnStop : styles.actionBtnStart]}
          onPress={isRecording ? stopAndProcess : startRecording}
          activeOpacity={0.85}
        >
          <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={22} color="#fff" />
          <Text style={styles.actionBtnText}>
            {isRecording ? 'Dừng & Nộp bài' : 'Bắt đầu ghi âm'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E5F5', gap: 16 },
  processingText: { fontSize: 16, fontWeight: '700', color: '#6A1B9A' },
  processingSubText: { fontSize: 13, color: '#9575CD' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  timerBadgeActive: { backgroundColor: '#F3E5F5' },
  timerBadgeText: { fontSize: 13, fontWeight: '700', color: '#9E9E9E' },
  timerBadgeTextActive: { color: '#6A1B9A' },

  topProgressBg: { height: 3, backgroundColor: '#F0F0F0' },
  topProgressFill: { height: '100%', backgroundColor: '#CE93D8' },

  promptCard: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 16,
    backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#6A1B9A',
  },
  promptLabel: { fontSize: 11, fontWeight: '800', color: '#6A1B9A', letterSpacing: 1, marginBottom: 6 },
  promptText: { fontSize: 14, color: '#444', lineHeight: 22 },

  recordArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },

  micContainer: { position: 'relative', width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  micRing: {
    position: 'absolute', borderRadius: 80, backgroundColor: '#9C27B0',
  },
  micRing1: { width: 130, height: 130 },
  micRing2: { width: 150, height: 150 },
  micRing3: { width: 170, height: 170 },
  micBtn: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#6A1B9A',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6A1B9A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },

  waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, height: 50 },
  wavebar: { width: 4, borderRadius: 2, backgroundColor: '#9C27B0' },

  playbackRow: { marginBottom: 10 },
  playbackBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  recordHint: { fontSize: 14, color: '#757575', fontWeight: '500' },

  progressFooter: {
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#F3E5F5', borderRadius: 14, padding: 14,
  },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#6A1B9A', fontWeight: '600' },
  progressTime: { fontSize: 13, color: '#6A1B9A', fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#E1BEE7', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6A1B9A', borderRadius: 4 },

  footer: {
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F0F2F5', backgroundColor: '#fff',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  actionBtnStart: {
    backgroundColor: '#6A1B9A', shadowColor: '#6A1B9A',
  },
  actionBtnStop: {
    backgroundColor: '#D32F2F', shadowColor: '#D32F2F',
  },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
