import React, { useCallback, useMemo, useState } from 'react';
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
import { getSpeakingHistory, getSpeakingTests } from '../../services/api';
import { getPracticeStateKey, loadPracticeStates } from '../../utils/practiceState';

const FILTERS = ['Tất cả', 'A2', 'B1', 'B2', 'C1'];

const STEPS = [
  { icon: 'eye-outline', label: 'Xem đề' },
  { icon: 'time-outline', label: 'Chuẩn bị' },
  { icon: 'mic-outline', label: 'Ghi âm' },
  { icon: 'person-outline', label: 'AI chấm' },
];

const extractSpeakingNumber = (title = '') => {
  const match = title.match(/Speaking\s+(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const extractPartNumber = (partType = '') => {
  const match = partType.match(/Part\s+(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const groupSpeakingTests = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const testNumber = extractSpeakingNumber(item.title);
    const key = `${item.level}-${testNumber}`;

    if (!groups.has(key)) {
      groups.set(key, {
        _id: key,
        level: item.level,
        testNumber,
        title: `Speaking ${String(testNumber).padStart(2, '0')}`,
        tasks: [],
      });
    }

    groups.get(key).tasks.push(item);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      tasks: group.tasks.sort(
        (a, b) => extractPartNumber(a.partType) - extractPartNumber(b.partType)
      ),
      totalDuration: group.tasks.reduce((sum, task) => sum + (task.timeLimit || 0), 0),
    }))
    .sort((a, b) => a.testNumber - b.testNumber);
};

export default function SpeakingListScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const fetchTests = useCallback(async () => {
    try {
      const [testsRes, historyRes] = await Promise.all([
        getSpeakingTests({ limit: 100 }),
        getSpeakingHistory({ limit: 100 }),
      ]);
      const groupedTests = groupSpeakingTests(testsRes.data?.data || []);
      const historyItems = historyRes.data?.data || [];
      const draftMap = await loadPracticeStates('speaking', groupedTests.map((item) => item._id));

      const bestBandByTitle = historyItems.reduce((acc, item) => {
        const title = item.testTitle;
        const band = item.aiFeedback?.band ?? item.bandScore ?? item.estimatedBand ?? 0;
        if (!title) return acc;
        acc[title] = Math.max(acc[title] || 0, Number(band) || 0);
        return acc;
      }, {});

      setTests(
        groupedTests.map((item) => {
          const draft = draftMap[getPracticeStateKey('speaking', item._id)];
          const bestBand = bestBandByTitle[item.title] || 0;
          const status = draft ? 'inProgress' : bestBand > 0 ? 'done' : 'notDone';

          return {
            ...item,
            status,
            draft,
            bestBand,
          };
        })
      );
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTests();
    }, [fetchTests])
  );

  const filteredTests = useMemo(
    () => tests.filter((test) => activeFilter === 'Tất cả' || test.level === activeFilter),
    [activeFilter, tests]
  );

  const openSpeakingTest = (item) => {
    if (item.status === 'inProgress' && item.draft) {
      const routeName = item.draft.screen === 'record' ? 'SpeakingRecord' : 'SpeakingPrep';
      navigation.navigate(routeName, {
        test: item,
        taskIndex: item.draft.taskIndex || 0,
        draftResponses: item.draft.draftResponses || [],
        resumeState: item.draft,
      });
      return;
    }

    navigation.navigate('SpeakingPrep', { test: item, taskIndex: 0 });
  };

  const getActionLabel = (item) => {
    if (item.status === 'inProgress') return 'Tiếp tục làm';
    if (item.status === 'done') return 'Làm lại';
    return 'Bắt đầu ngay';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openSpeakingTest(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={styles.cardIcon}>
            <Ionicons name="mic" size={20} color="#6A1B9A" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {item.tasks.length} part • {item.totalDuration} phút • {item.level}
            </Text>
            <Text style={styles.cardParts}>
              {item.tasks
                .map((task) => (task.partType || '').replace(/\s*-\s*.*/, ''))
                .join(' + ')}
            </Text>
            {item.status === 'inProgress' ? (
              <Text style={styles.cardDraftText}>Đang làm dở</Text>
            ) : null}
            {item.status === 'done' ? (
              <View style={styles.scoreWrap}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min((item.bestBand / 9) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.bandText}>{item.bestBand.toFixed(1)}/9.0</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRight}>
          {item.status === 'done' ? (
            <Text style={styles.doneText}>Đã làm</Text>
          ) : item.status === 'inProgress' ? (
            <Text style={styles.inProgressText}>Đang làm</Text>
          ) : (
            <Text style={styles.notDoneText}>Chưa làm</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={() => openSpeakingTest(item)}>
        <Text style={styles.actionBtnText}>{getActionLabel(item)}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luyện Nói</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroPad}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconBg}>
            <Ionicons name="mic" size={28} color="#fff" />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Kỹ năng Nói VSTEP</Text>
            <Text style={styles.heroSubtitle}>Mỗi đề gồm 3 part theo đúng format bài thi</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{tests.length} test</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>AI feedback</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.label}>
            <View style={styles.stepItem}>
              <View style={styles.stepIconBg}>
                <Ionicons name={step.icon} size={16} color="#6A1B9A" />
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
            {index < STEPS.length - 1 ? (
              <Ionicons
                name="chevron-forward"
                size={14}
                color="#B0BEC5"
                style={styles.stepArrow}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Text style={styles.listHeaderTitle}>Đề thi</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredTests.length}</Text>
          </View>
        </View>
        <Text style={styles.seeAll}>Xem tất cả</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6A1B9A" />
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTests();
              }}
              colors={['#6A1B9A']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mic-off-outline" size={60} color="#CFD8DC" />
              <Text style={styles.emptyText}>Chưa có đề thi nào cho trình độ này</Text>
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
    backgroundColor: '#6A1B9A',
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
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3E5F5',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E1BEE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepLabel: { fontSize: 10, color: '#6A1B9A', fontWeight: '600', textAlign: 'center' },
  stepArrow: { flexShrink: 0 },
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
  filterBtnActive: { backgroundColor: '#6A1B9A', borderColor: '#6A1B9A' },
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
    backgroundColor: '#6A1B9A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 14, color: '#6A1B9A', fontWeight: '600' },
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
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3, lineHeight: 22 },
  cardMeta: { fontSize: 13, color: '#757575', marginBottom: 4 },
  cardParts: { fontSize: 13, color: '#6A1B9A', fontWeight: '600' },
  cardDraftText: { marginTop: 8, fontSize: 13, color: '#8E24AA', fontWeight: '700' },
  scoreWrap: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F3E5F5',
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 999, backgroundColor: '#6A1B9A' },
  bandText: { fontSize: 12, color: '#6A1B9A', fontWeight: '800' },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  doneText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  inProgressText: { fontSize: 13, fontWeight: '700', color: '#8E24AA' },
  notDoneText: { fontSize: 13, fontWeight: '500', color: '#9E9E9E' },
  actionBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6A1B9A',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#6A1B9A' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 16, fontSize: 15, fontWeight: '500' },
});
