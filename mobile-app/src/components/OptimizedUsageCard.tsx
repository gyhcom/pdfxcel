/**
 * 성능 최적화된 사용량 카드 컴포넌트
 * React.memo와 useMemo를 활용한 렌더링 최적화
 */

import React, { memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { UsageStatus } from '../types';

interface OptimizedUsageCardProps {
  usageStatus: UsageStatus;
  planType: 'FREE' | 'PRO';
  onUpgradePress: () => void;
  style?: ViewStyle;
}

const OptimizedUsageCard: React.FC<OptimizedUsageCardProps> = memo(({
  usageStatus,
  planType,
  onUpgradePress,
  style
}) => {
  // 계산된 값들을 메모이제이션
  const progressPercentage = useMemo(() => {
    if (planType === 'PRO') return 0; // PRO는 무제한
    
    const dailyLimit = planType === 'FREE' ? 5 : 50;
    return Math.min((usageStatus.dailyUploads / dailyLimit) * 100, 100);
  }, [usageStatus.dailyUploads, planType]);

  const remainingUploads = useMemo(() => {
    if (planType === 'PRO') return '무제한';
    
    const dailyLimit = planType === 'FREE' ? 5 : 50;
    const remaining = Math.max(0, dailyLimit - usageStatus.dailyUploads);
    return `${remaining}회`;
  }, [usageStatus.dailyUploads, planType]);

  const progressColor = useMemo(() => {
    if (planType === 'PRO') return COLORS.success;
    if (progressPercentage >= 80) return COLORS.error;
    if (progressPercentage >= 60) return COLORS.warning;
    return COLORS.primary;
  }, [progressPercentage, planType]);

  const statusText = useMemo(() => {
    if (planType === 'PRO') return 'PRO 플랜 - 무제한 사용';
    
    const dailyLimit = planType === 'FREE' ? 5 : 50;
    return `오늘 ${usageStatus.dailyUploads}/${dailyLimit}회 사용`;
  }, [usageStatus.dailyUploads, planType]);

  // 업그레이드 버튼 표시 여부
  const shouldShowUpgrade = useMemo(() => {
    return planType === 'FREE' && progressPercentage >= 60;
  }, [planType, progressPercentage]);

  // 콜백 메모이제이션
  const handleUpgradePress = useCallback(() => {
    onUpgradePress();
  }, [onUpgradePress]);

  // 스타일 메모이제이션
  const progressBarStyle = useMemo(() => ({
    width: `${progressPercentage}%`,
    backgroundColor: progressColor,
  }), [progressPercentage, progressColor]);

  const cardContainerStyle = useMemo(() => [
    styles.container,
    planType === 'PRO' && styles.proContainer,
    style
  ], [planType, style]);

  return (
    <View style={cardContainerStyle}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.planBadge, { backgroundColor: progressColor }]}>
            <Ionicons 
              name={planType === 'PRO' ? 'diamond' : 'person'} 
              size={16} 
              color="white" 
            />
          </View>
          <Text style={styles.planTitle}>
            {planType === 'PRO' ? 'PRO 플랜' : 'FREE 플랜'}
          </Text>
        </View>
        
        {shouldShowUpgrade && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={handleUpgradePress}
            activeOpacity={0.7}
          >
            <Text style={styles.upgradeButtonText}>업그레이드</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 사용량 정보 */}
      <View style={styles.usageInfo}>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.remainingText}>
          남은 횟수: <Text style={styles.remainingCount}>{remainingUploads}</Text>
        </Text>
      </View>

      {/* 진행률 바 */}
      {planType !== 'PRO' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, progressBarStyle]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
        </View>
      )}

      {/* 추가 통계 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{usageStatus.dailyAiUploads || 0}</Text>
          <Text style={styles.statLabel}>AI 분석</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{usageStatus.dailyBasicUploads || 0}</Text>
          <Text style={styles.statLabel}>기본 추출</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{usageStatus.monthlyUploads || 0}</Text>
          <Text style={styles.statLabel}>이번 달</Text>
        </View>
      </View>
    </View>
  );
});

// 컴포넌트 이름 설정 (디버깅용)
OptimizedUsageCard.displayName = 'OptimizedUsageCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  proContainer: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planBadge: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  usageInfo: {
    marginBottom: SPACING.md,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  remainingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  remainingCount: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
});

export default OptimizedUsageCard;