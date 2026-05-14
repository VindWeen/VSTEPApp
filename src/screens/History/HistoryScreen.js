import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMyResults, getWritingHistory, getSpeakingHistory } from '../../services/api';

const SKILL_TABS = [
  { key: 'all', label: 'Tất cả', icon: 'grid', color: '#546E7A' },
  { key: 'listening', label: 'Nghe', icon: 'headset', color: '#1565C0' },
  { key: 'writing', label: 'Viết', icon: 'create', color: '#00695C' },
  { key: 'speaking', label: 'Nói', icon: 'mic', color: '#6A1B9A' },
];

const SKILL_COLORS = {
  listening: '#1565C0',
  writing: '#00695C',
  speaking: '#6A1B9A',
};

const BAND_COLOR = (b) => {
  if (!b) return '#888';
  if (b >= 4.5) return '#2196F3';
  if (b >= 3.5) return '#4CAF50';
  if (b >= 2.5) return '#FFC107';
  return '#EF5350';
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function HistoryScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchResults = async (skill) => {
    try {
      let res;
      if (skill === 'writing') {
        res = await getWritingHistory({});
      } else if (skill === 'speaking') {
        res = await getSpeakingHistory({});
      } else {
        const params = skill !== 'all' ? { skill } : {};
        res = await getMyResults(params);
      }
      setResults(res.data.data);
    } catch (e) {
      console.error('Lỗi load history:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload khi focus tab (sau khi nộp bài mới)
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

  const renderItem = ({ item }) => {
    const color = SKILL_COLORS[item.skill] || '#888';
    const bandScore = item.bandScore ?? item.estimatedBand;
    const isNumeric = typeof bandScore === 'number';
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.skillDot, { backgroundColor: color }]} />
          <View>
            <Text style={styles.testTitle} numberOfLines={1}>{item.testTitle || item.skill}</Text>
            <Text style={styles.meta}>{item.level} • {formatDate(item.completedAt || item.createdAt)}</Text>
            {item.skill === 'listening' && (
              <Text style={styles.scoreLine}>
                Đúng: {item.score}/{item.totalQuestions} ({item.percentage}%)
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.bandBadge, { backgroundColor: BAND_COLOR(isNumeric ? bandScore : parseInt(bandScore)) }]}>
          <Text style={styles.bandText}>
            {isNumeric ? bandScore : bandScore || '—'}
          </Text>
          <Text style={styles.bandSmall}>Band</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Ionicons name="bar-chart" size={26} color="#fff" />
          <Text style={styles.headerTitle}>Lịch sử luyện tập</Text>
        </View>
        <Text style={styles.headerSub}>Theo dõi tiến trình của bạn</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {SKILL_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { ...styles.tabActive, borderBottomColor: tab.color }]}
            onPress={() => handleTabChange(tab.key)}
          >
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <Ionicons 
                name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`} 
                size={16} 
                color={activeTab === tab.key ? tab.color : '#888'} 
              />
              <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#546E7A" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchResults(activeTab); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={48} color="#B0BEC5" style={{marginBottom: 12}} />
              <Text style={styles.emptyText}>Chưa có kết quả nào</Text>
              <Text style={styles.emptyHint}>Hãy thử làm một bài Nghe, Viết hoặc Nói!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#37474F', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: '#B0BEC5', marginTop: 4 },
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 12, color: '#888', fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  skillDot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  testTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', maxWidth: 220 },
  meta: { color: '#888', fontSize: 12, marginTop: 2 },
  scoreLine: { color: '#555', fontSize: 12, marginTop: 2 },
  bandBadge: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  bandText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  bandSmall: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#555' },
  emptyHint: { color: '#aaa', fontSize: 13, marginTop: 6 },
});
