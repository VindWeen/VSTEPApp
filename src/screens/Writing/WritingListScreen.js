import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  SafeAreaView, StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWritingTests } from '../../services/api';

const FILTERS = ['Tất cả', 'B1', 'B2', 'C1'];

const MOCK_TESTS = [
  {
    _id: '1', title: 'Writing Task 2: Môi trường và Xã hội',
    level: 'B2', taskType: 'Task 2', duration: 40, minWords: 250,
    status: 'done', score: 4.0, maxScore: 5.0,
  },
  {
    _id: '2', title: 'Writing Task 1: Formal Letter',
    level: 'B1', taskType: 'Task 1', duration: 20, minWords: 150,
    status: 'inProgress',
  },
  {
    _id: '3', title: 'Writing Task 2: Giáo dục Truyền thống',
    level: 'C1', taskType: 'Task 2', duration: 40, minWords: 250,
    status: 'notDone',
  },
  {
    _id: '4', title: 'Writing Task 1: Biểu đồ cột',
    level: 'B2', taskType: 'Task 1', duration: 20, minWords: 150,
    status: 'notDone',
  },
];

export default function WritingListScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const fetchTests = async () => {
    try {
      const res = await getWritingTests();
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
        onPress={() => navigation.navigate('WritingCompose', { test: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.cardIcon, isDone && styles.cardIconDone, isInProgress && styles.cardIconProgress]}>
              <Ionicons
                name="create"
                size={20}
                color={isDone ? '#E65100' : isInProgress ? '#E65100' : '#B0BEC5'}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.duration} phút • {item.minWords} từ</Text>
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
                <Text style={styles.scoreText}>{item.score?.toFixed(1)}/{item.maxScore || 5.0}</Text>
              </View>
            ) : isInProgress ? (
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressText}>Đang{'\n'}làm</Text>
              </View>
            ) : (
              <Text style={styles.notDoneText}>Chưa làm</Text>
            )}
          </View>
        </View>

        {(isInProgress || item.status === 'notDone') && (
          <TouchableOpacity
            style={[styles.actionBtn, isInProgress ? styles.continueBtnStyle : styles.startBtnStyle]}
            onPress={() => navigation.navigate('WritingCompose', { test: item })}
          >
            <Text style={[styles.actionBtnText, !isInProgress && styles.startBtnText]}>
              {isInProgress ? 'Tiếp tục làm' : 'Bắt đầu ngay'}
            </Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Luyện Viết</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroPad}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconBg}>
            <Ionicons name="create" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Kỹ năng Viết VSTEP</Text>
            <Text style={styles.heroSubtitle}>2 dạng bài chuẩn format</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeEmoji}>✍️</Text>
                <Text style={styles.heroBadgeText}> 80+ Bài</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeEmoji}>🤖</Text>
                <Text style={styles.heroBadgeText}> AI Chấm điểm</Text>
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
          <ActivityIndicator size="large" color="#E65100" />
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTests(); }} colors={['#E65100']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="create-outline" size={60} color="#CFD8DC" />
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
    backgroundColor: '#E65100', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  heroIconBg: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  heroBadgeEmoji: { fontSize: 11 },
  heroBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  filterScroll: { paddingHorizontal: 16, paddingBottom: 4, flexDirection: 'row', alignItems: 'flex-start' },
  filterBtn: {
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: '#E65100', borderColor: '#E65100' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#757575' },
  filterTextActive: { color: '#fff' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  countText: { color: '#E65100', fontWeight: '800' },
  seeAll: { fontSize: 14, color: '#E65100', fontWeight: '600' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#F0F2F5',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  cardIconDone: { backgroundColor: '#FBE9E7' },
  cardIconProgress: { backgroundColor: '#FFF3E0' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3, lineHeight: 22 },
  cardMeta: { fontSize: 13, color: '#757575', marginBottom: 6 },
  progressBarBg: { height: 4, backgroundColor: '#FFE0B2', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#E65100', borderRadius: 2 },

  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  doneColumn: { alignItems: 'flex-end', gap: 4 },
  doneBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  doneBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  scoreText: { fontSize: 15, fontWeight: '800', color: '#E65100' },
  inProgressBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  inProgressText: { fontSize: 12, fontWeight: '700', color: '#E65100', textAlign: 'center' },
  notDoneText: { fontSize: 13, fontWeight: '500', color: '#9E9E9E' },

  actionBtn: {
    marginTop: 12, borderRadius: 12, paddingVertical: 11, alignItems: 'center',
  },
  continueBtnStyle: { backgroundColor: '#E65100' },
  startBtnStyle: { borderWidth: 1.5, borderColor: '#E65100', backgroundColor: '#fff' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  startBtnText: { color: '#E65100' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 16, fontSize: 15, fontWeight: '500' },
});
