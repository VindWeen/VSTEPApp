import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  SafeAreaView, StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSpeakingTests } from '../../services/api';

const FILTERS = ['Tất cả', 'B1', 'B2', 'C1'];

const MOCK_TESTS = [
  {
    _id: '1', title: 'Speaking Task 1: Describe a place', level: 'B1', duration: 90,
    status: 'done', score: 4.0, maxScore: 5.0,
  },
  {
    _id: '2', title: 'Speaking Task 2: Discuss advantages', level: 'B2', duration: 120,
    status: 'inProgress',
  },
  {
    _id: '3', title: 'Speaking Task 3: Opinion essay', level: 'C1', duration: 90,
    status: 'notDone',
  },
  {
    _id: '4', title: 'Speaking Task 4: Compare and contrast', level: 'B1', duration: 90,
    status: 'notDone',
  },
];

const STEPS = [
  { icon: 'eye-outline', label: 'Xem đề' },
  { icon: 'time-outline', label: 'Chuẩn bị' },
  { icon: 'mic-outline', label: 'Ghi âm' },
  { icon: 'person-outline', label: 'AI chấm' },
];

export default function SpeakingListScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const fetchTests = async () => {
    try {
      const res = await getSpeakingTests();
      const data = res.data?.data || [];
      setTests(data.length > 0 ? data : MOCK_TESTS);
    } catch {
      setTests(MOCK_TESTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const filteredTests = tests.filter(t =>
    activeFilter === 'Tất cả' ? true : t.level === activeFilter
  );

  const renderItem = ({ item }) => {
    const isDone = item.status === 'done';
    const isInProgress = item.status === 'inProgress';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SpeakingPrep', { test: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.cardIcon, isDone && styles.cardIconDone, isInProgress && styles.cardIconProgress]}>
            <Ionicons
              name="mic"
              size={20}
              color={isDone ? '#6A1B9A' : isInProgress ? '#6A1B9A' : '#B0BEC5'}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.duration} giây • {item.level}</Text>
            {isDone && item.score != null && (
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(item.score / (item.maxScore || 5)) * 100}%` }]} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardRight}>
          {isDone ? (
            <View style={styles.doneColumn}>
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>Đã làm</Text>
              </View>
              <Text style={styles.scoreText}>{item.score}/{item.maxScore || 5.0}</Text>
            </View>
          ) : isInProgress ? (
            <View style={styles.inProgressColumn}>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressText}>Đang làm</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.notDoneText}>Chưa làm</Text>
          )}
        </View>

        {isInProgress && (
          <View style={{ width: '100%', paddingTop: 10 }}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => navigation.navigate('SpeakingPrep', { test: item })}
            >
              <Text style={styles.continueBtnText}>Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luyện Nói</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroPad}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconBg}>
            <Ionicons name="mic" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Kỹ năng Nói VSTEP</Text>
            <Text style={styles.heroSubtitle}>Ghi âm + AI phân tích tức thì</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="mic-outline" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}> 60+ Bài</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="person-outline" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}> AI Feedback</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Step process */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <View style={styles.stepItem}>
              <View style={styles.stepIconBg}>
                <Ionicons name={s.icon} size={16} color="#6A1B9A" />
              </View>
              <Text style={styles.stepLabel}>{s.label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <Ionicons name="chevron-forward" size={14} color="#B0BEC5" style={styles.stepArrow} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.filterScroll}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>
          Đề thi <Text style={styles.countText}>{filteredTests.length}</Text>
        </Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6A1B9A" />
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTests(); }} colors={['#6A1B9A']} />
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 10, backgroundColor: '#F5F7FA',
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },

  heroPad: { paddingHorizontal: 16, paddingBottom: 12 },
  heroCard: {
    backgroundColor: '#6A1B9A', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  heroIconBg: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  heroBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  stepsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3E5F5',
    marginHorizontal: 16, borderRadius: 16, marginBottom: 12,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepIconBg: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E1BEE7',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stepLabel: { fontSize: 10, color: '#6A1B9A', fontWeight: '600', textAlign: 'center' },
  stepArrow: { flexShrink: 0 },

  filterScroll: { paddingHorizontal: 16, paddingBottom: 4, flexDirection: 'row', alignItems: 'flex-start' },
  filterBtn: {
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: '#6A1B9A', borderColor: '#6A1B9A' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#757575' },
  filterTextActive: { color: '#fff' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  countText: { color: '#6A1B9A', fontWeight: '800' },
  seeAll: { fontSize: 14, color: '#6A1B9A', fontWeight: '600' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#F0F2F5',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  cardIconDone: { backgroundColor: '#F3E5F5' },
  cardIconProgress: { backgroundColor: '#EDE7F6' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3, lineHeight: 22 },
  cardMeta: { fontSize: 13, color: '#757575', marginBottom: 6 },
  progressBarBg: { height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6A1B9A', borderRadius: 2 },

  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  doneColumn: { alignItems: 'flex-end', gap: 4 },
  doneBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  doneBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  scoreText: { fontSize: 15, fontWeight: '800', color: '#6A1B9A' },
  inProgressColumn: { alignItems: 'flex-end' },
  inProgressBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  inProgressText: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  notDoneText: { fontSize: 13, fontWeight: '500', color: '#9E9E9E' },

  continueBtn: {
    backgroundColor: '#6A1B9A', borderRadius: 12, paddingVertical: 11,
    alignItems: 'center',
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 16, fontSize: 15, fontWeight: '500' },
});
