import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  adminCreateQuestion,
  adminCreateSpeakingPrompt,
  adminCreateWritingPrompt,
  adminDeleteQuestion,
  adminDeleteSpeakingPrompt,
  adminDeleteWritingPrompt,
  adminGetQuestions,
  adminGetSpeakingPrompts,
  adminGetWritingPrompts,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const sections = [
  { key: 'listening', label: 'Listening', color: '#1565C0' },
  { key: 'reading', label: 'Reading', color: '#2E7D32' },
  { key: 'writing', label: 'Writing', color: '#E65100' },
  { key: 'speaking', label: 'Speaking', color: '#6A1B9A' },
];

const listeningTemplate = `{
  "level": "B1",
  "title": "De Nghe 01",
  "description": "Bai nghe gom 3 phan",
  "duration": 25,
  "totalQuestions": 15,
  "parts": []
}`;

const readingTemplate = `{
  "level": "B1",
  "title": "De Doc 01",
  "description": "Bai doc gom 3 phan",
  "duration": 35,
  "totalQuestions": 20,
  "parts": []
}`;

const initialWritingForm = {
  level: 'B1',
  title: '',
  taskType: 'Task 1',
  timeLimit: '20',
  minWords: '120',
  prompt: '',
  notes: '',
  sampleOutline: '',
};

const initialSpeakingForm = {
  level: 'B1',
  title: '',
  partType: 'Part 1',
  timeLimit: '2',
  prompt: '',
  cueCard: '',
  followUpQuestions: '',
  notes: '',
};

