import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SKILL_CARDS = [
  { id: 'Listening', title: 'Nghe', subtitle: 'Listening', color: '#1565C0', icon: 'headset', route: 'Listening' },
  { id: 'Reading', title: 'Đọc', subtitle: 'Reading', color: '#2E7D32', icon: 'book', route: 'Reading' },
  { id: 'Writing', title: 'Viết', subtitle: 'Writing', color: '#E65100', icon: 'create', route: 'Writing' },
  { id: 'Speaking', title: 'Nói', subtitle: 'Speaking', color: '#6A1B9A', icon: 'mic', route: 'SpeakingTab' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const userName = user?.name ? user.name.split(' ').pop() : 'bạn';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào, {userName}! 👋</Text>
            <Text style={styles.subtitle}>Sẵn sàng luyện tập VSTEP hôm nay?</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <MaterialCommunityIcons name="account-circle" size={48} color="#1565C0" />
          </TouchableOpacity>
        </View>

        {/* Progress Widget */}
        <View style={styles.progressWidget}>
          <Text style={styles.widgetTitle}>Tiến độ của bạn</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="documents-outline" size={24} color="#1565C0" style={{marginBottom: 4}} />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Bài đã làm</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="star-outline" size={24} color="#F57C00" style={{marginBottom: 4}} />
              <Text style={styles.statValue}>B1</Text>
              <Text style={styles.statLabel}>Trung bình</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="flame-outline" size={24} color="#D32F2F" style={{marginBottom: 4}} />
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Ngày liên tiếp</Text>
            </View>
          </View>
        </View>

        {/* Skill Cards */}
        <Text style={styles.sectionTitle}>Chọn kỹ năng</Text>
        <View style={styles.grid}>
          {SKILL_CARDS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.skillCard, { backgroundColor: item.color }]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.skillTitle}>{item.title}</Text>
              <Text style={styles.skillSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, marginTop: 10
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  avatarBtn: { borderRadius: 24, backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2 },
  
  progressWidget: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 32,
    elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8
  },
  widgetTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  skillCard: {
    width: (width - 56) / 2, // (screen width - paddings) / 2
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4,
    minHeight: 140,
    justifyContent: 'center'
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  skillTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  skillSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
});
