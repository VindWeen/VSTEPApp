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
  Platform,
  StatusBar,
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
import { useTheme } from '../../context/ThemeContext';

const SKILL_TABS = [
  { key: 'all', label: 'Tất cả', icon: 'apps' },
  { key: 'mocktest', label: 'Thi thử', icon: 'ribbon' },
  { key: 'listening', label: 'Nghe', icon: 'headset' },
  { key: 'reading', label: 'Đọc', icon: 'book' },
  { key: 'writing', label: 'Viết', icon: 'create' },
  { key: 'speaking', label: 'Nói', icon: 'mic' },
];

const getDynamicMeta = (skill, isDarkMode) => {
  if (isDarkMode) {
    switch (skill) {
      case 'mocktest':
        return { label: 'Thi thử', icon: 'ribbon', color: '#64B5F6', light: 'rgba(100, 181, 246, 0.15)' };
      case 'listening':
        return { label: 'Nghe', icon: 'headset', color: '#64B5F6', light: 'rgba(100, 181, 246, 0.15)' };
      case 'reading':
        return { label: 'Đọc', icon: 'book', color: '#81C784', light: 'rgba(129, 199, 132, 0.15)' };
      case 'writing':
        return { label: 'Viết', icon: 'create', color: '#FFB74D', light: 'rgba(255, 183, 77, 0.15)' };
      case 'speaking':
        return { label: 'Nói', icon: 'mic', color: '#E040FB', light: 'rgba(224, 64, 251, 0.15)' };
      default:
        return { label: 'Tất cả', icon: 'apps', color: '#E0E0E0', light: 'rgba(255, 255, 255, 0.1)' };
    }
  } else {
    switch (skill) {
      case 'mocktest':
        return { label: 'Thi thử', icon: 'ribbon', color: '#0F4C81', light: '#E3F2FD' };
      case 'listening':
        return { label: 'Nghe', icon: 'headset', color: '#1565C0', light: '#E3F2FD' };
      case 'reading':
        return { label: 'Đọc', icon: 'book', color: '#2E7D32', light: '#E8F5E9' };
      case 'writing':
        return { label: 'Viết', icon: 'create', color: '#E65100', light: '#FFF3E0' };
      case 'speaking':
        return { label: 'Nói', icon: 'mic', color: '#6A1B9A', light: '#F3E5F5' };
      default:
        return { label: 'Tất cả', icon: 'apps', color: '#455A64', light: '#ECEFF1' };
    }
  }
};

