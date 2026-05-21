import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { loadFullMockHistory } from '../../utils/fullMockTest';
import { useTheme } from '../../context/ThemeContext';

const formatDateTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MockTestHistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const { theme, isDarkMode } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadFullMockHistory().then(setItems).catch(() => setItems([]));
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Lần thi gần nhất</Text>
        <View style={styles.spacer} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('MockTestResult', { result: item })}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Mock Test #{String(items.length - index).padStart(2, '0')}</Text>
              <Text style={[styles.band, { color: isDarkMode ? '#64B5F6' : '#0F4C81' }]}>{item.overallBand?.toFixed(1) || '0.0'}</Text>
            </View>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{formatDateTime(item.completedAt)}</Text>
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: isDarkMode ? '#64B5F6' : '#0F4C81' }]}>Xem chi tiết 4 kỹ năng</Text>
              <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#64B5F6' : '#0F4C81'} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="albums-outline" size={52} color={theme.placeholder} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Chưa có bài thi 4 kỹ năng nào</Text>
          </View>
        }
      />
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
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  spacer: { width: 36, height: 36 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  band: { fontSize: 26, fontWeight: '900', color: '#0F4C81' },
  meta: { marginTop: 8, fontSize: 12, color: '#607D8B' },
  footer: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerText: { fontSize: 13, fontWeight: '800', color: '#0F4C81' },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#607D8B' },
});
