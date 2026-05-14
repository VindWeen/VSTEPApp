import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState('B1');

  const handleNext = async () => {
    if (currentIndex < 2) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      navigation.navigate('Auth', { screen: 'Register', params: { level: selectedLevel } });
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    navigation.navigate('Auth', { screen: 'Login' });
  };

  if (currentIndex === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1E88E5', '#1565C0', '#0D47A1']} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.slide1Content}>
              {/* Logo Area */}
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle}>
                  <MaterialCommunityIcons name="school" size={56} color="#1565C0" />
                </View>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.slide1Title}>VSTEP Practice</Text>
              <Text style={styles.slide1Subtitle}>Luyện thi VSTEP thông minh cùng AI</Text>
              
              {/* Tags */}
              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <MaterialCommunityIcons name="circle-half-full" size={14} color="#FFF" style={{marginRight: 4}} />
                  <Text style={styles.tagText}>AI Powered</Text>
                </View>
                <View style={styles.tag}>
                  <Ionicons name="stats-chart" size={14} color="#FFF" style={{marginRight: 4}} />
                  <Text style={styles.tagText}>4 Kỹ năng</Text>
                </View>
              </View>
              <View style={styles.tagsContainer2}>
                <View style={styles.tag}>
                  <Ionicons name="star" size={14} color="#FFF" style={{marginRight: 4}} />
                  <Text style={styles.tagText}>Chuẩn VSTEP</Text>
                </View>
              </View>

              {/* Mock Chart */}
              <View style={styles.mockChartContainer}>
                {[1, 2, 3, 4].map((i) => {
                  const randomHeight = Math.floor(Math.random() * 50) + 40; // Random height from 40 to 90
                  return (
                    <View key={i} style={[styles.chartCol, { height: randomHeight }]}>
                      <View style={styles.chartColInner} />
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Bottom Sheet */}
            <View style={styles.bottomCard}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
                <Text style={styles.primaryBtnText}>Bắt đầu</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Auth', { screen: 'Login' })}>
                <Text style={styles.loginLink}>Đã có tài khoản? <Text style={styles.loginLinkBold}>Đăng nhập</Text></Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaWhite}>
      {/* HEADER */}
      {currentIndex === 1 ? (
        <View style={styles.headerSlide2}>
          <View style={styles.headerLogo}>
            <View style={styles.smallLogoBg}>
              <MaterialCommunityIcons name="school" size={16} color="#FFF" />
            </View>
            <Text style={styles.headerLogoText}>VSTEP</Text>
          </View>
          <TouchableOpacity style={styles.skipPillBtn} onPress={handleSkip}>
            <Text style={styles.skipPillText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.headerSlide3}>
          <TouchableOpacity style={styles.backPillBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={18} color="#1A1A1A" style={{marginRight: 4}} />
            <Text style={styles.backPillText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONTENT */}
      <View style={styles.content}>
        
        {currentIndex === 1 && (
          <View style={styles.slide2Content}>
            {/* Big Circle */}
            <View style={styles.bigBlueCircle}>
              <Ionicons name="headset" size={70} color="#FFF" />
              {/* Decorative small circles */}
              <View style={styles.decoCircle1} />
              <View style={styles.decoCircle2} />
              <View style={styles.decoCircle3}>
                <Ionicons name="help" size={10} color="#1565C0" />
              </View>
            </View>
            
            {/* Sound Wave */}
            <View style={styles.soundWave}>
              {[...Array(9)].map((_, i) => (
                <View key={i} style={[
                  styles.waveBar, 
                  {height: [15, 25, 40, 25, 50, 40, 25, 15, 10][i]},
                  i === 4 ? {backgroundColor: '#1565C0'} : null
                ]} />
              ))}
            </View>

            <View style={styles.slide2TagPill}>
              <Ionicons name="headset-outline" size={14} color="#1565C0" style={{marginRight: 6}} />
              <Text style={styles.slide2TagText}>KỸ NĂNG NGHE</Text>
            </View>
            
            <Text style={styles.slideTitle}>Luyện Nghe VSTEP</Text>
            <Text style={styles.slideSubtitle}>
              3 phần thi chuẩn format VSTEP với bài nghe thực tế, đa dạng chủ đề và phản hồi chi tiết
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>120+</Text>
                <Text style={styles.statLabel}>Bài nghe</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Phần thi</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>AI</Text>
                <Text style={styles.statLabel}>Phản hồi</Text>
              </View>
            </View>
          </View>
        )}

        {currentIndex === 2 && (
          <View style={styles.slide3Content}>
            {/* Progress Bar */}
            <View style={styles.topProgressBar}>
              <View style={[styles.progressSegment, {backgroundColor: '#1565C0'}]} />
              <View style={[styles.progressSegment, {backgroundColor: '#1565C0'}]} />
              <View style={[styles.progressSegment, {backgroundColor: '#E2E8F0'}]} />
            </View>

            <Text style={styles.slideTitleLeft}>Bạn đang ở trình độ nào?</Text>
            <Text style={styles.slideSubtitleLeft}>Chọn mức độ phù hợp để bắt đầu luyện tập hiệu quả nhất</Text>
            
            <View style={styles.levelsContainer}>
              {[
                { id: 'A2', title: 'Sơ cấp', desc: 'Ngữ pháp cơ bản, từ vựng đơn giản', color: '#4CAF50', bg: '#E8F5E9' },
                { id: 'B1', title: 'Trung cấp', desc: 'Giao tiếp hàng ngày, hiểu văn bản đơn giản', color: '#1565C0', bg: '#E3F2FD' },
                { id: 'B2', title: 'Trên trung cấp', desc: 'Thảo luận phức tạp, đọc tài liệu chuyên ngành', color: '#F57C00', bg: '#FFF3E0' },
                { id: 'C1', title: 'Nâng cao', desc: 'Thành thạo, gần như người bản ngữ', color: '#9C27B0', bg: '#F3E5F5' },
              ].map((level) => {
                const isSelected = selectedLevel === level.id;
                return (
                  <TouchableOpacity 
                    key={level.id} 
                    style={[styles.levelCard, isSelected && styles.levelCardActive]}
                    onPress={() => setSelectedLevel(level.id)}
                    activeOpacity={0.8}
                  >
                    {/* Left Icon */}
                    <View style={[styles.levelIconBadge, {backgroundColor: level.bg}]}>
                      <Text style={[styles.levelIconText, {color: level.color}]}>{level.id}</Text>
                    </View>
                    
                    <View style={styles.levelInfo}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.levelTitle}>{level.title}</Text>
                        <View style={[styles.miniBadge, {backgroundColor: level.bg}]}>
                          <Text style={[styles.miniBadgeText, {color: level.color}]}>{level.id}</Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.miniBadge, {backgroundColor: '#E3F2FD', marginLeft: 4}]}>
                            <Text style={[styles.miniBadgeText, {color: '#1565C0', fontSize: 10}]}>Mục tiêu</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.levelDesc}>{level.desc}</Text>
                    </View>
                    
                    {/* Radio Button */}
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#1565C0" style={{marginRight: 8}} />
              <Text style={styles.infoBoxText}>Bạn có thể thay đổi trình độ bất cứ lúc nào trong phần Cài đặt</Text>
            </View>
          </View>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {currentIndex === 1 && (
          <>
            <View style={styles.dotsContainer}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipBtnText}>Bỏ qua</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Tiếp theo</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {currentIndex === 2 && (
          <TouchableOpacity style={styles.primaryBtnFlat} onPress={handleNext}>
            <Text style={styles.primaryBtnFlatText}>Xác nhận</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  safeAreaWhite: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'space-between' },
  
  // SLIDE 1
  slide1Content: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  outerCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  innerCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  slide1Title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  slide1Subtitle: { fontSize: 16, color: '#E3F2FD', textAlign: 'center', marginBottom: 24 },
  
  tagsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  tagsContainer2: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  
  mockChartContainer: { flexDirection: 'row', gap: 16, alignItems: 'flex-end', height: 80, marginTop: 'auto', marginBottom: 40 },
  chartCol: { width: 32, height: 80, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, justifyContent: 'flex-end', padding: 4 },
  chartColInner: { width: '100%', height: 24, backgroundColor: '#FFFFFF', borderRadius: 8 },

  bottomCard: { backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 32 },
  primaryBtn: { backgroundColor: '#1565C0', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loginLink: { textAlign: 'center', color: '#64748B', fontSize: 14 },
  loginLinkBold: { color: '#1565C0', fontWeight: '700' },

  // HEADER SLIDES
  headerSlide2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  headerLogo: { flexDirection: 'row', alignItems: 'center' },
  smallLogoBg: { backgroundColor: '#1565C0', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerLogoText: { color: '#1565C0', fontWeight: '800', fontSize: 18 },
  skipPillBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  skipPillText: { color: '#64748B', fontWeight: '600', fontSize: 14 },

  headerSlide3: { paddingHorizontal: 24, paddingTop: 16 },
  backPillBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  backPillText: { color: '#64748B', fontWeight: '600', fontSize: 14 },

  // COMMON CONTENT
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  slideTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 12 },
  slideSubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  slideTitleLeft: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  slideSubtitleLeft: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 24 },

  // SLIDE 2 CONTENT
  slide2Content: { alignItems: 'center' },
  bigBlueCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#1A73E8', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 10, shadowColor: '#1A73E8', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20 },
  decoCircle1: { position: 'absolute', top: 20, left: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  decoCircle2: { position: 'absolute', bottom: 30, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  decoCircle3: { position: 'absolute', top: 20, right: 15, width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },
  soundWave: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 32, height: 50 },
  waveBar: { width: 4, backgroundColor: '#93C5FD', borderRadius: 2 },
  slide2TagPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  slide2TagText: { color: '#1565C0', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748B' },

  // SLIDE 3 CONTENT
  slide3Content: { flex: 1 },
  topProgressBar: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  levelsContainer: { gap: 12 },
  levelCard: { flexDirection: 'row', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  levelCardActive: { backgroundColor: '#F0F7FF', borderColor: '#1565C0', borderWidth: 2 },
  levelIconBadge: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  levelIconText: { fontSize: 18, fontWeight: '800' },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginRight: 8 },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniBadgeText: { fontSize: 10, fontWeight: '700' },
  levelDesc: { fontSize: 13, color: '#64748B', marginTop: 4, paddingRight: 10 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { backgroundColor: '#1565C0', borderColor: '#1565C0' },

  infoBox: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginTop: 24, flexDirection: 'row', alignItems: 'center' },
  infoBoxText: { color: '#1565C0', fontSize: 13, lineHeight: 20, flex: 1 },

  // FOOTER
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotActive: { backgroundColor: '#1565C0', width: 24 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  skipBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  skipBtnText: { color: '#64748B', fontSize: 16, fontWeight: '700' },
  nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#1565C0', flexDirection: 'row', justifyContent: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  
  primaryBtnFlat: { backgroundColor: '#1565C0', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnFlatText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
