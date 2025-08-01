import React, { useState, useCallback } from 'react';
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
import { aiOnlyService, UserAIState } from '../services/aiOnlyService';
import { UsageStatus } from '../types';
import UsageCard from '../components/UsageCard';
import ModernCard, { HorizontalCardList, TileGrid, PlateGrid } from '../components/ModernCard';
import SubscriptionPrompt from '../components/SubscriptionPrompt';
import RewardedAdPrompt from '../components/RewardedAdPrompt';
import DailyLimitReached from '../components/DailyLimitReached';

const ICON_SIZE = 28;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [planType, setPlanType] = useState<'FREE' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(true);
  const [aiState, setAiState] = useState<UserAIState | null>(null);
  const [subscriptionPrompt, setSubscriptionPrompt] = useState<{
    visible: boolean;
    trigger: 'usage_limit' | 'feature_locked' | 'speed_boost' | 'ad_free';
  }>({
    visible: false,
    trigger: 'usage_limit',
  });
  const [rewardedAdPrompt, setRewardedAdPrompt] = useState(false);
  const [dailyLimitModal, setDailyLimitModal] = useState(false);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const stats = await userPlanService.getUsageStats();
      const aiUserState = await aiOnlyService.getUserAIState();
      
      setUsageStatus(stats.usageStatus);
      setPlanType(stats.plan);
      setAiState(aiUserState);
      
      // AI 서비스와 기존 서비스 동기화
      if (stats.plan === 'PRO' && !aiUserState.isProUser) {
        await aiOnlyService.setProUser(true);
        setAiState(await aiOnlyService.getUserAIState());
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadUsageData(); }, []));

  const handleStartConversion = async () => {
    const aiAvailability = await aiOnlyService.canUseAI();
    
    switch (aiAvailability.reason) {
      case 'pro_unlimited':
        // PRO 사용자는 바로 변환
        navigation.navigate('Upload');
        break;
        
      case 'need_ad':
        // 광고 시청 필요
        setRewardedAdPrompt(true);
        break;
        
      case 'free_available':
        // 무료 사용 가능 (광고 시청 완료)
        navigation.navigate('Upload');
        break;
        
      case 'need_subscription':
        // 오늘 사용량 소진, PRO 구독 필요
        setDailyLimitModal(true);
        break;
        
      default:
        navigation.navigate('Upload');
    }
  };

  const handleAIAnalysis = () => {
    if (planType === 'FREE') {
      setSubscriptionPrompt({
        visible: true,
        trigger: 'feature_locked',
      });
      return;
    }
    // AI 분석 로직
  };

  const handleSpeedBoost = () => {
    if (planType === 'FREE') {
      setSubscriptionPrompt({
        visible: true,
        trigger: 'speed_boost',
      });
      return;
    }
    // 빠른 변환 로직
  };

  const handleUpgradePress = () => {
    setSubscriptionPrompt({
      visible: true,
      trigger: 'usage_limit',
    });
  };

  const handleWatchAd = async () => {
    try {
      // 실제로는 Google AdMob이나 다른 광고 SDK 호출
      // 여기서는 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await aiOnlyService.markAdWatched();
      await loadUsageData();
      setRewardedAdPrompt(false);
      
      Alert.alert(
        '🎉 광고 시청 완료!',
        '오늘의 무료 AI 변환이 활성화되었습니다!',
        [{ text: '변환하기', onPress: () => navigation.navigate('Upload') }]
      );
    } catch (error) {
      Alert.alert('오류', '광고 로딩 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleSubscribe = async () => {
    // 실제 구독 처리 로직 (Apple/Google 인앱 결제)
    try {
      // 개발용으로 임시 PRO 활성화
      await userPlanService.setProUser(true);
      await aiOnlyService.setProUser(true);
      await loadUsageData();
      
      // 모든 모달 닫기
      setSubscriptionPrompt({ visible: false, trigger: 'usage_limit' });
      setRewardedAdPrompt(false);
      setDailyLimitModal(false);
      
      Alert.alert(
        '🎉 업그레이드 완료!',
        'PRO 플랜이 활성화되었습니다. 무제한으로 PDF를 변환해보세요!',
        [{ text: '시작하기', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('오류', '업그레이드 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleCloseSubscriptionPrompt = () => {
    setSubscriptionPrompt({ visible: false, trigger: 'usage_limit' });
  };

  const handlePlanToggle = async () => {
    const isPro = planType === 'PRO';
    Alert.alert('플랜 변경 (개발용)', `${isPro ? 'FREE' : 'PRO'} 플랜으로 변경하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '변경', onPress: async () => {
        await userPlanService.setProUser(!isPro);
        await loadUsageData();
      }}
    ]);
  };

  // 카드 데이터 정의 - AI 전용
  const getMainCardSubtitle = () => {
    if (planType === 'PRO') return 'AI 무제한 변환';
    if (aiState?.adWatchedToday && !aiState?.aiFreeUsedToday) return 'AI 변환 준비됨';
    if (aiState?.aiFreeUsedToday) return '내일 다시 가능';
    return '광고 보고 AI 변환';
  };

  const mainCards = [
    {
      title: 'AI PDF 변환',
      subtitle: getMainCardSubtitle(),
      icon: 'sparkles',
      color: '#667eea',
      onPress: handleStartConversion,
    },
    {
      title: '변환 기록',
      subtitle: '이전 파일들',
      icon: 'time',
      color: '#4ECDC4',
      onPress: () => navigation.navigate('History'),
    },
    {
      title: '프리미엄 변환',
      subtitle: planType === 'FREE' ? 'PRO 전용' : '고급 AI 분석',
      icon: 'diamond',
      color: '#45B7D1',
      onPress: handleAIAnalysis,
    },
    {
      title: 'Excel 내보내기',
      subtitle: '완벽한 표 형식',
      icon: 'grid',
      color: '#96CEB4',
      onPress: () => navigation.navigate('History'),
    },
  ];

  const quickActions = [
    {
      title: '빠른 변환',
      subtitle: planType === 'FREE' ? '2배 빠름 (PRO)' : '우선 처리',
      icon: 'flash',
      color: '#FF8A80',
      onPress: handleSpeedBoost,
    },
    {
      title: '광고 제거',
      subtitle: planType === 'FREE' ? 'PRO 전용' : '광고 없음',
      icon: 'shield-checkmark',
      color: '#82B1FF',
      onPress: () => {
        if (planType === 'FREE') {
          setSubscriptionPrompt({
            visible: true,
            trigger: 'ad_free',
          });
        }
      },
    },
    {
      title: '도움말',
      subtitle: '사용 가이드',
      icon: 'help-circle',
      color: '#A5D6A7',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>안녕하세요! 😊</Text>
          <Text style={styles.title}>PDFXcel</Text>
          <Text style={styles.subtitle}>PDF 은행 명세서를 Excel로 빠르게 변환하세요</Text>
        </View>

        {/* 메인 기능 카드들 - 타일 그리드 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>주요 기능</Text>
        </View>
        <TileGrid cards={mainCards} />

        {/* 빠른 액션 - 작은 플레이트 카드들 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>빠른 액션</Text>
        </View>
        <PlateGrid cards={quickActions} />

        {!loading && usageStatus && (
          <UsageCard 
            usageStatus={usageStatus} 
            planType={planType} 
            onUpgradePress={handleUpgradePress}
            aiState={aiState ? {
              aiFreeUsedToday: aiState.aiFreeUsedToday,
              adWatchedToday: aiState.adWatchedToday,
            } : undefined}
          />
        )}

        {__DEV__ && (
          <View>
            <TouchableOpacity style={styles.devButton} onPress={handlePlanToggle}>
              <Ionicons name="settings" size={16} color={COLORS.textSecondary} />
              <Text style={styles.devButtonText}>개발용: {planType} 플랜 토글</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.devButton} 
              onPress={async () => {
                await aiOnlyService.resetForTesting();
                await loadUsageData();
                Alert.alert('리셋 완료', 'AI 사용량이 초기화되었습니다.');
              }}
            >
              <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
              <Text style={styles.devButtonText}>개발용: AI 상태 리셋</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 구독 프롬프트 */}
      <SubscriptionPrompt
        visible={subscriptionPrompt.visible}
        trigger={subscriptionPrompt.trigger}
        onClose={handleCloseSubscriptionPrompt}
        onSubscribe={handleSubscribe}
      />

      {/* 리워드 광고 프롬프트 */}
      <RewardedAdPrompt
        visible={rewardedAdPrompt}
        onClose={() => setRewardedAdPrompt(false)}
        onWatchAd={handleWatchAd}
        onSubscribe={handleSubscribe}
      />

      {/* 일일 사용량 소진 모달 */}
      <DailyLimitReached
        visible={dailyLimitModal}
        onClose={() => setDailyLimitModal(false)}
        onSubscribe={handleSubscribe}
      />
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
  sectionHeader: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.3,
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
});

export default HomeScreen;