function SectionButton({ item, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.sectionBtn,
        active && { backgroundColor: item.color, borderColor: item.color },
      ]}
    >
      <Text style={[styles.sectionBtnText, active && styles.sectionBtnTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

function InfoCard({ title, value, color }) {
  return (
    <View style={[styles.infoCard, { borderLeftColor: color }]}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('listening');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonInput, setJsonInput] = useState(listeningTemplate);
  const [writingForm, setWritingForm] = useState(initialWritingForm);
  const [speakingForm, setSpeakingForm] = useState(initialSpeakingForm);

  useEffect(() => {
    if (activeSection === 'listening') setJsonInput(listeningTemplate);
    if (activeSection === 'reading') setJsonInput(readingTemplate);
  }, [activeSection]);

  useEffect(() => {
    loadItems();
  }, [activeSection]);

  const loadItems = async () => {
    setLoading(true);
    try {
      let res;
      if (activeSection === 'writing') {
        res = await adminGetWritingPrompts();
      } else if (activeSection === 'speaking') {
        res = await adminGetSpeakingPrompts();
      } else {
        res = await adminGetQuestions(activeSection);
      }
      setItems(res.data?.data || []);
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không tải được dữ liệu admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa mục này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            if (activeSection === 'writing') {
              await adminDeleteWritingPrompt(id);
            } else if (activeSection === 'speaking') {
              await adminDeleteSpeakingPrompt(id);
            } else {
              await adminDeleteQuestion(activeSection, id);
            }
            loadItems();
          } catch (error) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Xóa thất bại');
          }
        },
      },
    ]);
  };

  const submitJson = async () => {
    setSaving(true);
    try {
      const payload = JSON.parse(jsonInput);
      await adminCreateQuestion(activeSection, payload);
      Alert.alert('Thành công', 'Đã tạo đề mới');
      setJsonInput(activeSection === 'listening' ? listeningTemplate : readingTemplate);
      loadItems();
    } catch (error) {
      const message =
        error instanceof SyntaxError
          ? 'JSON chưa hợp lệ'
          : error.response?.data?.message || 'Tạo đề thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setSaving(false);
    }
  };

  const submitWriting = async () => {
    setSaving(true);
    try {
      await adminCreateWritingPrompt({
        ...writingForm,
        timeLimit: Number(writingForm.timeLimit),
        minWords: Number(writingForm.minWords),
      });
      Alert.alert('Thành công', 'Đã tạo đề Writing');
      setWritingForm(initialWritingForm);
      loadItems();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Tạo đề Writing thất bại');
    } finally {
      setSaving(false);
    }
  };

  const submitSpeaking = async () => {
    setSaving(true);
    try {
      await adminCreateSpeakingPrompt({
        ...speakingForm,
        timeLimit: Number(speakingForm.timeLimit),
        cueCard: speakingForm.cueCard,
        followUpQuestions: speakingForm.followUpQuestions,
      });
      Alert.alert('Thành công', 'Đã tạo đề Speaking');
      setSpeakingForm(initialSpeakingForm);
      loadItems();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Tạo đề Speaking thất bại');
    } finally {
      setSaving(false);
    }
  };

  const activeMeta = sections.find((item) => item.key === activeSection);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Từ chối truy cập', 'Bạn không có quyền vào khu quản trị.');
      navigation.goBack();
    }
  }, [navigation, user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản Trị Đề Thi</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Admin Panel</Text>
          <Text style={styles.heroTitle}>Thêm nhanh đề mới và kiểm soát ngân hàng đề.</Text>
          <Text style={styles.heroText}>
            Listening và Reading dùng JSON có cấu trúc. Writing và Speaking có form nhập trực tiếp.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionRow}>
          {sections.map((item) => (
            <SectionButton
              key={item.key}
              item={item}
              active={activeSection === item.key}
              onPress={() => setActiveSection(item.key)}
            />
          ))}
        </ScrollView>

        <View style={styles.infoRow}>
          <InfoCard title="Nhóm đang sửa" value={activeMeta.label} color={activeMeta.color} />
          <InfoCard title="Số lượng hiện có" value={String(items.length)} color={activeMeta.color} />
        </View>

        {(activeSection === 'listening' || activeSection === 'reading') && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Tạo đề bằng JSON</Text>
            <Text style={styles.panelHint}>
              Dán payload đúng schema backend. Trường `skill` sẽ được server tự gắn theo nhóm đang chọn.
            </Text>
            <TextInput
              style={styles.codeInput}
              multiline
              textAlignVertical="top"
              value={jsonInput}
              onChangeText={setJsonInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: activeMeta.color }]}
              onPress={submitJson}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Tạo đề</Text>}
            </TouchableOpacity>
          </View>
        )}

        {activeSection === 'writing' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Tạo đề Writing</Text>
            <TextInput style={styles.input} placeholder="Title" value={writingForm.title} onChangeText={(v) => setWritingForm((s) => ({ ...s, title: v }))} />
            <TextInput style={styles.input} placeholder="Level" value={writingForm.level} onChangeText={(v) => setWritingForm((s) => ({ ...s, level: v }))} />
            <TextInput style={styles.input} placeholder="Task Type" value={writingForm.taskType} onChangeText={(v) => setWritingForm((s) => ({ ...s, taskType: v }))} />
            <TextInput style={styles.input} placeholder="Time Limit" keyboardType="numeric" value={writingForm.timeLimit} onChangeText={(v) => setWritingForm((s) => ({ ...s, timeLimit: v }))} />
            <TextInput style={styles.input} placeholder="Min Words" keyboardType="numeric" value={writingForm.minWords} onChangeText={(v) => setWritingForm((s) => ({ ...s, minWords: v }))} />
            <TextInput style={[styles.input, styles.multilineInput]} multiline textAlignVertical="top" placeholder="Prompt" value={writingForm.prompt} onChangeText={(v) => setWritingForm((s) => ({ ...s, prompt: v }))} />
            <TextInput style={[styles.input, styles.multilineInput]} multiline textAlignVertical="top" placeholder="Notes" value={writingForm.notes} onChangeText={(v) => setWritingForm((s) => ({ ...s, notes: v }))} />
            <TextInput style={[styles.input, styles.multilineInput]} multiline textAlignVertical="top" placeholder="Sample Outline" value={writingForm.sampleOutline} onChangeText={(v) => setWritingForm((s) => ({ ...s, sampleOutline: v }))} />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeMeta.color }]} onPress={submitWriting} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Lưu đề Writing</Text>}
            </TouchableOpacity>
          </View>
        )}

        {activeSection === 'speaking' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Tạo đề Speaking</Text>
            <TextInput style={styles.input} placeholder="Title" value={speakingForm.title} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, title: v }))} />
            <TextInput style={styles.input} placeholder="Level" value={speakingForm.level} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, level: v }))} />
            <TextInput style={styles.input} placeholder="Part Type" value={speakingForm.partType} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, partType: v }))} />
            <TextInput style={styles.input} placeholder="Time Limit" keyboardType="numeric" value={speakingForm.timeLimit} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, timeLimit: v }))} />
            <TextInput style={[styles.input, styles.multilineInput]} multiline textAlignVertical="top" placeholder="Prompt" value={speakingForm.prompt} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, prompt: v }))} />
            <TextInput style={[styles.input, styles.multilineInput]} multiline textAlignVertical="top" placeholder="Cue card, mỗi dòng một ý" value={speakingForm.cueCard} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, cueCard: v }))} />
            <TextInput style={[styles.input, styles.multilineInput]} multiline textAlignVertical="top" placeholder="Follow-up questions, mỗi dòng một câu" value={speakingForm.followUpQuestions} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, followUpQuestions: v }))} />
            <TextInput style={[styles.input, styles.multilineInput]} multiline textAlignVertical="top" placeholder="Notes" value={speakingForm.notes} onChangeText={(v) => setSpeakingForm((s) => ({ ...s, notes: v }))} />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeMeta.color }]} onPress={submitSpeaking} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Lưu đề Speaking</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Danh sách hiện có</Text>
          {loading ? (
            <ActivityIndicator color={activeMeta.color} />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có dữ liệu cho mục này.</Text>
          ) : (
            items.map((item) => (
              <View key={item._id} style={styles.itemCard}>
                <View style={styles.itemHead}>
                  <View style={[styles.dot, { backgroundColor: activeMeta.color }]} />
                  <Text style={styles.itemTitle}>{item.title}</Text>
                </View>
                <Text style={styles.itemMeta}>
                  {item.level}
                  {item.skill ? ` • ${item.skill}` : ''}
                  {item.taskType ? ` • ${item.taskType}` : ''}
                  {item.partType ? ` • ${item.partType}` : ''}
                </Text>
                <Text numberOfLines={3} style={styles.itemSnippet}>
                  {item.description || item.prompt || `${item.parts?.length || 0} parts`}
                </Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                  <Ionicons name="trash-outline" size={16} color="#B42318" />
                  <Text style={styles.deleteBtnText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F4F7FB',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPlaceholder: { width: 40, height: 40 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#102A43' },
  container: { padding: 16, paddingBottom: 48, gap: 16 },
  heroCard: {
    backgroundColor: '#102A43',
    borderRadius: 24,
    padding: 20,
  },
  heroEyebrow: { color: '#9FB3C8', fontWeight: '700', marginBottom: 8 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 31 },
  heroText: { color: '#D9E2EC', fontSize: 14, lineHeight: 21, marginTop: 10 },
  sectionRow: { gap: 10, paddingRight: 12 },
  sectionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  sectionBtnText: { color: '#334E68', fontWeight: '700' },
  sectionBtnTextActive: { color: '#FFFFFF' },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
  },
  infoTitle: { fontSize: 12, color: '#627D98', fontWeight: '700', marginBottom: 6 },
  infoValue: { fontSize: 18, color: '#102A43', fontWeight: '900' },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
  },
  panelTitle: { fontSize: 18, fontWeight: '800', color: '#102A43', marginBottom: 8 },
  panelHint: { color: '#627D98', lineHeight: 20, marginBottom: 12 },
  codeInput: {
    minHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    backgroundColor: '#0B1727',
    color: '#D9E2EC',
    padding: 14,
    fontSize: 13,
  },
  primaryBtn: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#102A43',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  multilineInput: { minHeight: 100 },
  emptyText: { color: '#627D98' },
  itemCard: {
    borderWidth: 1,
    borderColor: '#E6EDF3',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    backgroundColor: '#FCFDFF',
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#102A43' },
  itemMeta: { color: '#627D98', fontSize: 13, marginBottom: 8 },
  itemSnippet: { color: '#334E68', lineHeight: 20 },
  deleteBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FEF3F2',
  },
  deleteBtnText: { color: '#B42318', fontWeight: '700' },
});
