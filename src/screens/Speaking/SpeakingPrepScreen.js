import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PREP_TIME = 28; // seconds

const MOCK_TASK = {
  _id: '1',
  prompt: '"Describe a place in your city that you enjoy visiting. Why do you like it? How often do you go there?"',
  level: 'B1',
  duration: 90,
  title: 'Speaking Task 1: Describe a place',
  hints: ['Giới thiệu địa điểm', 'Lý do yêu thích', 'Tần suất và cảm xúc'],
};

export default function SpeakingPrepScreen({ route, navigation }) {
  const test = route.params?.test || MOCK_TASK;
  const [timeLeft, setTimeLeft] = useState(PREP_TIME);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the timer circle
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulse.start();

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          pulse.stop();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      pulse.stop();
    };
  }, []);

  const progress = (PREP_TIME - timeLeft) / PREP_TIME;

  const handleStartRecord = () => {
    clearInterval(timerRef.current);
    navigation.navigate('SpeakingRecord', { test });
  };

  const handleClose = () => {
    clearInterval(timerRef.current);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuẩn bị</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Timer circle */}
      <View style={styles.timerSection}>
        <Animated.View style={[styles.timerOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.timerInner}>
            <Text style={styles.timerNum}>{timeLeft}</Text>
            <Text style={styles.timerLabel}>giây chuẩn bị</Text>
          </View>
        </Animated.View>
        <View style={styles.readHintRow}>
          <Ionicons name="timer-outline" size={14} color="#6A1B9A" />
          <Text style={styles.readHintText}>Đọc kỹ đề trước khi ghi âm</Text>
        </View>
      </View>

      {/* Task prompt */}
      <View style={styles.taskCard}>
        <Text style={styles.taskLabel}>ĐỀ BÀI</Text>
        <Text style={styles.taskPrompt}>{test.prompt || MOCK_TASK.prompt}</Text>
      </View>

      {/* Hints */}
      <View style={styles.hintsCard}>
        <View style={styles.hintsHeader}>
          <Ionicons name="bulb-outline" size={16} color="#6A1B9A" />
          <Text style={styles.hintsTitle}>Gợi ý cấu trúc</Text>
        </View>
        {(test.hints || MOCK_TASK.hints).map((h, i) => (
          <View key={i} style={styles.hintItem}>
            <View style={styles.hintBullet}>
              <Text style={styles.hintBulletText}>{i + 1}</Text>
            </View>
            <Text style={styles.hintText}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Start recording button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, timeLeft > 0 && styles.startBtnDisabled]}
          onPress={handleStartRecord}
          disabled={false} // allow early start too
          activeOpacity={0.85}
        >
          <Ionicons name="mic" size={20} color={timeLeft > 0 ? '#9E9E9E' : '#fff'} />
          <Text style={[styles.startBtnText, timeLeft > 0 && styles.startBtnTextDisabled]}>
            Bắt đầu ghi âm
          </Text>
        </TouchableOpacity>
        {timeLeft > 0 && (
          <Text style={styles.waitHint}>Nút sẽ kích hoạt sau khi hết giờ chuẩn bị</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

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

  timerSection: { alignItems: 'center', paddingVertical: 32 },
  timerOuter: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 3, borderColor: '#CE93D8', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F3E5F5',
  },
  timerInner: { alignItems: 'center' },
  timerNum: { fontSize: 52, fontWeight: '900', color: '#6A1B9A' },
  timerLabel: { fontSize: 13, color: '#9575CD', fontWeight: '500', marginTop: 2 },
  readHintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F3E5F5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    marginTop: 16,
  },
  readHintText: { fontSize: 13, color: '#6A1B9A', fontWeight: '600' },

  taskCard: {
    marginHorizontal: 20, marginBottom: 14, backgroundColor: '#fff',
    borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#CE93D8',
    shadowColor: '#6A1B9A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
    shadowRadius: 6, elevation: 2,
  },
  taskLabel: {
    fontSize: 11, fontWeight: '800', color: '#6A1B9A', letterSpacing: 1, marginBottom: 8,
  },
  taskPrompt: { fontSize: 15, color: '#1A1A2E', lineHeight: 24, fontStyle: 'italic' },

  hintsCard: {
    marginHorizontal: 20, backgroundColor: '#F3E5F5',
    borderRadius: 16, padding: 16,
  },
  hintsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  hintsTitle: { fontSize: 14, fontWeight: '700', color: '#6A1B9A' },
  hintItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  hintBullet: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#6A1B9A',
    justifyContent: 'center', alignItems: 'center',
  },
  hintBulletText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  hintText: { fontSize: 14, color: '#4A148C', fontWeight: '500' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0F2F5',
    alignItems: 'center',
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#6A1B9A',
    borderRadius: 16, paddingVertical: 15, width: '100%', justifyContent: 'center',
    shadowColor: '#6A1B9A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  startBtnDisabled: { backgroundColor: '#EDE7F6', shadowOpacity: 0 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  startBtnTextDisabled: { color: '#9E9E9E' },
  waitHint: { fontSize: 12, color: '#9E9E9E', marginTop: 8, textAlign: 'center' },
});
