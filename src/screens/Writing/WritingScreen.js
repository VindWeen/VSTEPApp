import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scoreWriting } from '../../services/api';

const TOTAL_TIME = 40 * 60; // 40 minutes

const MOCK_TEST = {
  _id: 'mock1',
  title: 'Writing Task 2: Môi trường và Xã hội',
  level: 'B2',
  taskType: 'Task 2',
  minWords: 250,
  duration: 40,
  prompt: '"Some people believe that environmental protection should be the responsibility of governments, while others think individuals must take action. Discuss both views and give your opinion."',
};

export default function WritingScreen({ route, navigation }) {
  const test = route.params?.test || MOCK_TEST;
  const minWords = test.minWords || (test.taskType === 'Task 1' ? 150 : 250);

  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef(null);
  const wordCountAnim = useRef(new Animated.Value(1)).current;

  const wordCount = (essay.match(/\S+/g) || []).length;
  const isReady = wordCount >= minWords;
  const wordProgress = Math.min(wordCount / minWords, 1);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Pulse animation when word count changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(wordCountAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(wordCountAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [wordCount]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleSubmit = async (auto = false) => {
    if (!essay.trim()) return;
    if (loading) return;
    setLoading(true);
    clearInterval(timerRef.current);
    try {
      const res = await scoreWriting({
        prompt: test.prompt || MOCK_TEST.prompt,
        essay,
        level: test.level || 'B2',
        taskType: test.taskType || 'Task 2',
      });
      navigation.replace('WritingResult', {
        result: res.data.data,
        prompt: test.prompt || MOCK_TEST.prompt,
        essay,
        level: test.level || 'B2',
        taskType: test.taskType || 'Task 2',
        test,
      });
    } catch (e) {
      setLoading(false);
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể chấm bài. Thử lại.');
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Thoát bài viết?',
      'Bài viết của bạn sẽ không được lưu.',
      [
        { text: 'Tiếp tục viết', style: 'cancel' },
        { text: 'Thoát', style: 'destructive', onPress: () => { clearInterval(timerRef.current); navigation.goBack(); } },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E65100" />
          <Text style={styles.loadingText}>AI đang chấm bài viết...</Text>
          <Text style={styles.loadingSubText}>Phân tích {wordCount} từ của bạn</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={[styles.timerBadge, timeLeft < 300 && styles.timerBadgeWarning]}>
          <Ionicons name="flame" size={16} color={timeLeft < 300 ? '#fff' : '#E65100'} />
          <Text style={[styles.timerText, timeLeft < 300 && styles.timerTextWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submitHeaderBtn, !essay.trim() && styles.submitHeaderBtnDisabled]}
          onPress={() => handleSubmit(false)}
          disabled={!essay.trim()}
        >
          <Text style={[styles.submitHeaderText, !essay.trim() && styles.submitHeaderTextDisabled]}>
            Nộp bài
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Task Prompt Card */}
          <View style={styles.promptCard}>
            <View style={styles.promptTopRow}>
              <View style={styles.taskTag}>
                <Text style={styles.taskTagText}>{test.taskType || 'TASK 2'}</Text>
              </View>
              <Text style={styles.promptMinWords}>• Min {minWords} words</Text>
            </View>
            <Text style={styles.promptText}>{test.prompt || MOCK_TEST.prompt}</Text>
          </View>

          {/* Essay Input */}
          <View style={styles.essayContainer}>
            <TextInput
              style={styles.essayInput}
              value={essay}
              onChangeText={setEssay}
              multiline
              placeholder="Bắt đầu viết bài của bạn tại đây..."
              placeholderTextColor="#BDBDBD"
              textAlignVertical="top"
              autoCorrect={false}
            />

            {/* Word count pill */}
            <Animated.View style={[
              styles.wordCountPill,
              { transform: [{ scale: wordCountAnim }] },
              isReady && styles.wordCountPillDone,
            ]}>
              <Ionicons name="create" size={12} color="#fff" />
              <Text style={styles.wordCountPillText}>{wordCount} / {minWords} từ</Text>
            </Animated.View>
          </View>




          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBE9E7', gap: 12,
  },
  loadingText: { fontSize: 16, fontWeight: '700', color: '#E65100' },
  loadingSubText: { fontSize: 13, color: '#BF360C' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 18 : 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5', backgroundColor: '#fff',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF3E0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  timerBadgeWarning: { backgroundColor: '#E65100' },
  timerText: { fontSize: 16, fontWeight: '800', color: '#E65100' },
  timerTextWarning: { color: '#fff' },
  submitHeaderBtn: {
    backgroundColor: '#E65100', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#E65100', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitHeaderBtnDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0 },
  submitHeaderText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  submitHeaderTextDisabled: { color: '#9E9E9E' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  promptCard: {
    backgroundColor: '#FFF3E0', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  promptTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  taskTag: {
    backgroundColor: '#E65100', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  taskTagText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  promptMinWords: { fontSize: 13, color: '#757575', fontWeight: '500' },
  promptText: { fontSize: 14, color: '#5D4037', lineHeight: 23, fontStyle: 'italic' },

  essayContainer: { position: 'relative', marginBottom: 12 },
  essayInput: {
    backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16,
    fontSize: 15, color: '#1A1A2E', lineHeight: 26,
    minHeight: 340, borderWidth: 1, borderColor: '#E0E0E0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  wordCountPill: {
    position: 'absolute', bottom: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E65100', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    shadowColor: '#E65100', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  wordCountPillDone: { backgroundColor: '#2E7D32' },
  wordCountPillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
