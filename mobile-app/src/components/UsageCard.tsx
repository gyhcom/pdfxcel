import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { UsageStatus } from '../types';


interface UsageCardProps {
  usageStatus: UsageStatus;
  planType: 'FREE' | 'PRO';
  onUpgradePress?: () => void;
  aiState?: {
    aiFreeUsedToday: boolean;
    adWatchedToday: boolean;
  };
}

const UsageCard: React.FC<UsageCardProps> = ({
  usageStatus,
  planType,
  onUpgradePress,
  aiState,
}) => {
  const formatRemaining = (remaining: number | 'unlimited'): string => {
    return remaining === 'unlimited' ? '무제한' : `${remaining}회`;
  };

  const getUsageColor = (remaining: number | 'unlimited'): string => {
    if (remaining === 'unlimited') return COLORS.success;
    if (remaining === 0) return COLORS.error;
    if (remaining <= 1) return COLORS.warning;
    return COLORS.primary;
  };


  return (
    <View style={[styles.container, { backgroundColor: planType === 'PRO' ? '#ffffff' : '#ffffff' }]}>
      {/* 플랜 헤더 - 미니멀 */}
      <View style={styles.header}>
        <View style={[styles.planBadge, { backgroundColor: planType === 'PRO' ? '#667eea' : '#64748b' }]}>
          <Ionicons 
            name={planType === 'PRO' ? 'diamond' : 'person'} 
            size={16} 
            color="white" 
          />
          <Text style={styles.planBadgeText}>
            {planType === 'PRO' ? 'PRO' : 'FREE'}
          </Text>
        </View>
        
        {planType === 'FREE' && onUpgradePress && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={onUpgradePress}
          >
            <Ionicons name="arrow-up" size={14} color="white" />
            <Text style={styles.upgradeButtonText}>업그레이드</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AI 전용 사용량 통계 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Ionicons name="sparkles" size={16} color="#667eea" />
            <Text style={styles.statLabel}>AI 변환</Text>
          </View>
          <Text style={styles.statValue}>
            {planType === 'PRO' 
              ? '무제한' 
              : aiState?.aiFreeUsedToday 
                ? '내일 다시 가능' 
                : aiState?.adWatchedToday 
                  ? '준비됨' 
                  : '광고 시청 필요'
            }
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Ionicons name="flash" size={16} color={planType === 'PRO' ? COLORS.success : COLORS.textSecondary} />
            <Text style={styles.statLabel}>처리 속도</Text>
          </View>
          <Text style={styles.statValue}>
            {planType === 'PRO' ? '2배 빠름' : '표준'}
          </Text>
        </View>
      </View>

      {/* 리셋 정보만 간단히 표시 */}
      {planType === 'FREE' && (
        <View style={styles.footerContainer}>
          <View style={styles.resetInfo}>
            <Ionicons name="time" size={14} color={COLORS.textSecondary} />
            <Text style={[styles.resetText, { color: COLORS.textSecondary }]}>내일 00:00 초기화</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  planBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
});

export default UsageCard;