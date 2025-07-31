import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { userPlanService } from '../services/userPlanService';
import { UsageStatus } from '../types';
import UsageCard from '../components/UsageCard';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [planType, setPlanType] = useState<'FREE' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(true);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const stats = await userPlanService.getUsageStats();
      setUsageStatus(stats.usageStatus);
      setPlanType(stats.plan);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 화면이 포커스될 때마다 사용량 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadUsageData();
    }, [])
  );

  const handleStartConversion = async () => {
    if (!usageStatus) {
      navigation.navigate('Upload');
      return;
    }

    // 업로드 가능 여부 확인
    const canUploadResult = await userPlanService.canUpload(false);
    
    if (!canUploadResult.allowed) {
      Alert.alert(
        '업로드 제한',
        canUploadResult.reason || '업로드가 제한되었습니다.',
        [
          { text: '확인', style: 'default' },
          ...(planType === 'FREE' ? [
            { 
              text: 'PRO 업그레이드', 
              style: 'default' as const,
              onPress: handleUpgradePress 
            }
          ] : [])
        ]
      );
      return;
    }

    navigation.navigate('Upload');
  };

  const handleUpgradePress = () => {
    Alert.alert(
      'PRO 플랜 업그레이드',
      'PRO 플랜으로 업그레이드하면 무제한으로 PDF를 변환할 수 있습니다.',
      [
        { text: '나중에', style: 'cancel' },
        { 
          text: '개발용 PRO 활성화', 
          style: 'default',
          onPress: async () => {
            await userPlanService.setProUser(true);
            await loadUsageData();
          }
        }
      ]
    );
  };

  const handlePlanToggle = async () => {
    const isCurrentlyPro = planType === 'PRO';
    Alert.alert(
      '플랜 변경 (개발용)',
      `${isCurrentlyPro ? 'FREE' : 'PRO'} 플랜으로 변경하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '변경', 
          style: 'default',
          onPress: async () => {
            await userPlanService.setProUser(!isCurrentlyPro);
            await loadUsageData();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 새로운 헤더 섹션 - 간결하고 모던한 디자인 */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>안녕하세요! 😊</Text>
            <Text style={styles.title}>PDFXcel</Text>
            <Text style={styles.subtitle}>
              PDF 은행 명세서를 Excel로 빠르게 변환하세요
            </Text>
          </View>
        </View>

        {/* 메인 기능 그리드 - 2x2 카드 레이아웃 */}
        <View style={styles.mainGrid}>
          <TouchableOpacity 
            style={[styles.gridCard, styles.uploadCard]}
            onPress={handleStartConversion}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="cloud-upload" size={28} color="white" />
            </View>
            <Text style={styles.cardTitle}>PDF 업로드</Text>
            <Text style={styles.cardSubtitle}>파일 선택하기</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, styles.historyCard]}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="time" size={28} color="white" />
            </View>
            <Text style={styles.cardTitle}>변환 기록</Text>
            <Text style={styles.cardSubtitle}>이전 파일들</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, styles.aiCard]}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="bulb" size={28} color="white" />
            </View>
            <Text style={styles.cardTitle}>AI 분석</Text>
            <Text style={styles.cardSubtitle}>지능형 추출</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, styles.excelCard]}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="grid" size={28} color="white" />
            </View>
            <Text style={styles.cardTitle}>Excel 변환</Text>
            <Text style={styles.cardSubtitle}>즉시 사용가능</Text>
          </TouchableOpacity>
        </View>

        {/* 사용량 카드 */}
        {!loading && usageStatus && (
          <UsageCard
            usageStatus={usageStatus}
            planType={planType}
            onUpgradePress={handleUpgradePress}
          />
        )}

        {/* 개발용 플랜 토글 버튼 */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.devButton}
            onPress={handlePlanToggle}
          >
            <Ionicons name="settings" size={16} color={COLORS.textSecondary} />
            <Text style={styles.devButtonText}>
              개발용: {planType} 플랜 토글
            </Text>
          </TouchableOpacity>
        )}

        {/* 추가 기능들 - 작은 카드 형태 */}
        <Text style={styles.sectionTitle}>추가 기능</Text>
        <View style={styles.additionalFeaturesContainer}>
          <TouchableOpacity style={styles.smallCard}>
            <View style={styles.smallCardIcon}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.smallCardTitle}>보안</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallCard}>
            <View style={styles.smallCardIcon}>
              <Ionicons name="settings" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.smallCardTitle}>설정</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.smallCard}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.smallCardIcon}>
              <Ionicons name="document-text" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.smallCardTitle}>정책</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallCard}>
            <View style={styles.smallCardIcon}>
              <Ionicons name="help-circle" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.smallCardTitle}>도움말</Text>
          </TouchableOpacity>
        </View>


        {/* 간단한 안내 정보 */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            <Text style={styles.infoTitle}>안전한 처리</Text>
            <Text style={styles.infoText}>업로드된 파일은 24시간 후 자동 삭제</Text>
          </View>
          
          {/* 개인정보 처리방침 링크 */}
          <TouchableOpacity 
            style={styles.privacyLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={styles.privacyLinkText}>개인정보 처리방침</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  // 메인 그리드 스타일
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  gridCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  // 각 카드별 색상
  uploadCard: {
    backgroundColor: '#FF6B6B', // 빨간색
  },
  historyCard: {
    backgroundColor: '#4ECDC4', // 청록색
  },
  aiCard: {
    backgroundColor: '#45B7D1', // 파란색
  },
  excelCard: {
    backgroundColor: '#96CEB4', // 녹색
  },
  // 섹션 제목 스타일
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  // 추가 기능 컨테이너
  additionalFeaturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  smallCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  smallCardIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  smallCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.sm,
  },
  devButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  privacyLink: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  privacyLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default HomeScreen;