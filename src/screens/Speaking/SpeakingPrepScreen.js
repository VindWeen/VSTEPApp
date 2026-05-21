import React, { useEffect, useRef, useState } from 'react';
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

const PREP_TIME = 28;

const MOCK_TASK = {
  _id: '1',
  prompt: 'Describe a place in your city that you enjoy visiting.',
  followUpQuestions: ['Where is it?', 'Why do you like it?', 'How often do you go there?'],
};

export default function SpeakingPrepScreen({ route, navigation }) {
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
      navigation.replace(fullMockMode ? 'FullMockSpeakingRecord' : 'SpeakingRecord', {
        ...(fullMockMode ? { fullMockMode, fullMockSessionId: route.params?.fullMockSessionId } : {}),
        test,
        taskIndex: taskIndex - 1,
        draftResponses,
        resumeState,
      });
      return;
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleHeaderLeftPress}>
          <Ionicons name={hasPreviousTask ? 'arrow-back' : 'close'} size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuẩn bị</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.timerSection}>
        <Animated.View style={[styles.timerOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.timerInner}>
            <Text style={styles.timerNum}>{timeLeft}</Text>
            <Text style={styles.timerLabel}>giây chuẩn bị</Text>
          </View>
        </Animated.View>
        <Text style={styles.partLabel}>{currentTask.partType || `Part ${taskIndex + 1}`}</Text>
      </View>

      <View style={styles.taskCard}>
        <Text style={styles.taskPrompt}>{currentTask.prompt || MOCK_TASK.prompt}</Text>
      </View>

      {currentDraft ? (
        <View style={styles.savedCard}>
          <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
          <Text style={styles.savedText}>Part này đã có bản ghi. Bạn có thể vào nghe lại hoặc ghi âm lại.</Text>
        </View>
      ) : null}

      <View style={styles.hintsCard}>
        <Text style={styles.hintsTitle}>Gợi ý</Text>
        {hints.map((hint, index) => (
          <View key={`${hint}-${index}`} style={styles.hintItem}>
            <View style={styles.hintBullet}>
              <Text style={styles.hintBulletText}>{index + 1}</Text>
            </View>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() =>
            navigation.navigate(fullMockMode ? 'FullMockSpeakingRecord' : 'SpeakingRecord', {
              ...(fullMockMode ? { fullMockMode, fullMockSessionId: route.params?.fullMockSessionId } : {}),
              test,
              taskIndex,
              draftResponses,
              resumeState,
            })
          }
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
