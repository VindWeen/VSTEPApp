import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  SafeAreaView, StatusBar, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getListeningTests } from '../../services/api';

const FILTERS = ['Tất cả', 'A2', 'B1', 'B2', 'C1'];

export default function ListeningListScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const fetchTests = async () => {
    try {
      const res = await getListeningTests();
      setTests(res.data.data);
    } catch (e) {
      console.error('Lỗi load đề:', e.message);
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
    const status = item.status || 'Chưa làm';
    const isDone = status === 'Hoàn thành' || status === 'done';
    const isInProgress = status === 'Đang làm' || status === 'inProgress';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ListeningDetail', { test: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.cardIcon, isDone && styles.cardIconDone, isInProgress && styles.cardIconProgress]}>
            <Ionicons
              name="headset"
              size={20}
              color={isDone ? '#1565C0' : isInProgress ? '#1565C0' : '#B0BEC5'}
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
              <Text style={styles.scoreText}>
                {item.score ?? '—'}/{item.totalQuestions}
              </Text>
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
        <Text style={styles.headerTitle}>Luyện Nghe</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroPad}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconBg}>
            <Ionicons name="headset" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Kỹ năng Nghe VSTEP</Text>
            <Text style={styles.heroSubtitle}>3 phần thi chuẩn format</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="headset-outline" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}> 120+ Bài</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="person-outline" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}> AI Phản hồi</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.filterScroll}
      >
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
          <ActivityIndicator size="large" color="#1565C0" />
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
              onRefresh={() => { setRefreshing(true); fetchTests(); }}
              colors={['#1565C0']}
            />
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
    backgroundColor: '#1565C0', borderRadius: 20, padding: 20,
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
  filterBtnActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#757575' },
  filterTextActive: { color: '#fff' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
  },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: '#1565C0', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
    minWidth: 24, alignItems: 'center', justifyContent: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 14, color: '#1565C0', fontWeight: '600' },

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
  cardIconDone: { backgroundColor: '#E3F2FD' },
  cardIconProgress: { backgroundColor: '#EDE7F6' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  cardMeta: { fontSize: 13, color: '#757575', marginBottom: 6 },
  progressBarBg: { height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#1565C0', borderRadius: 2 },

  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  doneColumn: { alignItems: 'flex-end', gap: 4 },
  doneBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  doneBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  scoreText: { fontSize: 15, fontWeight: '800', color: '#1565C0' },
  inProgressBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  inProgressText: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  notDoneText: { fontSize: 13, fontWeight: '500', color: '#9E9E9E' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 16, fontSize: 15, fontWeight: '500' },
});
