import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { scoreWritingTest } from '../../services/api';
import { clearPracticeState, savePracticeState } from '../../utils/practiceState';
import { updateFullMockProgress } from '../../utils/fullMockTest';
import { useTheme } from '../../context/ThemeContext';

const MOCK_TEST = {
  _id: 'mock1',
  title: 'Writing 01',
  level: 'B2',
  tasks: [
    {
      title: 'Writing 01 - Task 1',
      taskType: 'Task 1',
      minWords: 120,
      timeLimit: 20,
      prompt: 'Write an email to your friend about a recent event.',
    },
    {
      title: 'Writing 01 - Task 2',
      taskType: 'Task 2',
      minWords: 250,
      timeLimit: 40,
      prompt: 'Discuss both views and give your opinion.',
    },
  ],
};

export default function WritingScreen({ route, navigation }) {
  const { isDarkMode, theme } = useTheme();
  const test = route.params?.test || MOCK_TEST;
  const taskIndex = route.params?.taskIndex || 0;
  const draftResponses = route.params?.draftResponses || [];
  const resumeState = route.params?.resumeState || null;
  const fullMockMode = route.params?.fullMockMode || false;
  const tasks = test.tasks || [test];
  const currentTask = tasks[taskIndex] || tasks[0];
  const totalTime = (currentTask.timeLimit || 40) * 60;
  const minWords = currentTask.minWords || (currentTask.taskType === 'Task 1' ? 120 : 250);
  const hasPreviousTask = taskIndex > 0;
  const isLastTask = taskIndex >= tasks.length - 1;

  const existingDraft = draftResponses[taskIndex] || resumeState?.draftResponses?.[taskIndex];
  const testStorageKey = test._id || test.title;

  const [essay, setEssay] = useState(existingDraft?.essay || '');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(resumeState?.timeLeft || totalTime);
  const timerRef = useRef(null);
  const wordCountAnim = useRef(new Animated.Value(1)).current;

  const wordCount = (essay.match(/\S+/g) || []).length;

  useEffect(() => {
    setEssay(existingDraft?.essay || '');
  }, [existingDraft?.essay, taskIndex]);

  useEffect(() => {
    setTimeLeft(resumeState?.taskIndex === taskIndex && resumeState?.timeLeft ? resumeState.timeLeft : totalTime);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [taskIndex, totalTime, resumeState?.taskIndex, resumeState?.timeLeft]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(wordCountAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(wordCountAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [wordCount, wordCountAnim]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const buildNextDraftResponses = () => {
    const sourceDrafts = route.params?.draftResponses || resumeState?.draftResponses || draftResponses;
    const nextDrafts = [...sourceDrafts];
    nextDrafts[taskIndex] = {
      title: currentTask.title,
      taskType: currentTask.taskType || 'Task',
      prompt: currentTask.prompt,
      essay: essay.trim(),
      level: currentTask.level || test.level || 'B2',
      minWords,
      timeLimit: currentTask.timeLimit || 0,
      wordCount,
    };
    return nextDrafts;
  };

  useEffect(() => {
    const persistState = async () => {
      if (loading) return;
      const nextDraftResponses = buildNextDraftResponses();

      await savePracticeState('writing', testStorageKey, {
        testId: testStorageKey,
        title: test.title,
        level: test.level,
        taskIndex,
        timeLeft,
        draftResponses: nextDraftResponses,
      });

      if (fullMockMode) {
        await updateFullMockProgress('writing', {
          status: 'in_progress',
          taskIndex,
          timeLeft,
          draftResponses: nextDraftResponses,
        });
      }
    };

    persistState().catch(() => {});
  }, [essay, timeLeft, taskIndex, loading, fullMockMode]);

  const handleGoToPreviousTask = () => {
    if (!hasPreviousTask || loading) return;

    clearInterval(timerRef.current);
    const nextDrafts = buildNextDraftResponses();
    const state = navigation.getState();
    const routes = state?.routes || [];
    const previousRoute = routes[routes.length - 2];

    if (previousRoute?.key) {
      navigation.dispatch({
        ...CommonActions.setParams({ draftResponses: nextDrafts }),
        source: previousRoute.key,
      });
    }

    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!essay.trim() || loading) return;

    const nextDrafts = buildNextDraftResponses();

    if (!isLastTask) {
      clearInterval(timerRef.current);
      navigation.push(fullMockMode ? 'FullMockWritingCompose' : 'WritingCompose', {
        test,
        taskIndex: taskIndex + 1,
        draftResponses: nextDrafts,
        fullMockMode,
        fullMockSessionId: route.params?.fullMockSessionId,
      });
      return;
    }

    if (fullMockMode) {
      await clearPracticeState('writing', testStorageKey);
      await updateFullMockProgress('writing', {
        status: 'completed',
        taskIndex,
        timeLeft,
        draftResponses: nextDrafts,
        completedAt: new Date().toISOString(),
      });
      navigation.replace('MockTestHub', {
        sessionId: route.params?.fullMockSessionId,
        justCompleted: 'writing',
      });
      return;
    }

    setLoading(true);
    clearInterval(timerRef.current);

    try {
      const res = await scoreWritingTest({
        testTitle: test.title,
        level: test.level || currentTask.level || 'B2',
        tasks: nextDrafts.map((task) => ({
          title: task.title,
          taskType: task.taskType,
          prompt: task.prompt,
          essay: task.essay,
          level: task.level,
        })),
      });

      await clearPracticeState('writing', testStorageKey);

      navigation.replace('WritingResult', {
        result: res.data.data,
        test,
        draftResponses: nextDrafts,
      });
    } catch (e) {
      setLoading(false);
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể chấm bài. Thử lại.');
    }
  };

  const handleClose = () => {
    Alert.alert('Thoát bài viết?', 'Tiến trình hiện tại sẽ được lưu tạm để bạn tiếp tục sau.', [
      { text: 'Tiếp tục viết', style: 'cancel' },
      {
        text: 'Thoát',
        style: 'destructive',
        onPress: () => {
          clearInterval(timerRef.current);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleHeaderLeftPress = () => {
    if (hasPreviousTask) {
      handleGoToPreviousTask();
      return;
    }

    handleClose();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? theme.background : '#FBE9E7' }]}>
          <ActivityIndicator size="large" color="#E65100" />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#FF9800' : '#E65100' }]}>AI đang chấm toàn bộ bài viết...</Text>
          <Text style={[styles.loadingSubText, { color: isDarkMode ? '#FFB74D' : '#BF360C' }]}>
            Đang xử lý {tasks.length} task của {test.title}
          </Text>
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
        <View style={[styles.timerBadge, { backgroundColor: isDarkMode ? '#2A1A0F' : '#FFF3E0' }]}>
          <Ionicons name="flame" size={16} color={isDarkMode ? '#FF9800' : '#E65100'} />
          <Text style={[styles.timerText, { color: isDarkMode ? '#FF9800' : '#E65100' }]}>{formatTime(timeLeft)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.submitHeaderBtn,
            { backgroundColor: isDarkMode ? '#FF9800' : '#E65100' },
            !essay.trim() && (isDarkMode ? { backgroundColor: '#333' } : styles.submitHeaderBtnDisabled)
          ]}
          onPress={handleSubmit}
          disabled={!essay.trim()}
        >
          <Text style={[
            styles.submitHeaderText,
            !essay.trim() && (isDarkMode ? { color: '#666' } : styles.submitHeaderTextDisabled)
          ]}>
            {isLastTask ? 'Nộp bài' : 'Lưu & tiếp'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.promptCard,
            {
              backgroundColor: isDarkMode ? '#2D1B0F' : '#FFF3E0',
              borderColor: isDarkMode ? '#4D2A10' : '#FFE0B2',
            }
          ]}>
            <View style={styles.promptTopRow}>
              <View style={[styles.taskTag, { backgroundColor: isDarkMode ? '#FF9800' : '#E65100' }]}>
                <Text style={styles.taskTagText}>{currentTask.taskType || 'Task'}</Text>
              </View>
              <Text style={[styles.promptMeta, { color: theme.textSecondary }]}>Task {taskIndex + 1}/{tasks.length}</Text>
              <Text style={[styles.promptMeta, { color: theme.textSecondary }]}>• Tối thiểu {minWords} từ</Text>
            </View>
            <Text style={[styles.promptText, { color: isDarkMode ? '#FFE0B2' : '#5D4037' }]}>{currentTask.prompt}</Text>
          </View>

          <View style={[
            styles.noticeCard,
            {
              backgroundColor: isDarkMode ? '#23150D' : '#FFF8F2',
              borderColor: isDarkMode ? '#3E200B' : '#FFE0B2',
            }
          ]}>
            <Ionicons name="information-circle" size={18} color={isDarkMode ? '#FF9800' : '#E65100'} />
            <Text style={[styles.noticeText, { color: isDarkMode ? '#FFB74D' : '#8D5A2B' }]}>
              {isLastTask
                ? 'Sau khi nộp Task cuối, hệ thống sẽ chấm tổng cho cả bài Writing.'
                : 'Task này sẽ được lưu tạm. Bạn sẽ làm tiếp Task sau trước khi nộp toàn bộ bài.'}
            </Text>
          </View>

          <View style={styles.essayContainer}>
            <TextInput
              style={[
                styles.essayInput,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                }
              ]}
              value={essay}
              onChangeText={setEssay}
              multiline
              placeholder="Bắt đầu viết bài của bạn tại đây..."
              placeholderTextColor={theme.placeholder}
              textAlignVertical="top"
              autoCorrect={false}
            />

            <Animated.View
              style={[
                styles.wordCountPill,
                {
                  transform: [{ scale: wordCountAnim }],
                  backgroundColor: isDarkMode ? '#FF9800' : '#E65100',
                }
              ]}
            >
              <Ionicons name="create" size={12} color="#fff" />
              <Text style={styles.wordCountPillText}>
                {wordCount} / {minWords} từ
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBE9E7',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: { fontSize: 16, fontWeight: '700', color: '#E65100' },
  loadingSubText: { fontSize: 13, color: '#BF360C', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 18 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    backgroundColor: '#fff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: { fontSize: 16, fontWeight: '800', color: '#E65100' },
  submitHeaderBtn: {
    backgroundColor: '#E65100',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitHeaderBtnDisabled: { backgroundColor: '#E0E0E0' },
  submitHeaderText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  submitHeaderTextDisabled: { color: '#9E9E9E' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  promptCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  promptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  taskTag: { backgroundColor: '#E65100', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  taskTagText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  promptMeta: { fontSize: 13, color: '#757575', fontWeight: '500' },
  promptText: { fontSize: 14, color: '#5D4037', lineHeight: 23, fontStyle: 'italic' },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 20, color: '#8D5A2B' },
  essayContainer: { position: 'relative', marginBottom: 12 },
  essayInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 26,
    minHeight: 340,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  wordCountPill: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E65100',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  wordCountPillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