const BAND_COLOR = (band, isDarkMode) => {
  const numericBand = typeof band === 'number' ? band : null;
  if (numericBand !== null) {
    if (numericBand >= 6.5) return isDarkMode ? '#64B5F6' : '#1565C0';
    if (numericBand >= 5.0) return isDarkMode ? '#81C784' : '#2E7D32';
    if (numericBand >= 4.0) return isDarkMode ? '#FFB74D' : '#EF6C00';
    return isDarkMode ? '#FF8A80' : '#D32F2F';
  }

  switch (band) {
    case 'C1':
      return isDarkMode ? '#64B5F6' : '#1565C0';
    case 'B2':
      return isDarkMode ? '#81C784' : '#2E7D32';
    case 'B1':
      return isDarkMode ? '#FFB74D' : '#EF6C00';
    case 'A2':
      return isDarkMode ? '#A1887F' : '#8D6E63';
    default:
      return isDarkMode ? '#90A4AE' : '#78909C';
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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allMergedResults, setAllMergedResults] = useState([]);

  const { theme, isDarkMode } = useTheme();

  const parentNavigation = navigation.getParent();

  const fetchResults = async (skill, pageNum = 1, isLoadMore = false) => {
    try {
      if (skill === 'all') {
        if (!isLoadMore) {
          const [objectiveRes, writingRes, speakingRes, mockHistory] = await Promise.all([
            getMyResults({ limit: 40 }),
            getWritingHistory({ limit: 40 }),
            getSpeakingHistory({ limit: 40 }),
            loadFullMockHistory(),
          ]);

          const merged = [
            ...(mockHistory || []).map(normalizeMockTestItem),
            ...(objectiveRes.data.data || []).map(normalizeObjectiveItem),
            ...(writingRes.data.data || []).map(normalizeWritingItem),
            ...(speakingRes.data.data || []).map(normalizeSpeakingItem),
          ].sort((a, b) => new Date(b.dateValue || 0) - new Date(a.dateValue || 0));

          setAllMergedResults(merged);
          setResults(merged.slice(0, 10));
          setPage(1);
          setHasMore(merged.length > 10);
        } else {
          const nextStartIndex = pageNum * 10 - 10;
          const nextSlice = allMergedResults.slice(nextStartIndex, nextStartIndex + 10);
          if (nextSlice.length > 0) {
            setResults((prev) => [...prev, ...nextSlice]);
            setPage(pageNum);
          }
          setHasMore(allMergedResults.length > nextStartIndex + nextSlice.length);
        }
        return;
      }

      if (skill === 'mocktest') {
        if (!isLoadMore) {
          const mockHistory = await loadFullMockHistory();
          const sorted = (mockHistory || [])
            .map(normalizeMockTestItem)
            .sort((a, b) => new Date(b.dateValue || 0) - new Date(a.dateValue || 0));
          
          setAllMergedResults(sorted);
          setResults(sorted.slice(0, 10));
          setPage(1);
          setHasMore(sorted.length > 10);
        } else {
          const nextStartIndex = pageNum * 10 - 10;
          const nextSlice = allMergedResults.slice(nextStartIndex, nextStartIndex + 10);
          if (nextSlice.length > 0) {
            setResults((prev) => [...prev, ...nextSlice]);
            setPage(pageNum);
          }
          setHasMore(allMergedResults.length > nextStartIndex + nextSlice.length);
        }
        return;
      }

      let res;
      if (skill === 'writing') {
        res = await getWritingHistory({ page: pageNum, limit: 10 });
      } else if (skill === 'speaking') {
        res = await getSpeakingHistory({ page: pageNum, limit: 10 });
      } else {
        res = await getMyResults({ skill, page: pageNum, limit: 10 });
      }

      const fetchedData = res.data.data || [];
      let normalized;
      if (skill === 'writing') {
        normalized = fetchedData.map(normalizeWritingItem);
      } else if (skill === 'speaking') {
        normalized = fetchedData.map(normalizeSpeakingItem);
      } else {
        normalized = fetchedData.map(normalizeObjectiveItem);
      }

      if (isLoadMore) {
        setResults((prev) => [...prev, ...normalized]);
        setPage(pageNum);
      } else {
        setResults(normalized);
        setPage(1);
      }
      setHasMore(fetchedData.length === 10);
    } catch (e) {
      console.error('Lỗi load history:', e.message);
      if (!isLoadMore) {
        setResults([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchResults(activeTab, 1, false);
    }, [activeTab])
  );

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchResults(activeTab, page + 1, true);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    const activeColor = getDynamicMeta(activeTab, isDarkMode).color;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={activeColor} />
      </View>
    );
  };

  const openHistoryItem = async (item) => {
    setOpeningId(item._id || item.id);

    try {
      if (item.historyType === 'mocktest') {
        parentNavigation?.navigate('Home', {
          screen: 'MockTestResult',
          params: {
            result: item,
            fromHistory: true,
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
    const meta = getDynamicMeta(item.skill, isDarkMode);
    const scoreLabel =
      item.skill === 'mocktest'
        ? `Overall ${Number(item.overallBand || 0).toFixed(1)}/10.0`
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
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => openHistoryItem(item)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.skillIconWrap, { backgroundColor: meta.light }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>

          <View style={styles.cardMain}>
            <View style={styles.titleRow}>
              <Text style={[styles.testTitle, { color: theme.text }]} numberOfLines={1}>
                {item.testTitle || item.title || meta.label}
              </Text>
              <View style={[styles.bandBadge, { backgroundColor: BAND_COLOR(item.bandScore, isDarkMode) }]}>
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
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{secondLine}</Text>
            </View>

            <Text style={[styles.subMetaText, { color: theme.placeholder }]}>{formatDateTime(item.dateValue)}</Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.scoreText, { color: theme.textSecondary }]}>{scoreLabel}</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={[styles.headerBar, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ProfileMain')}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: theme.text }]}>Lịch sử làm bài</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.hero, { backgroundColor: isDarkMode ? theme.card : '#263238', borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: isDarkMode ? theme.background : 'rgba(255,255,255,0.14)' }]}>
          <Ionicons name="bar-chart" size={26} color={isDarkMode ? theme.text : '#fff'} />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? theme.text : '#fff' }]}>Lịch sử làm bài</Text>
          <Text style={[styles.headerSub, { color: isDarkMode ? theme.textSecondary : '#CFD8DC' }]}>
            Có thể lọc riêng các lần thi thử 4 kỹ năng hoặc từng kỹ năng lẻ.
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {SKILL_TABS.map((tab) => {
          const active = activeTab === tab.key;
          const meta = getDynamicMeta(tab.key, isDarkMode);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? meta.color : theme.card,
                  borderColor: active ? meta.color : theme.border,
                },
              ]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Ionicons
                name={active ? tab.icon : `${tab.icon}-outline`}
                size={16}
                color={active ? (isDarkMode ? '#121212' : '#fff') : meta.color}
              />
              <Text style={[styles.tabText, { color: active ? (isDarkMode ? '#121212' : '#fff') : theme.textSecondary }]}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={isDarkMode ? '#64B5F6' : '#1565C0'} />
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
                fetchResults(activeTab, 1, false);
              }}
              tintColor={theme.text}
              colors={[isDarkMode ? '#64B5F6' : '#1565C0']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.15}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="albums-outline" size={54} color={theme.placeholder} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: theme.text }]}>Chưa có bài nào trong mục này</Text>
              <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>Làm một bài mới rồi quay lại đây để xem lịch sử.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 10,
    backgroundColor: '#F5F7FA',
  },
  headerBarTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
