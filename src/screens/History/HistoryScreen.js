import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getMyResults,
  getResultById,
  getWritingHistory,
  getWritingSessionById,
  getSpeakingHistory,
  getSpeakingSessionById,
  getListeningDetail,
  getReadingDetail,
} from '../../services/api';
import { loadFullMockHistory } from '../../utils/fullMockTest';

const SKILL_TABS = [
  { key: 'all', label: 'Tất cả', icon: 'apps', color: '#455A64' },
  { key: 'mocktest', label: 'Thi thử', icon: 'ribbon', color: '#0F4C81' },
  { key: 'listening', label: 'Nghe', icon: 'headset', color: '#1565C0' },
  { key: 'reading', label: 'Đọc', icon: 'book', color: '#2E7D32' },
  { key: 'writing', label: 'Viết', icon: 'create', color: '#E65100' },
  { key: 'speaking', label: 'Nói', icon: 'mic', color: '#6A1B9A' },
];

const SKILL_META = {
  mocktest: { label: 'Thi thử', icon: 'ribbon', color: '#0F4C81', light: '#E3F2FD' },
  listening: { label: 'Nghe', icon: 'headset', color: '#1565C0', light: '#E3F2FD' },
  reading: { label: 'Đọc', icon: 'book', color: '#2E7D32', light: '#E8F5E9' },
  writing: { label: 'Viết', icon: 'create', color: '#E65100', light: '#FFF3E0' },
  speaking: { label: 'Nói', icon: 'mic', color: '#6A1B9A', light: '#F3E5F5' },
};

