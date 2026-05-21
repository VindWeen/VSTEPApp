import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getListeningTests,
  getReadingTests,
  getSpeakingTests,
  getWritingTests,
} from '../../services/api';
import {
  buildRandomFullMockSelection,
  clearActiveFullMockSession,
  createFullMockSession,
  getNextFullMockSkill,
  loadActiveFullMockSession,
  saveActiveFullMockSession,
} from '../../utils/fullMockTest';

const SKILLS = [
  { key: 'listening', label: 'Nghe', icon: 'headset', color: '#1565C0' },
  { key: 'reading', label: 'Đọc', icon: 'book', color: '#2E7D32' },
  { key: 'writing', label: 'Viết', icon: 'create', color: '#E65100' },
  { key: 'speaking', label: 'Nói', icon: 'mic', color: '#6A1B9A' },
];

export default function MockTestIntroScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  React.useEffect(() => {
    loadActiveFullMockSession().then(setActiveSession).catch(() => setActiveSession(null));
  }, []);

  const handleContinue = () => {
    if (!activeSession) return;
    navigation.replace('MockTestHub', {
      sessionId: activeSession.id,
      nextSkill: getNextFullMockSkill(activeSession),
    });
  };

  const handleCreateNewSession = async () => {
    setLoading(true);
    try {
      const [listeningRes, readingRes, writingRes, speakingRes] = await Promise.all([
        getListeningTests({ limit: 100 }),
        getReadingTests({ limit: 100 }),
        getWritingTests({ limit: 100 }),
        getSpeakingTests({ limit: 100 }),
      ]);

      const selectedTests = buildRandomFullMockSelection({
        listeningTests: listeningRes.data?.data || [],
        readingTests: readingRes.data?.data || [],
        writingTests: writingRes.data?.data || [],
        speakingTests: speakingRes.data?.data || [],
      });

      const session = createFullMockSession(selectedTests);
      await saveActiveFullMockSession(session);
      setActiveSession(session);

      navigation.replace('MockTestHub', {
        sessionId: session.id,
        nextSkill: getNextFullMockSkill(session),
      });
    } catch (error) {
      Alert.alert('Không thể tạo đề', error.message || 'Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPress = async () => {
    if (!activeSession) {
      await handleCreateNewSession();
      return;
    }

    Alert.alert(
      'Đang có bài thi chưa hoàn thành',
      'Bạn muốn tiếp tục bài thi đang làm hay tạo một đề ngẫu nhiên mới?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Tiếp tục', onPress: handleContinue },
        {
          text: 'Tạo đề mới',
          style: 'destructive',
          onPress: async () => {
            await clearActiveFullMockSession();
            setActiveSession(null);
            await handleCreateNewSession();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4C81" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.kicker}>THI THỬ TOÀN DIỆN</Text>
          <Text style={styles.title}>Một bài thi đủ 4 kỹ năng theo thứ tự Nghe, Đọc, Nói, Viết.</Text>
          <Text style={styles.subtitle}>
            Mỗi lần bắt đầu hệ thống sẽ chọn ngẫu nhiên 1 đề cho từng kỹ năng. Bạn có thể thoát ra
            và vào lại để làm tiếp, nhưng kỹ năng đã hoàn thành sẽ bị khóa và không sửa lại được.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cấu trúc bài thi</Text>
          {SKILLS.map((skill, index) => (
            <View key={skill.key} style={styles.skillRow}>
              <View style={[styles.skillIcon, { backgroundColor: `${skill.color}18` }]}>
                <Ionicons name={skill.icon} size={18} color={skill.color} />
              </View>
              <View style={styles.skillInfo}>
                <Text style={styles.skillLabel}>
                  {index + 1}. {skill.label}
                </Text>
                <Text style={styles.skillDesc}>
                  Hoàn thành xong mới mở phần tiếp theo.
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={18} color="#0F4C81" />
          <Text style={styles.noteText}>
            Sau khi hoàn tất đủ 4 kỹ năng, hệ thống mới tiến hành chấm điểm từng phần và tính
            overall band cho toàn bài.
          </Text>
        </View>

        {activeSession ? (
          <View style={styles.resumeCard}>
            <Text style={styles.resumeTitle}>Có bài thi đang làm dở</Text>
            <Text style={styles.resumeText}>
              Bạn có thể tiếp tục từ kỹ năng chưa hoàn thành tiếp theo hoặc tạo một đề ngẫu nhiên
              mới.
            </Text>
            <TouchableOpacity style={styles.resumeBtn} onPress={handleContinue}>
              <Text style={styles.resumeBtnText}>Tiếp tục bài đang làm</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleStartPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0F4C81" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color="#0F4C81" />
              <Text style={styles.primaryBtnText}>
                {activeSession ? 'Tiếp tục hoặc tạo đề mới' : 'Bắt đầu thi thử'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F4C81' },
  container: { padding: 20, paddingBottom: 32 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  hero: { marginBottom: 20 },
  kicker: { fontSize: 12, fontWeight: '800', color: '#B9D9F3', letterSpacing: 1.2, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 36, marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#D7EAF7', lineHeight: 22 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  skillRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  skillIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillInfo: { flex: 1 },
  skillLabel: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  skillDesc: { fontSize: 13, color: '#607D8B', lineHeight: 19 },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E7F1F8',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  noteText: { flex: 1, fontSize: 13, color: '#245C86', lineHeight: 20, fontWeight: '600' },
  resumeCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  resumeTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 6 },
  resumeText: { fontSize: 13, color: '#D7EAF7', lineHeight: 20, marginBottom: 12 },
  resumeBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resumeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  primaryBtn: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8D76E',
    borderRadius: 18,
    paddingVertical: 16,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: '900', color: '#0F4C81' },
});
