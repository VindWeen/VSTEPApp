import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { savePracticeState } from '../../utils/practiceState';
import { updateFullMockProgress } from '../../utils/fullMockTest';
import { useTheme } from '../../context/ThemeContext';
import { CommonActions } from '@react-navigation/native';

const PREP_TIME = 28;

const MOCK_TASK = {
  _id: '1',
  prompt: 'Describe a place in your city that you enjoy visiting.',
  followUpQuestions: ['Where is it?', 'Why do you like it?', 'How often do you go there?'],
};

export default function SpeakingPrepScreen({ route, navigation }) {
  const { isDarkMode, theme } = useTheme();
  const test = route.params?.test || { tasks: [MOCK_TASK] };
  const taskIndex = route.params?.taskIndex || 0;
  const resumeState = route.params?.resumeState || null;
  const fullMockMode = route.params?.fullMockMode || false;
  const draftResponses = route.params?.draftResponses || resumeState?.draftResponses || [];
  const testStorageKey = test._id || test.title;
  const tasks = test.tasks || [test];
  const currentTask = tasks[taskIndex] || tasks[0];
  const hasPreviousTask = taskIndex > 0;
  const currentDraft = draftResponses[taskIndex];
  const hints = currentTask.cueCard?.length
    ? currentTask.cueCard
    : currentTask.followUpQuestions?.length
      ? currentTask.followUpQuestions
      : MOCK_TASK.followUpQuestions;

  const [timeLeft, setTimeLeft] = useState(
    resumeState?.screen === 'prep' ? resumeState?.timeLeft || PREP_TIME : PREP_TIME
  );
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleStartRecording = useCallback((autoStart = false) => {
    navigation.replace(fullMockMode ? 'FullMockSpeakingRecord' : 'SpeakingRecord', {
      ...(fullMockMode ? { fullMockMode, fullMockSessionId: route.params?.fullMockSessionId } : {}),
      test,
      taskIndex,
      draftResponses,
      resumeState,
      autoStartRecording: autoStart,
    });
  }, [navigation, fullMockMode, route.params?.fullMockSessionId, test, taskIndex, draftResponses, resumeState]);

  const handleStartRecordingRef = useRef(handleStartRecording);
  useEffect(() => {
    handleStartRecordingRef.current = handleStartRecording;
  }, [handleStartRecording]);

  useEffect(() => {
    setTimeLeft(
      resumeState?.screen === 'prep' && resumeState?.taskIndex === taskIndex
        ? resumeState?.timeLeft || PREP_TIME
        : PREP_TIME
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    pulse.start();

    timerRef.current = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timerRef.current);
          pulse.stop();
          setTimeout(() => {
            handleStartRecordingRef.current(true);
          }, 0);
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      pulse.stop();
    };
  }, [taskIndex, pulseAnim]);

  useEffect(() => {
    savePracticeState('speaking', testStorageKey, {
      testId: testStorageKey,
      title: test.title,
      level: test.level,
      screen: 'prep',
      taskIndex,
      draftResponses,
      timeLeft,
    }).catch(() => {});

    if (fullMockMode) {
      updateFullMockProgress('speaking', {
        status: 'in_progress',
        screen: 'prep',
        taskIndex,
        draftResponses,
        timeLeft,
      }).catch(() => {});
    }
  }, [taskIndex, draftResponses, timeLeft]);

  const handleHeaderLeftPress = () => {
    if (hasPreviousTask) {
      const state = navigation.getState();
      const routes = state?.routes || [];
      const previousRoute = routes[routes.length - 2];
      const prevRouteName = previousRoute?.name;
      const targetRoute = fullMockMode ? 'FullMockSpeakingRecord' : 'SpeakingRecord';

      if (previousRoute && prevRouteName === targetRoute) {
        navigation.dispatch({
          ...CommonActions.setParams({ draftResponses }),
          source: previousRoute.key,
        });
        navigation.goBack();
      } else {
        navigation.replace(targetRoute, {
          ...(fullMockMode ? { fullMockMode, fullMockSessionId: route.params?.fullMockSessionId } : {}),
          test,
          taskIndex: taskIndex - 1,
          draftResponses,
          resumeState,
          animationDirection: 'back',
        });
      }
      return;
    }

    const targetRoute = fullMockMode ? 'MockTestHub' : 'SpeakingList';
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(targetRoute, { animationDirection: 'back' });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? theme.background : '#fff'} />

      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]} onPress={handleHeaderLeftPress}>
          <Ionicons name={hasPreviousTask ? 'arrow-back' : 'close'} size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Chuẩn bị</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.timerSection}>
        <Animated.View style={[
          styles.timerOuter,
          {
            transform: [{ scale: pulseAnim }],
            borderColor: isDarkMode ? '#8E24AA' : '#CE93D8',
            backgroundColor: isDarkMode ? '#2D1F35' : '#F3E5F5',
          }
        ]}>
          <View style={styles.timerInner}>
            <Text style={[styles.timerNum, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>{timeLeft}</Text>
            <Text style={[styles.timerLabel, { color: isDarkMode ? '#D1C4E9' : '#9575CD' }]}>giây chuẩn bị</Text>
          </View>
        </Animated.View>
        <Text style={[styles.partLabel, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>{currentTask.partType || `Part ${taskIndex + 1}`}</Text>
      </View>

      <View style={[styles.taskCard, { backgroundColor: theme.card, borderColor: isDarkMode ? '#8E24AA' : '#CE93D8' }]}>
        <Text style={[styles.taskPrompt, { color: theme.text }]}>{currentTask.prompt || MOCK_TASK.prompt}</Text>
      </View>

      {currentDraft ? (
        <View style={[
          styles.savedCard,
          {
            backgroundColor: isDarkMode ? '#1B2E1C' : '#E8F5E9',
            borderColor: isDarkMode ? '#2E4C30' : '#C8E6C9',
          }
        ]}>
          <Ionicons name="checkmark-circle" size={18} color={isDarkMode ? '#81C784' : '#2E7D32'} />
          <Text style={[styles.savedText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>
            Part này đã có bản ghi. Bạn có thể vào nghe lại hoặc ghi âm lại.
          </Text>
        </View>
      ) : null}

      <View style={[styles.hintsCard, { backgroundColor: isDarkMode ? '#2A1D30' : '#F3E5F5' }]}>
        <Text style={[styles.hintsTitle, { color: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>Gợi ý</Text>
        {hints.map((hint, index) => (
          <View key={`${hint}-${index}`} style={styles.hintItem}>
            <View style={[styles.hintBullet, { backgroundColor: isDarkMode ? '#E040FB' : '#6A1B9A' }]}>
              <Text style={styles.hintBulletText}>{index + 1}</Text>
            </View>
            <Text style={[styles.hintText, { color: isDarkMode ? '#D1C4E9' : '#4A148C' }]}>{hint}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: isDarkMode ? '#E040FB' : '#6A1B9A' }]}
          onPress={() => handleStartRecording(false)}
        >
          <Ionicons name={currentDraft ? 'play-circle' : 'mic'} size={20} color="#fff" />
          <Text style={styles.startBtnText}>
            {currentDraft ? 'Vào part này' : 'Bắt đầu ghi âm'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
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
  placeholder: { width: 36 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  timerSection: { alignItems: 'center', paddingVertical: 32 },
  timerOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#CE93D8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
  },
  timerInner: { alignItems: 'center' },
  timerNum: { fontSize: 52, fontWeight: '900', color: '#6A1B9A' },
  timerLabel: { fontSize: 13, color: '#9575CD', fontWeight: '500', marginTop: 2 },
  partLabel: { marginTop: 16, fontSize: 14, fontWeight: '700', color: '#6A1B9A' },
  taskCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#CE93D8',
  },
  taskPrompt: { fontSize: 15, color: '#1A1A2E', lineHeight: 24, fontStyle: 'italic' },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  savedText: { flex: 1, fontSize: 13, color: '#2E7D32', lineHeight: 19, fontWeight: '600' },
  hintsCard: { marginHorizontal: 20, backgroundColor: '#F3E5F5', borderRadius: 16, padding: 16 },
  hintsTitle: { fontSize: 14, fontWeight: '700', color: '#6A1B9A', marginBottom: 12 },
  hintItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  hintBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6A1B9A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintBulletText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  hintText: { fontSize: 14, color: '#4A148C', fontWeight: '500', flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6A1B9A',
    borderRadius: 16,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
