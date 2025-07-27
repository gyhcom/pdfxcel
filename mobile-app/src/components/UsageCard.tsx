import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { UsageStatus } from '../types';

interface UsageCardProps {
  usageStatus: UsageStatus;
  planType: 'FREE' | 'PRO';
  onUpgradePress?: () => void;
}

const UsageCard: React.FC<UsageCardProps> = ({
  usageStatus,
  planType,
  onUpgradePress,
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
    <View style={styles.container}>
      {/* 플랜 헤더 */}
      <View style={styles.header}>
        <View style={styles.planInfo}>
          <Ionicons 
            name={planType === 'PRO' ? 'star' : 'person'} 
            size={20} 
            color={planType === 'PRO' ? COLORS.warning : COLORS.primary} 
          />
          <Text style={[
            styles.planText,
            { color: planType === 'PRO' ? COLORS.warning : COLORS.primary }
          ]}>
            {planType === 'PRO' ? 'PRO 플랜' : 'FREE 플랜'}
          </Text>
        </View>
        
        {planType === 'FREE' && onUpgradePress && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={onUpgradePress}
          >
            <Text style={styles.upgradeButtonText}>업그레이드</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 사용량 정보 */}
      <View style={styles.usageContainer}>
        
        {/* 총 업로드 */}
        <View style={styles.usageItem}>
          <View style={styles.usageInfo}>
            <Ionicons name="cloud-upload" size={18} color={COLORS.primary} />
            <Text style={styles.usageLabel}>오늘 업로드</Text>
          </View>
          <Text style={[
            styles.usageValue,
            { color: getUsageColor(usageStatus.remainingUploads) }
          ]}>
            {formatRemaining(usageStatus.remainingUploads)} 남음
          </Text>
        </View>

        {/* AI 사용 */}
        <View style={styles.usageItem}>
          <View style={styles.usageInfo}>
            <Ionicons name="bulb" size={18} color={COLORS.secondary} />
            <Text style={styles.usageLabel}>AI 분석</Text>
          </View>
          <Text style={[
            styles.usageValue,
            { color: getUsageColor(usageStatus.remainingAiUploads) }
          ]}>
            {formatRemaining(usageStatus.remainingAiUploads)} 남음
          </Text>
        </View>
      </View>

      {/* 경고 메시지 */}
      {planType === 'FREE' && (
        <>
          {!usageStatus.canUpload && (
            <View style={[styles.warningContainer, { backgroundColor: COLORS.error + '20' }]}>
              <Ionicons name="warning" size={16} color={COLORS.error} />
              <Text style={[styles.warningText, { color: COLORS.error }]}>
                오늘의 업로드 한도를 모두 사용했습니다
              </Text>
            </View>
          )}
          
          {usageStatus.canUpload && !usageStatus.canUseAI && (
            <View style={[styles.warningContainer, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="information-circle" size={16} color={COLORS.warning} />
              <Text style={[styles.warningText, { color: COLORS.warning }]}>
                오늘의 AI 분석 한도를 모두 사용했습니다
              </Text>
            </View>
          )}
        </>
      )}

      {/* 리셋 시간 */}
      {planType === 'FREE' && usageStatus.resetTime && (
        <Text style={styles.resetText}>
          📅 내일 오전 12시에 초기화됩니다
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  upgradeButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  usageContainer: {
    marginBottom: SPACING.sm,
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  warningText: {
    fontSize: 13,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  resetText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default UsageCard;