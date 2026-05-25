import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMyResults, getReadingTests } from '../../services/api';
import { getPracticeStateKey, loadPracticeStates } from '../../utils/practiceState';
import { getCache, setCache } from '../../utils/cache';
import { useTheme } from '../../context/ThemeContext';

const FILTERS = ['Tất cả', 'A2', 'B1', 'B2', 'C1'];

const extractTestNumber = (title = '') => {
  const match = title.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

const sortTests = (list) => {
  return [...list].sort((a, b) => {
    const numA = extractTestNumber(a.title);
    const numB = extractTestNumber(b.title);
    if (numA !== numB) return numA - numB;
    return a.title.localeCompare(b.title);
  });
};

export default function ReadingListScreen({ navigation }) {
  const { isDarkMode, theme } = useTheme();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const historyItemsRef = useRef([]);

  const fetchTests = useCallback(async (pageNum = 1, isLoadMore = false) => {
    try {
      const apiParams = {
        page: pageNum,
        limit: 10,
      };
      if (activeFilter !== 'Tất cả') {
        apiParams.level = activeFilter;
      }

      let testItems = [];
      let totalCount = 0;
      if (pageNum === 1) {
        const [testsRes, historyRes] = await Promise.all([
          getReadingTests(apiParams),
          getMyResults({ skill: 'reading', limit: 100 }),
        ]);
        testItems = testsRes.data?.data || [];
        totalCount = testsRes.data?.total || 0;
        historyItemsRef.current = historyRes.data?.data || [];
      } else {
        const testsRes = await getReadingTests(apiParams);
        testItems = testsRes.data?.data || [];
        totalCount = testsRes.data?.total || 0;
      }

      const draftMap = await loadPracticeStates('reading', testItems.map((item) => item._id));

      const bestScoreByTitle = historyItemsRef.current.reduce((acc, item) => {
        const title = item.testTitle;
        const score = Number(item.score) || 0;
        if (!title) return acc;
        acc[title] = Math.max(acc[title] || 0, score);
        return acc;
      }, {});

      const processedItems = testItems.map((item) => {
        const draft = draftMap[getPracticeStateKey('reading', item._id)];
        const hasHistory = item.title in bestScoreByTitle;
        const bestScore = bestScoreByTitle[item.title] || 0;
        const status = draft ? 'inProgress' : hasHistory ? 'done' : 'notDone';

        return {
          ...item,
          status,
          draft,
          bestScore,
        };
      });

      const sortedItems = sortTests(processedItems);
      if (pageNum === 1) {
        setTests(sortedItems);
        setTotal(totalCount);
        setPage(1);
        setHasMore(testItems.length === 10);
        await setCache(`reading_tests_${activeFilter}`, { data: sortedItems, total: totalCount });
      } else {
        setTests((prev) => {
          const existingIds = new Set(prev.map(i => i._id));
          const uniqueNew = processedItems.filter(i => !existingIds.has(i._id));
          return sortTests([...prev, ...uniqueNew]);
        });
        setTotal(totalCount);
        setPage(pageNum);
        setHasMore(testItems.length === 10);
      }
    } catch (e) {
      console.error('Lỗi load đề đọc:', e.message);
      if (!isLoadMore) {
        setTests([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  const loadCacheAndFetch = useCallback(async () => {
    const cached = await getCache(`reading_tests_${activeFilter}`);
    if (cached) {
      if (Array.isArray(cached)) {
        setTests(cached);
        setTotal(cached.length);
      } else {
        setTests(cached.data || []);
        setTotal(cached.total || 0);
      }
      setLoading(false);
    } else {
      setLoading(true);
    }
    await fetchTests(1, false);
  }, [activeFilter, fetchTests]);

  useFocusEffect(
    useCallback(() => {
      loadCacheAndFetch();
    }, [loadCacheAndFetch])
  );

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchTests(page + 1, true);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={isDarkMode ? '#81C784' : '#2E7D32'} />
      </View>
    );
  };

  const openReadingTest = (item) => {
    if (item.status === 'inProgress' && item.draft) {
      navigation.navigate('ReadingDetail', { test: item, resumeState: item.draft });
      return;
    }

    navigation.navigate('ReadingDetail', { test: item });
  };

  const getActionLabel = (item) => {
    if (item.status === 'inProgress') return 'Tiếp tục làm';
    if (item.status === 'done') return 'Làm lại';
    return 'Bắt đầu ngay';
  };

  const renderItem = ({ item }) => {
    const progressWidth = item.totalQuestions
      ? `${Math.min((item.bestScore / item.totalQuestions) * 100, 100)}%`
      : '0%';
    const progressColor = isDarkMode ? '#81C784' : '#2E7D32';
    const progressBg = isDarkMode ? 'rgba(129, 199, 132, 0.15)' : '#E8F5E9';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => openReadingTest(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.cardIcon, { backgroundColor: isDarkMode ? 'rgba(129, 199, 132, 0.15)' : '#E8F5E9' }]}>
              <Ionicons name="document-text" size={22} color={isDarkMode ? '#81C784' : '#2E7D32'} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                {item.totalQuestions} câu • {item.duration} phút • {item.level}
              </Text>
              {item.status === 'inProgress' ? (
                <Text style={[styles.cardDraftText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>Đang làm dở</Text>
              ) : null}
              {item.status === 'done' ? (
                <View style={styles.scoreWrap}>
                  <View style={[styles.progressBarBg, { backgroundColor: progressBg }]}>
                    <View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: progressColor }]} />
                  </View>
                  <Text style={[styles.scoreText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>
                    {item.bestScore}/{item.totalQuestions}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.cardRight}>
            {item.status === 'done' ? (
              <Text style={[styles.doneText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>Đã làm</Text>
            ) : item.status === 'inProgress' ? (
              <Text style={[styles.inProgressText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>Đang làm</Text>
            ) : (
              <Text style={[styles.notDoneText, { color: theme.textSecondary }]}>Chưa làm</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: isDarkMode ? '#81C784' : '#2E7D32' }]}
          onPress={() => openReadingTest(item)}
        >
          <Text style={[styles.actionBtnText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>{getActionLabel(item)}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Luyện Đọc</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroPad}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconBg}>
            <Ionicons name="book" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Kỹ năng Đọc VSTEP</Text>
            <Text style={styles.heroSubtitle}>Đọc hiểu văn bản học thuật</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="document-text-outline" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}> {total} đề</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="layers-outline" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}> Lịch sử làm bài</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          const btnBg = isActive ? (isDarkMode ? '#81C784' : '#2E7D32') : theme.card;
          const btnBorder = isActive ? (isDarkMode ? '#81C784' : '#2E7D32') : theme.border;
          const txtColor = isActive ? (isDarkMode ? '#121212' : '#fff') : theme.textSecondary;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterBtn, { backgroundColor: btnBg, borderColor: btnBorder }]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, { color: txtColor }]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Text style={[styles.listHeaderTitle, { color: theme.text }]}>Đề thi</Text>
          <View style={[styles.countBadge, { backgroundColor: isDarkMode ? '#81C784' : '#2E7D32' }]}>
            <Text style={[styles.countBadgeText, { color: isDarkMode ? '#121212' : '#fff' }]}>{total}</Text>
          </View>
        </View>
        <Text style={[styles.seeAll, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>Xem tất cả</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={isDarkMode ? '#81C784' : '#2E7D32'} />
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchTests(1, false);
                setRefreshing(false);
              }}
              colors={[isDarkMode ? '#81C784' : '#2E7D32']}
              tintColor={theme.text}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.15}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color={isDarkMode ? '#444' : '#CFD8DC'} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có đề thi nào cho trình độ này</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 10,
    backgroundColor: '#F5F7FA',
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  heroPad: { paddingHorizontal: 16, paddingBottom: 12 },
  heroCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  heroBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  filterScrollView: { flexGrow: 0, minHeight: 50, maxHeight: 50 },
  filterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtn: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: '#757575', textAlign: 'center' },
  filterTextActive: { color: '#fff' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  cardMeta: { fontSize: 13, color: '#757575', marginBottom: 4 },
  cardDraftText: { marginTop: 6, fontSize: 13, color: '#2E7D32', fontWeight: '700' },
  scoreWrap: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 999 },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  doneText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  inProgressText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  notDoneText: { fontSize: 13, fontWeight: '500', color: '#9E9E9E' },
  scoreText: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
  actionBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 16, fontSize: 15, fontWeight: '500' },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
