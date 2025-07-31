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

        {/* 메인 액션 버튼 - 가장 눈에 잘 띄는 위치로 이동 */}
        <TouchableOpacity 
          style={styles.mainActionButton}
          onPress={handleStartConversion}
          activeOpacity={0.8}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="cloud-upload" size={32} color="white" />
            <Text style={styles.mainActionText}>파일 선택 및 변환 시작</Text>
            <Text style={styles.mainActionSubtext}>PDF 파일을 선택해주세요</Text>
          </View>
        </TouchableOpacity>

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

        {/* 간단한 기능 소개 - 카드 형태로 요약 */}
        <View style={styles.quickFeaturesContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="bulb" size={28} color={COLORS.primary} />
            <Text style={styles.featureCardTitle}>AI 자동 분석</Text>
            <Text style={styles.featureCardDesc}>지능형 데이터 추출</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Ionicons name="grid" size={28} color={COLORS.primary} />
            <Text style={styles.featureCardTitle}>Excel 변환</Text>
            <Text style={styles.featureCardDesc}>즉시 사용 가능한 형태</Text>
          </View>
        </View>

        {/* 보조 액션 버튼 */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.8}
        >
          <Ionicons name="time" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>변환 기록 보기</Text>
        </TouchableOpacity>

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
  // 메인 액션 버튼 스타일
  mainActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  actionButtonContent: {
    alignItems: 'center',
  },
  mainActionText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  mainActionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  // 새로운 기능 카드 스타일
  quickFeaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  featureCardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  // 보조 버튼 스타일
  secondaryButton: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.xs,
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