const BAND_COLOR = (band) => {
  const numericBand = typeof band === 'number' ? band : null;
  if (numericBand !== null) {
    if (numericBand >= 6.5) return '#1565C0';
    if (numericBand >= 5.0) return '#2E7D32';
    if (numericBand >= 4.0) return '#EF6C00';
    return '#D32F2F';
  }

  switch (band) {
    case 'C1':
      return '#1565C0';
    case 'B2':
      return '#2E7D32';
    case 'B1':
      return '#EF6C00';
    case 'A2':
      return '#8D6E63';
    default:
      return '#78909C';
  }
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds = 0) => {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const normalizeObjectiveItem = (item) => ({
  ...item,
  historyType: 'objective',
  bandScore: item.estimatedBand,
  dateValue: item.completedAt || item.createdAt,
});

const normalizeWritingItem = (item) => ({
  ...item,
  skill: 'writing',
  historyType: 'writing',
  bandScore: item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand,
  dateValue: item.completedAt || item.createdAt,
});

const normalizeSpeakingItem = (item) => ({
  ...item,
  skill: 'speaking',
  historyType: 'speaking',
  bandScore: item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand,
  dateValue: item.completedAt || item.createdAt,
});

const normalizeMockTestItem = (item) => ({
  ...item,
  _id: item.id,
  skill: 'mocktest',
  historyType: 'mocktest',
  title: 'Mock Test 4 kỹ năng',
  testTitle: 'Mock Test 4 kỹ năng',
  bandScore: item.overallBand,
  dateValue: item.completedAt || item.createdAt,
});

export default function HistoryScreen({ navigation }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [openingId, setOpeningId] = useState(null);

  const parentNavigation = navigation.getParent();

  const fetchResults = async (skill) => {
    try {
      if (skill === 'all') {
        const [objectiveRes, writingRes, speakingRes, mockHistory] = await Promise.all([
          getMyResults({ limit: 100 }),
          getWritingHistory({ limit: 100 }),
          getSpeakingHistory({ limit: 100 }),
          loadFullMockHistory(),
        ]);

        const merged = [
          ...(mockHistory || []).map(normalizeMockTestItem),
          ...(objectiveRes.data.data || []).map(normalizeObjectiveItem),
          ...(writingRes.data.data || []).map(normalizeWritingItem),
          ...(speakingRes.data.data || []).map(normalizeSpeakingItem),
        ].sort((a, b) => new Date(b.dateValue || 0) - new Date(a.dateValue || 0));

        setResults(merged);
        return;
      }

      if (skill === 'mocktest') {
        const mockHistory = await loadFullMockHistory();
        setResults((mockHistory || []).map(normalizeMockTestItem));
        return;
      }

      if (skill === 'writing') {
        const res = await getWritingHistory({ limit: 100 });
        setResults((res.data.data || []).map(normalizeWritingItem));
        return;
      }

      if (skill === 'speaking') {
        const res = await getSpeakingHistory({ limit: 100 });
        setResults((res.data.data || []).map(normalizeSpeakingItem));
        return;
      }

      const res = await getMyResults({ skill, limit: 100 });
      setResults((res.data.data || []).map(normalizeObjectiveItem));
    } catch (e) {
      console.error('Lỗi load history:', e.message);
      setResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchResults(activeTab);
    }, [activeTab])
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setLoading(true);
    fetchResults(tab);
  };

  const openHistoryItem = async (item) => {
    setOpeningId(item._id || item.id);

    try {
      if (item.historyType === 'mocktest') {
        parentNavigation?.navigate('Home', {
          screen: 'MockTestResult',
          params: {
            result: item,
          },
        });
        return;
      }

      if (item.historyType === 'writing') {
        const res = await getWritingSessionById(item._id);
        parentNavigation?.navigate('Writing', {
          screen: 'WritingResult',
          params: {
            result: res.data.data,
            test: { title: res.data.data.testTitle || item.testTitle || item.title },
            fromHistory: true,
          },
        });
        return;
      }

      if (item.historyType === 'speaking') {
        const res = await getSpeakingSessionById(item._id);
        parentNavigation?.navigate('SpeakingTab', {
          screen: 'SpeakingResult',
          params: {
            result: res.data.data,
            test: { title: res.data.data.testTitle || item.testTitle || item.title },
            fromHistory: true,
          },
        });
        return;
      }

      const resultRes = await getResultById(item._id);
      const fullResult = resultRes.data.data;

      if (item.skill === 'listening') {
        const detailRes = await getListeningDetail(fullResult.testId);
        parentNavigation?.navigate('Listening', {
          screen: 'ListeningResult',
          params: {
            testId: fullResult.testId,
            detail: detailRes.data.data,
            historyResult: fullResult,
            fromHistory: true,
          },
        });
        return;
      }

      if (item.skill === 'reading') {
        const detailRes = await getReadingDetail(fullResult.testId);
        parentNavigation?.navigate('Reading', {
          screen: 'ReadingResult',
          params: {
            testId: fullResult.testId,
            test: detailRes.data.data,
            passages: detailRes.data.data.parts || [],
            historyResult: fullResult,
            fromHistory: true,
          },
        });
      }
    } catch (error) {
      console.error('Lỗi mở lịch sử:', error.message);
    } finally {
      setOpeningId(null);
    }
  };

  const renderItem = ({ item }) => {
    const meta = SKILL_META[item.skill] || SKILL_META.listening;
    const scoreLabel =
      item.skill === 'mocktest'
        ? `Overall ${Number(item.overallBand || 0).toFixed(1)}/9.0`
        : item.skill === 'listening' || item.skill === 'reading'
          ? `${item.score}/${item.total} đúng`
          : `${item.totalWordCount || item.totalAudioDuration ? (item.totalWordCount ? `${item.totalWordCount} từ` : formatDuration(item.totalAudioDuration)) : item.level}`;

    const secondLine =
      item.skill === 'mocktest'
        ? '4 kỹ năng • Nghe, Đọc, Viết, Nói'
        : item.skill === 'speaking'
          ? formatDuration(item.totalAudioDuration) || item.level
          : item.skill === 'writing'
            ? `${item.level} • ${item.totalWordCount || 0} từ`
            : `${item.level} • ${item.percentage ?? 0}%`;

    const itemId = item._id || item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.card}
        onPress={() => openHistoryItem(item)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.skillIconWrap, { backgroundColor: meta.light }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>

          <View style={styles.cardMain}>
            <View style={styles.titleRow}>
              <Text style={styles.testTitle} numberOfLines={1}>
                {item.testTitle || item.title || meta.label}
              </Text>
              <View style={[styles.bandBadge, { backgroundColor: BAND_COLOR(item.bandScore) }]}>
                <Text style={styles.bandText}>
                  {typeof item.bandScore === 'number'
                    ? item.bandScore.toFixed(1)
                    : item.bandScore || '-'}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.skillChip, { backgroundColor: meta.light }]}>
                <Text style={[styles.skillChipText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Text style={styles.metaText}>{secondLine}</Text>
            </View>

            <Text style={styles.subMetaText}>{formatDateTime(item.dateValue)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.scoreText}>{scoreLabel}</Text>
          <View style={styles.reviewBtn}>
            {openingId === itemId ? (
              <ActivityIndicator size="small" color={meta.color} />
            ) : (
              <>
                <Text style={[styles.reviewBtnText, { color: meta.color }]}>Xem lại bài</Text>
                <Ionicons name="chevron-forward" size={16} color={meta.color} />
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="bar-chart" size={26} color="#fff" />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.headerTitle}>Lịch sử làm bài</Text>
          <Text style={styles.headerSub}>
            Có thể lọc riêng các lần thi thử 4 kỹ năng hoặc từng kỹ năng lẻ.
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {SKILL_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                active && { backgroundColor: tab.color, borderColor: tab.color },
              ]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Ionicons
                name={active ? tab.icon : `${tab.icon}-outline`}
                size={16}
                color={active ? '#fff' : tab.color}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#455A64" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchResults(activeTab);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="albums-outline" size={54} color="#B0BEC5" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Chưa có bài nào trong mục này</Text>
              <Text style={styles.emptyHint}>Làm một bài mới rồi quay lại đây để xem lịch sử.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  hero: {
    margin: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#263238',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextWrap: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#CFD8DC', marginTop: 4, lineHeight: 18 },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#546E7A' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingTop: 8, paddingBottom: 36 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cardTop: { flexDirection: 'row', gap: 14 },
  skillIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMain: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  testTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  bandBadge: {
    minWidth: 48,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bandText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  skillChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skillChipText: { fontSize: 11, fontWeight: '800' },
  metaText: { fontSize: 12, color: '#607D8B', fontWeight: '600' },
  subMetaText: { fontSize: 12, color: '#90A4AE', marginTop: 8 },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  scoreText: { flex: 1, fontSize: 13, color: '#455A64', fontWeight: '700' },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 92, justifyContent: 'flex-end' },
  reviewBtnText: { fontSize: 13, fontWeight: '800' },
  emptyBox: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 24 },
  emptyText: { fontSize: 17, fontWeight: '800', color: '#455A64' },
  emptyHint: { color: '#90A4AE', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 18 },
});
