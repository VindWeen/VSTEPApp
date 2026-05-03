import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { scoreWriting } from '../../services/api';

const LEVELS = ['A2', 'B1', 'B2', 'C1'];
const TASK_TYPES = ['Task 1', 'Task 2'];

const SAMPLE_PROMPT = 'Some people think that social media has more negative effects than positive ones. Discuss both views and give your own opinion.';

export default function WritingScreen({ navigation }) {
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT);
  const [essay, setEssay] = useState('');
  const [level, setLevel] = useState('B1');
  const [taskType, setTaskType] = useState('Task 2');
  const [loading, setLoading] = useState(false);

  const wordCount = (essay.match(/\S+/g) || []).length;
  const minWords = taskType === 'Task 1' ? 150 : 250;
  const isReady = wordCount >= minWords;

  const handleSubmit = async () => {
    if (!essay.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập bài viết của bạn');
    setLoading(true);
    try {
      const res = await scoreWriting({ prompt, essay, level, taskType });
      navigation.navigate('WritingResult', {
        result: res.data.data,
        prompt,
        essay,
        level,
        taskType,
      });
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể chấm bài. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✍️ Luyện Viết</Text>
        <Text style={styles.headerSub}>AI chấm điểm theo tiêu chí VSTEP</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Level & Task type */}
        <View style={styles.row}>
          <View style={styles.selectorGroup}>
            <Text style={styles.selectorLabel}>Trình độ</Text>
            <View style={styles.chipRow}>
              {LEVELS.map((l) => (
                <TouchableOpacity key={l} style={[styles.chip, level === l && styles.chipActive]} onPress={() => setLevel(l)}>
                  <Text style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.selectorGroup}>
            <Text style={styles.selectorLabel}>Loại đề</Text>
            <View style={styles.chipRow}>
              {TASK_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, taskType === t && styles.chipActive]} onPress={() => setTaskType(t)}>
                  <Text style={[styles.chipText, taskType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Prompt */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📋 Đề bài</Text>
          <TextInput
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            placeholder="Nhập đề bài hoặc dùng đề mẫu..."
            textAlignVertical="top"
          />
        </View>

        {/* Essay */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>📝 Bài viết của bạn</Text>
            <Text style={[styles.wordCount, isReady ? styles.wordCountOk : styles.wordCountLow]}>
              {wordCount}/{minWords}+ từ
            </Text>
          </View>
          <TextInput
            style={styles.essayInput}
            value={essay}
            onChangeText={setEssay}
            multiline
            placeholder={`Nhập bài viết tối thiểu ${minWords} từ...`}
            textAlignVertical="top"
          />
          {!isReady && wordCount > 0 && (
            <Text style={styles.hintText}>
              Cần thêm {minWords - wordCount} từ nữa để đủ yêu cầu
            </Text>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tiêu chí chấm điểm VSTEP Writing</Text>
          {['Task Achievement – Hoàn thành yêu cầu đề',
            'Coherence & Cohesion – Liên kết ý tưởng',
            'Lexical Resource – Từ vựng đa dạng',
            'Grammatical Range – Cấu trúc ngữ pháp'].map((tip) => (
            <Text key={tip} style={styles.tipItem}>• {tip}</Text>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!essay.trim() || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!essay.trim() || loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitBtnText}>  AI đang chấm bài...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>
              🤖 Chấm điểm bằng AI{!isReady ? ' (thiếu từ)' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#00695C', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: '#B2DFDB', marginTop: 4 },
  scroll: { flex: 1, backgroundColor: '#F5F7FA' },
  row: { flexDirection: 'row', padding: 16, gap: 12 },
  selectorGroup: { flex: 1 },
  selectorLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#DDD', backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#00695C', borderColor: '#00695C' },
  chipText: { color: '#555', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  wordCount: { fontSize: 13, fontWeight: '700' },
  wordCountOk: { color: '#2E7D32' },
  wordCountLow: { color: '#E53935' },
  promptInput: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 14,
    borderWidth: 1, borderColor: '#E0E0E0', minHeight: 100, lineHeight: 22,
  },
  essayInput: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 14,
    borderWidth: 1.5, borderColor: '#B2DFDB', minHeight: 220, lineHeight: 24,
  },
  hintText: { color: '#E53935', fontSize: 12, marginTop: 6 },
  tipsCard: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#E8F5E9',
    borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: '#00695C',
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#00695C', marginBottom: 8 },
  tipItem: { color: '#555', fontSize: 13, marginBottom: 4 },
  submitBtn: {
    marginHorizontal: 16, backgroundColor: '#00695C', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#BDBDBD' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
});
