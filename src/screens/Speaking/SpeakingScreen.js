import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { uploadSpeaking, scoreSpeakingTest } from '../../services/api';
import { clearPracticeState, savePracticeState } from '../../utils/practiceState';
import { updateFullMockProgress } from '../../utils/fullMockTest';
import { useTheme } from '../../context/ThemeContext';

const MOCK_TASK = {
  title: 'Speaking 01 - Part 1',
  prompt: 'Describe a place in your city that you enjoy visiting.',
  level: 'B1',
  partType: 'Part 1',
  timeLimit: 3,
};

const inferAudioFileMeta = (uri = '', fallbackBaseName = 'speaking-part') => {
  const cleanUri = String(uri).split('?')[0];
  const match = cleanUri.match(/\.([a-z0-9]+)$/i);
  const extension = (match?.[1] || 'm4a').toLowerCase();

  const mimeByExtension = {
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    aac: 'audio/aac',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    '3gp': 'audio/3gpp',
    amr: 'audio/amr',
  };

  return {
    extension,
    type: mimeByExtension[extension] || 'audio/mp4',
    name: `${fallbackBaseName}.${extension}`,
  };
};

export default function SpeakingScreen({ route, navigation }) {
  const { isDarkMode, theme } = useTheme();
  const test = route.params?.test || { tasks: [MOCK_TASK] };
  const taskIndex = route.params?.taskIndex || 0;
  const resumeState = route.params?.resumeState || null;
  const fullMockMode = route.params?.fullMockMode || false;
  const tasks = test.tasks || [test];
  const currentTask = tasks[taskIndex] || tasks[0];
  const hasPreviousTask = taskIndex > 0;
  const isLastTask = taskIndex >= tasks.length - 1;
  const maxTime = (currentTask.timeLimit || 2) * 60;
  const testStorageKey = test._id || test.title;

  const [draftResponses, setDraftResponses] = useState(route.params?.draftResponses || resumeState?.draftResponses || []);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const soundRef = useRef(null);
  const waveAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0.3))).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const waveLoopRef = useRef(null);

  const currentDraft = useMemo(() => draftResponses[taskIndex], [draftResponses, taskIndex]);
  const allPartsRecorded = useMemo(
    () => tasks.every((_, index) => Boolean(draftResponses[index]?.localUri)),
    [draftResponses, tasks]
  );

  useEffect(() => {
    setDraftResponses(route.params?.draftResponses || resumeState?.draftResponses || []);
  }, [route.params?.draftResponses, resumeState?.draftResponses]);

  useEffect(() => {
    setRecordingTime(currentDraft?.audioDuration || 0);
  }, [currentDraft?.audioDuration, taskIndex]);

  useEffect(() => {
    savePracticeState('speaking', testStorageKey, {
      testId: testStorageKey,
      title: test.title,
      level: test.level,
      screen: 'record',
      taskIndex,
      draftResponses,
      recordingTime,
    }).catch(() => {});

    if (fullMockMode) {
      updateFullMockProgress('speaking', {
        status: 'in_progress',
        screen: 'record',
        taskIndex,
        draftResponses,
        recordingTime,
      }).catch(() => {});
    }
  }, [draftResponses, taskIndex, recordingTime, fullMockMode]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      waveLoopRef.current?.stop();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    },
    []
  );

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const buildUpdatedDraftResponses = (overrides = {}) => {
    const nextDrafts = [...draftResponses];
    nextDrafts[taskIndex] = {
      title: currentTask.title,
      prompt: currentTask.prompt || MOCK_TASK.prompt,
      level: currentTask.level || test.level || 'B1',
      partType: currentTask.partType || 'Part 1',
      timeLimit: currentTask.timeLimit || 0,
      ...nextDrafts[taskIndex],
      ...overrides,
    };
    return nextDrafts;
  };

  const startWaveAnimation = () => {
    const animations = waveAnims.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 80),
          Animated.timing(value, {
            toValue: 1,
            duration: 400 + index * 60,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(value, {
            toValue: 0.2,
            duration: 400 + index * 60,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.sin),
          }),
        ])
      )
    );
    const micPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(micPulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    waveLoopRef.current = Animated.parallel([...animations, micPulse]);
    waveLoopRef.current.start();
  };

  const stopWaveAnimation = () => {
    waveLoopRef.current?.stop();
    waveAnims.forEach((value) => value.setValue(0.3));
    micPulseAnim.setValue(1);
  };

  const stopPlayback = async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
    } catch {}
    setIsPlaying(false);
  };

  const togglePlayback = async () => {
    if (!currentDraft?.localUri) return;

    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: currentDraft.localUri },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setIsPlaying(true);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
        return;
      }

      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else if (status.isLoaded) {
        await soundRef.current.playFromPositionAsync(0);
        setIsPlaying(true);
      }
    } catch (e) {
      Alert.alert('Lỗi', `Không thể phát audio: ${e.message}`);
    }
  };

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng dùng microphone.');
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        setIsPlaying(false);
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
      startWaveAnimation();

      timerRef.current = setInterval(() => {
        setRecordingTime((time) => {
          if (time + 1 >= maxTime) {
            clearInterval(timerRef.current);
            stopAndSaveRecording();
            return maxTime;
          }
          return time + 1;
        });
      }, 1000);
    } catch (e) {
      Alert.alert('Lỗi', `Không thể bắt đầu ghi âm: ${e.message}`);
    }
  };

  const stopAndSaveRecording = async () => {
    if (!recordingRef.current) return;
    clearInterval(timerRef.current);
    stopWaveAnimation();
    setIsRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('Không lấy được file ghi âm');

      const nextDrafts = buildUpdatedDraftResponses({
        localUri: uri,
        audioDuration: recordingTime,
      });
      setDraftResponses(nextDrafts);
      Alert.alert('Đã lưu', 'Bản ghi của part này đã được lưu tạm.');
    } catch (e) {
      Alert.alert('Lỗi', `Không thể lưu bản ghi: ${e.message}`);
    }
  };

  const handleGoToPreviousTask = async () => {
    if (!hasPreviousTask || processing) return;
    await stopPlayback();
    navigation.replace(fullMockMode ? 'FullMockSpeakingRecord' : 'SpeakingRecord', {
      test,
      taskIndex: taskIndex - 1,
      draftResponses,
      ...(fullMockMode ? { fullMockMode, fullMockSessionId: route.params?.fullMockSessionId } : {}),
    });
  };

  const handleHeaderLeftPress = async () => {
    if (hasPreviousTask) {
      await handleGoToPreviousTask();
      return;
    }

    navigation.goBack();
  };

  const handleGoToNextTask = async () => {
    if (!currentDraft?.localUri) {
      Alert.alert('Thiếu bản ghi', 'Bạn cần ghi âm part này trước khi sang part tiếp theo.');
      return;
    }

    await stopPlayback();
    navigation.push(fullMockMode ? 'FullMockSpeakingPrep' : 'SpeakingPrep', {
      test,
      taskIndex: taskIndex + 1,
      draftResponses,
      ...(fullMockMode ? { fullMockMode, fullMockSessionId: route.params?.fullMockSessionId } : {}),
    });
  };

  const handleSubmitFullTest = async () => {
    if (!allPartsRecorded) {
      Alert.alert('Chưa đủ part', 'Bạn cần ghi âm đủ 3 part trước khi chấm điểm toàn bộ bài.');
      return;
    }

    if (fullMockMode) {
      await clearPracticeState('speaking', testStorageKey);
      await updateFullMockProgress('speaking', {
        status: 'completed',
        screen: 'record',
        taskIndex,
        draftResponses,
        completedAt: new Date().toISOString(),
      });
      navigation.replace('MockTestHub', {
        sessionId: route.params?.fullMockSessionId,
        justCompleted: 'speaking',
      });
      return;
    }

    setProcessing(true);

    try {
      const speakingIds = [];

      for (const draft of draftResponses) {
        setProcessingStep(`Đang tải lên ${draft.partType}...`);
        const fileMeta = inferAudioFileMeta(
          draft.localUri,
          draft.partType.replace(/\s+/g, '-').toLowerCase()
        );

        const formData = new FormData();
        formData.append('audio', {
          uri: Platform.OS === 'android' ? draft.localUri : draft.localUri.replace('file://', ''),
          type: fileMeta.type,
          name: fileMeta.name,
        });
        formData.append('title', draft.title || '');
        formData.append('prompt', draft.prompt);
        formData.append('level', draft.level || test.level || 'B1');
        formData.append('partType', draft.partType || 'Part 1');

        const uploadRes = await uploadSpeaking(formData);
        speakingIds.push(uploadRes.data.data.speakingId);
      }

      setProcessingStep('Đang chấm toàn bộ bài speaking...');
      const scoreRes = await scoreSpeakingTest({
        testTitle: test.title,
        level: test.level || currentTask.level || 'B1',
        speakingIds,
      });

      await clearPracticeState('speaking', testStorageKey);

      navigation.replace('SpeakingResult', {
        result: scoreRes.data.data,
        test,
        draftResponses,
      });
    } catch (e) {
      setProcessing(false);
      Alert.alert('Lỗi', `Không thể chấm bài nói.\n\n${e.response?.data?.message || e.message}`);
    }
  };

  if (processing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.processingContainer, { backgroundColor: isDarkMode ? theme.background : '#F3E5F5' }]}>
          <ActivityIndicator size="large" color={isDarkMode ? '#E040FB' : '#6A1B9A'} />
          <Text style={[styles.processingText, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>{processingStep}</Text>
          <Text style={[styles.processingSubText, { color: isDarkMode ? '#D1C4E9' : '#9575CD' }]}>Vui lòng chờ trong giây lát...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? theme.background : '#fff'} />

      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]} onPress={handleHeaderLeftPress}>
          <Ionicons name={hasPreviousTask ? 'arrow-back' : 'close'} size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ghi âm</Text>
        <View style={[styles.timerBadge, { backgroundColor: isDarkMode ? '#2D1F35' : '#F3E5F5' }]}>
          <Ionicons name="time-outline" size={14} color={isDarkMode ? '#E040FB' : '#6A1B9A'} />
          <Text style={[styles.timerBadgeText, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>{formatTime(recordingTime)} / {formatTime(maxTime)}</Text>
        </View>
      </View>

      <View style={[
        styles.promptCard,
        {
          backgroundColor: theme.card,
          borderLeftColor: isDarkMode ? '#E040FB' : '#6A1B9A',
          borderColor: theme.border,
          borderWidth: isDarkMode ? 1 : 0
        }
      ]}>
        <Text style={[styles.promptLabel, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>{currentTask.partType || `Part ${taskIndex + 1}`}</Text>
        <Text style={[styles.promptText, { color: theme.text }]}>{currentTask.prompt || MOCK_TASK.prompt}</Text>
      </View>

      {currentDraft?.localUri ? (
        <View style={[styles.savedCard, { backgroundColor: isDarkMode ? '#2D1F35' : '#F3E5F5' }]}>
          <View style={styles.savedTop}>
            <View>
              <Text style={[styles.savedTitle, { color: isDarkMode ? '#E040FB' : '#4A148C' }]}>Đã có bản ghi cho part này</Text>
              <Text style={[styles.savedMeta, { color: isDarkMode ? '#D1C4E9' : '#7B1FA2' }]}>Thời lượng: {formatTime(currentDraft.audioDuration || 0)}</Text>
            </View>
            <TouchableOpacity style={[styles.playBtn, { backgroundColor: isDarkMode ? '#E040FB' : '#6A1B9A' }]} onPress={togglePlayback}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.savedActions}>
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#333' : '#fff', borderColor: isDarkMode ? '#444' : '#D1C4E9' }]} onPress={startRecording}>
              <Ionicons name="refresh" size={16} color={isDarkMode ? '#E040FB' : '#6A1B9A'} />
              <Text style={[styles.secondaryBtnText, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>Ghi âm lại</Text>
            </TouchableOpacity>

            {!isLastTask ? (
              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#333' : '#fff', borderColor: isDarkMode ? '#444' : '#D1C4E9' }]} onPress={handleGoToNextTask}>
                <Ionicons name="arrow-forward" size={16} color={isDarkMode ? '#E040FB' : '#6A1B9A'} />
                <Text style={[styles.secondaryBtnText, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>Sang part tiếp</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.recordArea}>
        <Animated.View style={[styles.micBtn, { transform: [{ scale: micPulseAnim }], backgroundColor: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>
          <Ionicons name="mic" size={40} color="#fff" />
        </Animated.View>

        <View style={styles.waveContainer}>
          {waveAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.wavebar,
                {
                  height: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 40] }),
                  backgroundColor: isDarkMode ? '#E040FB' : '#9C27B0',
                },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.recordHint, { color: theme.textSecondary }]}>
          {isRecording
            ? 'Nhấn để dừng và lưu bản ghi'
            : currentDraft?.localUri
              ? 'Bạn có thể nghe lại hoặc ghi âm lại part này'
              : 'Nhấn nút mic để bắt đầu ghi âm'}
        </Text>
      </View>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isRecording ? styles.actionBtnStop : [styles.actionBtnStart, { backgroundColor: isDarkMode ? '#E040FB' : '#6A1B9A' }]
          ]}
          onPress={isRecording ? stopAndSaveRecording : startRecording}
        >
          <Ionicons name={isRecording ? 'save' : currentDraft?.localUri ? 'refresh' : 'mic'} size={22} color="#fff" />
          <Text style={styles.actionBtnText}>
            {isRecording
              ? 'Dừng & lưu part'
              : currentDraft?.localUri
                ? 'Ghi âm lại part này'
                : 'Bắt đầu ghi âm'}
          </Text>
        </TouchableOpacity>

        {isLastTask ? (
          <TouchableOpacity
            style={[
              styles.submitBtn,
              isDarkMode && { backgroundColor: '#388E3C' },
              !allPartsRecorded && (isDarkMode ? { backgroundColor: '#333' } : styles.submitBtnDisabled)
            ]}
            onPress={handleSubmitFullTest}
            disabled={!allPartsRecorded}
          >
            <Ionicons name="checkmark-circle" size={20} color={!allPartsRecorded && isDarkMode ? '#666' : '#fff'} />
            <Text style={[styles.submitBtnText, !allPartsRecorded && isDarkMode && { color: '#666' }]}>Nộp & chấm cả bài</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    gap: 16,
  },
  processingText: { fontSize: 16, fontWeight: '700', color: '#6A1B9A' },
  processingSubText: { fontSize: 13, color: '#9575CD' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 20 : 14,
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
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerBadgeText: { fontSize: 13, fontWeight: '700', color: '#6A1B9A' },
  promptCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6A1B9A',
  },
  promptLabel: { fontSize: 11, fontWeight: '800', color: '#6A1B9A', letterSpacing: 1, marginBottom: 6 },
  promptText: { fontSize: 14, color: '#444', lineHeight: 22 },
  savedCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#F3E5F5',
    borderRadius: 16,
    padding: 16,
  },
  savedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  savedTitle: { fontSize: 14, fontWeight: '800', color: '#4A148C' },
  savedMeta: { fontSize: 12, color: '#7B1FA2', marginTop: 3 },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6A1B9A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1C4E9',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#6A1B9A' },
  recordArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6A1B9A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 24, marginBottom: 20, height: 50 },
  wavebar: { width: 4, borderRadius: 2, backgroundColor: '#9C27B0' },
  recordHint: { fontSize: 14, color: '#757575', fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    backgroundColor: '#fff',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
  },
  actionBtnStart: { backgroundColor: '#6A1B9A' },
  actionBtnStop: { backgroundColor: '#D32F2F' },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    backgroundColor: '#2E7D32',
  },
  submitBtnDisabled: { backgroundColor: '#BDBDBD' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
