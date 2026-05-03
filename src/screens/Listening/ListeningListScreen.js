import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getListeningTests } from '../../services/api';

const LEVEL_COLORS = { B1: '#4CAF50', B2: '#2196F3', C1: '#9C27B0' };

export default function ListeningListScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ListeningDetail', { test: item })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[item.level] || '#888' }]}>
          <Text style={styles.levelText}>{item.level}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.metaText}>⏱ {item.duration} phút</Text>
        <Text style={styles.metaText}>📝 {item.totalQuestions} câu</Text>
        <Text style={styles.startText}>Bắt đầu →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải đề thi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎧 Luyện Nghe</Text>
        <Text style={styles.headerSub}>Chọn đề thi để bắt đầu luyện tập</Text>
      </View>
      <FlatList
        data={tests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTests(); }} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có đề thi nào</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15 },
  header: {
    backgroundColor: '#1565C0', paddingTop: 56, paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: '#BBDEFB', marginTop: 4 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 14, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', flex: 1 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  levelText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardDesc: { color: '#666', fontSize: 14, marginTop: 8, lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12, gap: 12,
  },
  metaText: { color: '#888', fontSize: 13 },
  startText: { marginLeft: 'auto', color: '#2196F3', fontWeight: '700', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
});
