import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  SafeAreaView, StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReadingTests } from '../../services/api';

const LEVEL_COLORS = { A2: '#FF9800', B1: '#4CAF50', B2: '#2196F3', C1: '#9C27B0' };
const FILTERS = ['Tất cả', 'A2', 'B1', 'B2', 'C1'];

// Mock data for when backend doesn't have reading tests yet
const MOCK_TESTS = [
  { _id: '1', title: 'Đề Đọc Số 1 - B1', level: 'B1', totalQuestions: 30, duration: 60, status: 'done', score: 27 },
  { _id: '2', title: 'Đề Đọc Số 2 - B1', level: 'B1', totalQuestions: 30, duration: 60, status: 'notDone' },
  { _id: '3', title: 'Đề Đọc Số 3 - B2', level: 'B2', totalQuestions: 35, duration: 75, status: 'notDone' },
  { _id: '4', title: 'Đề Đọc Số 4 - B2', level: 'B2', totalQuestions: 35, duration: 75, status: 'notDone' },
];

export default function ReadingListScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const fetchTests = async () => {
    try {
      const res = await getReadingTests();
      const data = res.data?.data || [];
      setTests(data.length > 0 ? data : MOCK_TESTS);
    } catch (e) {
      // Use mock data if API not available yet
      setTests(MOCK_TESTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const filteredTests = tests.filter(test => {
    if (activeFilter === 'Tất cả') return true;
    return test.level === activeFilter;
  });

  const renderItem = ({ item }) => {
    const isDone = item.status === 'done';
    const isInProgress = item.status === 'inProgress';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ReadingDetail', { test: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.cardIcon, isDone && styles.cardIconDone]}>
            <Ionicons
              name="document-text"
              size={22}
              color={isDone ? '#2E7D32' : isInProgress ? '#1565C0' : '#B0BEC5'}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {item.totalQuestions} câu • {item.duration} phút
            </Text>
            {isDone && item.score != null && (
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(item.score / item.totalQuestions) * 100}%` }]} />
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
              <Text style={styles.scoreText}>{item.score}/{item.totalQuestions}</Text>
            </View>
          ) : isInProgress ? (
            <View style={styles.inProgressBadge}>
              <Text style={styles.inProgressText}>Đang làm</Text>
            </View>
          ) : (
            <Text style={styles.notDoneText}>Chưa làm</Text>
          )}
        </View>
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
        <Text style={styles.headerTitle}>Luyện Đọc</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
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
                <Text style={styles.heroBadgeText}> 80+ Bài</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="layers-outline" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}> 3 Dạng câu</Text>
              </View>
            </View>
          </View>
        </View>
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

      {/* Count header */}
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Text style={styles.listHeaderTitle}>Đề thi</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredTests.length}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTests(); }} colors={['#2E7D32']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#CFD8DC" />
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
    backgroundColor: '#2E7D32', borderRadius: 20, padding: 20,
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

  filterScroll: { paddingHorizontal: 16, paddingBottom: 4, flexDirection: 'row', alignItems: 'center' },
  filterBtn: {
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E0E0',
    marginRight: 8, alignSelf: 'flex-start',
  },
  filterBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#757575' },
  filterTextActive: { color: '#fff' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
  },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: '#2E7D32', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
    minWidth: 24, alignItems: 'center', justifyContent: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#F0F2F5',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  cardIconDone: { backgroundColor: '#E8F5E9' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  cardMeta: { fontSize: 13, color: '#757575', marginBottom: 6 },
  progressBarBg: {
    height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 2 },

  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  doneColumn: { alignItems: 'flex-end', gap: 4 },
  doneBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  doneBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  scoreText: { fontSize: 15, fontWeight: '800', color: '#2E7D32' },
  inProgressBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  inProgressText: { fontSize: 12, fontWeight: '700', color: '#1565C0' },
  notDoneText: { fontSize: 13, fontWeight: '500', color: '#9E9E9E' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 16, fontSize: 15, fontWeight: '500' },
});
