import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { uploadSpeaking, transcribeSpeaking, scoreSpeaking } from '../../services/api';

const STEPS = ['record', 'uploading', 'transcribing', 'scoring', 'done', 'error'];

const STEP_LABELS = {
  record: 'Sẵn sàng ghi âm',
  uploading: 'Đang tải lên...',
  transcribing: 'Đang chuyển giọng nói thành văn bản...',
  scoring: 'AI đang chấm điểm...',
  done: 'Hoàn thành!',
  error: 'Có lỗi xảy ra',
};

const SAMPLE_TOPICS = [
  'Talk about your hometown and what you like about it.',
  'Describe a memorable trip you have taken.',
  'What are the advantages and disadvantages of working from home?',
  'Describe a person who has influenced you greatly.',
  'Talk about a hobby or sport you enjoy.',
];

export default function SpeakingScreen({ navigation }) {
  const [step, setStep] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speakingId, setSpeakingId] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [topic, setTopic] = useState(SAMPLE_TOPICS[0]);
  const [result, setResult] = useState(null);
  const [level, setLevel] = useState('B1');

  const recordingRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync();
    };
  }, []);

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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm: ' + e.message);
    }
  };

  const stopAndProcess = async () => {
    if (!recordingRef.current) return;

    try {
      clearInterval(timerRef.current);
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('Không lấy được file ghi âm');

      // UPLOAD
      setStep('uploading');
      const formData = new FormData();
      formData.append('audio', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: 'audio/wav',
        name: 'speaking.wav',
      });
      formData.append('prompt', topic);
      formData.append('level', level);
      formData.append('partType', 'Part 2');

      const uploadRes = await uploadSpeaking(formData);
      const id = uploadRes.data.data.speakingId; // ← backend trả về speakingId
      setSpeakingId(id);

      // TRANSCRIBE
      setStep('transcribing');
      const transcribeRes = await transcribeSpeaking(id);
      setTranscript(transcribeRes.data.data.transcript || '');

      // SCORE
      setStep('scoring');
      const scoreRes = await scoreSpeaking(id);
      setResult(scoreRes.data.data);
      setStep('done');

      navigation.navigate('SpeakingResult', {
        result: scoreRes.data.data,
        transcript: transcribeRes.data.data.transcript,
        topic,
        level,
        duration: recordingTime,
      });
    } catch (e) {
      console.error('Speaking error:', e.message);
      setStep('error');
      Alert.alert(
        'Lỗi',
        'Không thể xử lý bài nói.\n\n' +
        (e.response?.data?.message || e.message) +
        '\n\nHãy kiểm tra cài đặt Cloudinary trong .env'
      );
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const isProcessing = ['uploading', 'transcribing', 'scoring'].includes(step);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎙️ Luyện Nói</Text>
        <Text style={styles.headerSub}>AI đánh giá theo tiêu chí VSTEP</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Level */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Trình độ</Text>
          <View style={styles.chipRow}>
            {['A2', 'B1', 'B2', 'C1'].map((l) => (
              <TouchableOpacity key={l} style={[styles.chip, level === l && styles.chipActive]} onPress={() => setLevel(l)}>
                <Text style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Topic selector */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📋 Chủ đề</Text>
          {SAMPLE_TOPICS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.topicBtn, topic === t && styles.topicBtnActive]}
              onPress={() => setTopic(t)}
            >
              <Text style={[styles.topicText, topic === t && styles.topicTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Record area */}
        <View style={styles.recordCard}>
          {isProcessing ? (
            <View style={styles.processingArea}>
              <ActivityIndicator size="large" color="#7B1FA2" />
              <Text style={styles.stepText}>{STEP_LABELS[step]}</Text>
              {step === 'transcribing' && transcript && (
                <Text style={styles.transcriptPreview}>{transcript}</Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.timerText}>
                {isRecording ? `⏺ ${formatTime(recordingTime)}` : '00:00'}
              </Text>
              {isRecording && (
                <Text style={styles.recordingHint}>Đang ghi âm... nói tự nhiên</Text>
              )}
              <View style={styles.recBtnRow}>
                <TouchableOpacity
                  style={[styles.recBtn, isRecording ? styles.recBtnStop : styles.recBtnStart]}
                  onPress={isRecording ? stopAndProcess : startRecording}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recBtnIcon}>{isRecording ? '⏹' : '🎙'}</Text>
                  <Text style={styles.recBtnText}>
                    {isRecording ? 'Dừng & Nộp bài' : 'Bắt đầu ghi âm'}
                  </Text>
                </TouchableOpacity>
              </View>
              {step === 'error' && (
                <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('record')}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tiêu chí VSTEP Speaking</Text>
          {['Fluency & Coherence – Nói lưu loát, mạch lạc',
            'Lexical Resource – Dùng từ vựng đa dạng',
            'Grammatical Range – Ngữ pháp đúng và phong phú',
            'Pronunciation – Phát âm rõ ràng, dễ nghe'].map((t) => (
            <Text key={t} style={styles.tipItem}>• {t}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#6A1B9A', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: '#CE93D8', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 2,
  },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#DDD', backgroundColor: '#F9F9F9',
  },
  chipActive: { backgroundColor: '#6A1B9A', borderColor: '#6A1B9A' },
  chipText: { color: '#666', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  topicBtn: {
    padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD',
    marginBottom: 8, backgroundColor: '#F9F9F9',
  },
  topicBtnActive: { borderColor: '#6A1B9A', backgroundColor: '#F3E5F5' },
  topicText: { color: '#555', fontSize: 13, lineHeight: 18 },
  topicTextActive: { color: '#4A148C', fontWeight: '600' },
  recordCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    marginBottom: 12, elevation: 3, alignItems: 'center', minHeight: 200,
    justifyContent: 'center',
  },
  timerText: { fontSize: 48, fontWeight: '900', color: '#1A1A2E', letterSpacing: 2 },
  recordingHint: { color: '#E53935', fontSize: 14, marginTop: 4 },
  recBtnRow: { marginTop: 20 },
  recBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    paddingHorizontal: 28, borderRadius: 50, gap: 8,
  },
  recBtnStart: { backgroundColor: '#6A1B9A' },
  recBtnStop: { backgroundColor: '#D32F2F' },
  recBtnIcon: { fontSize: 22 },
  recBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  processingArea: { alignItems: 'center', padding: 16 },
  stepText: { color: '#6A1B9A', fontWeight: '600', marginTop: 12, fontSize: 15 },
  transcriptPreview: {
    color: '#555', fontSize: 13, marginTop: 10, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 20,
  },
  retryBtn: {
    marginTop: 12, paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#6A1B9A',
  },
  retryText: { color: '#6A1B9A', fontWeight: '600' },
  tipsCard: {
    backgroundColor: '#F3E5F5', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#6A1B9A',
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#6A1B9A', marginBottom: 8 },
  tipItem: { color: '#555', fontSize: 13, marginBottom: 4 },
});
