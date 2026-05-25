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
import { getWritingHistory, getWritingTests } from '../../services/api';
import { getPracticeStateKey, loadPracticeStates } from '../../utils/practiceState';
import { getCache, setCache } from '../../utils/cache';
import { useTheme } from '../../context/ThemeContext';

const FILTERS = ['Tất cả', 'A2', 'B1', 'B2', 'C1'];

const extractWritingNumber = (title = '') => {
  const match = title.match(/Writing\s+(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const extractTaskNumber = (taskType = '') => {
  const match = taskType.match(/Task\s+(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const groupWritingTests = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const testNumber = extractWritingNumber(item.title);
    const key = `${item.level}-${testNumber}`;

    if (!groups.has(key)) {
      groups.set(key, {
        _id: key,
        level: item.level,
        testNumber,
        title: `Writing ${String(testNumber).padStart(2, '0')}`,
        tasks: [],
      });
    }

    groups.get(key).tasks.push(item);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      tasks: group.tasks.sort(
        (a, b) => extractTaskNumber(a.taskType) - extractTaskNumber(b.taskType)
      ),
      totalDuration: group.tasks.reduce((sum, task) => sum + (task.timeLimit || 0), 0),
      totalMinWords: group.tasks.reduce((sum, task) => sum + (task.minWords || 0), 0),
    }))
    .sort((a, b) => a.testNumber - b.testNumber);
};

export default function WritingListScreen({ navigation }) {
  const { isDarkMode, theme } = useTheme();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const rawTasksRef = useRef([]);
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

      let newRawTasks = [];
      let totalCount = 0;
      if (pageNum === 1) {
        const [testsRes, historyRes] = await Promise.all([
          getWritingTests(apiParams),
          getWritingHistory({ limit: 100 }),
        ]);
        newRawTasks = testsRes.data?.data || [];
        totalCount = Math.ceil((testsRes.data?.total || 0) / 2);
        rawTasksRef.current = newRawTasks;
        historyItemsRef.current = historyRes.data?.data || [];
      } else {
        const testsRes = await getWritingTests(apiParams);
        newRawTasks = testsRes.data?.data || [];
        totalCount = Math.ceil((testsRes.data?.total || 0) / 2);
        rawTasksRef.current = [...rawTasksRef.current, ...newRawTasks];
      }

      const groupedTests = groupWritingTests(rawTasksRef.current);
      const draftMap = await loadPracticeStates('writing', groupedTests.map((item) => item._id));

      const bestBandByTitle = historyItemsRef.current.reduce((acc, item) => {
        const title = item.testTitle;
        const band = item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand ?? 0;
        if (!title) return acc;
        acc[title] = Math.max(acc[title] || 0, Number(band) || 0);
        return acc;
      }, {});

      const processedItems = groupedTests.map((item) => {
        const draft = draftMap[getPracticeStateKey('writing', item._id)];
        const hasHistory = item.title in bestBandByTitle;
        const bestBand = bestBandByTitle[item.title] || 0;
        const status = draft ? 'inProgress' : hasHistory ? 'done' : 'notDone';

        return {
          ...item,
          status,
          draft,
          bestBand,
        };
      });

      if (pageNum === 1) {
        setTests(processedItems);
        setTotal(totalCount);
        setPage(1);
        setHasMore(newRawTasks.length === 10);
        await setCache(`writing_tests_${activeFilter}`, { data: processedItems, total: totalCount });
      } else {
        setTests(processedItems);
        setTotal(totalCount);
        setPage(pageNum);
        setHasMore(newRawTasks.length === 10);
      }
    } catch (e) {
      console.error('Lỗi load đề viết:', e.message);
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
    const cached = await getCache(`writing_tests_${activeFilter}`);
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
        <ActivityIndicator size="small" color={isDarkMode ? '#FF9800' : '#E65100'} />
      </View>
    );
  };

  const openWritingTest = (item) => {
    if (item.status === 'inProgress' && item.draft) {
      navigation.navigate('WritingCompose', {
        test: item,
        taskIndex: item.draft.taskIndex || 0,
        draftResponses: item.draft.draftResponses || [],
        resumeState: item.draft,
      });
      return;
    }

    navigation.navigate('WritingCompose', { test: item, taskIndex: 0 });
  };

  const getActionLabel = (item) => {
    if (item.status === 'inProgress') return 'Tiếp tục làm';
    if (item.status === 'done') return 'Làm lại';
    return 'Bắt đầu ngay';
  };

  const renderItem = ({ item }) => {
    const progressBg = isDarkMode ? 'rgba(230, 81, 0, 0.15)' : '#FBE9E7';
    const progressColor = isDarkMode ? '#FF9800' : '#E65100';
    const cardIconBg = isDarkMode ? 'rgba(230, 81, 0, 0.15)' : '#FBE9E7';
    const primaryColor = isDarkMode ? '#FF9800' : '#E65100';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => openWritingTest(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.cardIcon, { backgroundColor: cardIconBg }]}>
              <Ionicons name="create" size={20} color={primaryColor} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                {item.tasks.length} task • {item.totalDuration} phút • {item.level}
              </Text>
              <Text style={[styles.cardTasks, { color: primaryColor }]}>
                {item.tasks.map((task) => task.taskType).join(' + ')}
              </Text>
              {item.status === 'inProgress' ? (
                <Text style={[styles.cardDraftText, { color: primaryColor }]}>Đang làm dở</Text>
              ) : null}
              {item.status === 'done' ? (
                <View style={styles.scoreWrap}>
                  <View style={[styles.progressBarBg, { backgroundColor: progressBg }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min((item.bestBand / 9) * 100, 100)}%`, backgroundColor: progressColor },
                      ]}
                    />
                  </View>
                  <Text style={[styles.bandText, { color: primaryColor }]}>{item.bestBand.toFixed(1)}/9.0</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.cardRight}>
            {item.status === 'done' ? (
              <Text style={[styles.doneText, { color: isDarkMode ? '#81C784' : '#2E7D32' }]}>Đã làm</Text>
            ) : item.status === 'inProgress' ? (
              <Text style={[styles.inProgressText, { color: primaryColor }]}>Đang làm</Text>
            ) : (
              <Text style={[styles.notDoneText, { color: theme.textSecondary }]}>Chưa làm</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: primaryColor }]}
          onPress={() => openWritingTest(item)}
        >
          <Text style={[styles.actionBtnText, { color: primaryColor }]}>{getActionLabel(item)}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const primaryColor = isDarkMode ? '#FF9800' : '#E65100';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Luyện Viết</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroPad}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconBg}>
            <Ionicons name="create" size={28} color="#fff" />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Kỹ năng Viết VSTEP</Text>
            <Text style={styles.heroSubtitle}>Mỗi đề gồm 2 task đúng format bài thi</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{total} đề</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>AI chấm điểm</Text>
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
          const btnBg = isActive ? primaryColor : theme.card;
          const btnBorder = isActive ? primaryColor : theme.border;
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
          <View style={[styles.countBadge, { backgroundColor: primaryColor }]}>
            <Text style={[styles.countBadgeText, { color: isDarkMode ? '#121212' : '#fff' }]}>{total}</Text>
          </View>
        </View>
        <Text style={[styles.seeAll, { color: primaryColor }]}>Xem tất cả</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
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
              colors={[primaryColor]}
              tintColor={theme.text}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.15}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="create-outline" size={60} color={isDarkMode ? '#444' : '#CFD8DC'} />
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
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  heroPad: { paddingHorizontal: 16, paddingBottom: 12 },
  heroCard: {
    backgroundColor: '#E65100',
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
  heroContent: { flex: 1 },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  filterScrollView: { flexGrow: 0, minHeight: 50, maxHeight: 50 },
  filterScroll: { paddingHorizontal: 16, paddingBottom: 4, paddingTop: 2, alignItems: 'center' },
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
    flexShrink: 0,
  },
  filterBtnActive: { backgroundColor: '#E65100', borderColor: '#E65100' },
  filterText: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: '#757575', textAlign: 'center' },
  filterTextActive: { color: '#fff' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: '#E65100',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 14, color: '#E65100', fontWeight: '600' },
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
    backgroundColor: '#FBE9E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3, lineHeight: 22 },
  cardMeta: { fontSize: 13, color: '#757575', marginBottom: 4 },
  cardTasks: { fontSize: 13, color: '#E65100', fontWeight: '600' },
  cardDraftText: { marginTop: 8, fontSize: 13, color: '#F57C00', fontWeight: '700' },
  scoreWrap: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#FBE9E7',
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 999, backgroundColor: '#E65100' },
  bandText: { fontSize: 12, color: '#E65100', fontWeight: '800' },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  doneText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  inProgressText: { fontSize: 13, fontWeight: '700', color: '#F57C00' },
  notDoneText: { fontSize: 13, fontWeight: '500', color: '#9E9E9E' },
  actionBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E65100',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#E65100' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 16, fontSize: 15, fontWeight: '500' },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
