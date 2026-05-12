import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReadingListScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={64} color="#2E7D32" />
        </View>
        <Text style={styles.title}>Luyện Đọc</Text>
        <Text style={styles.subtitle}>Tính năng Đọc hiểu đang được phát triển. Vui lòng quay lại sau nhé!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconContainer: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
});
