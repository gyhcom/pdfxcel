import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  // 사용률 계산 함수
  const getUploadProgress = () => {
    if (usageStatus.remainingUploads === 'unlimited') return 100;
    const total = planType === 'PRO' ? 100 : 5; // PRO는 무제한, FREE는 5개
    const used = total - (usageStatus.remainingUploads as number);
    return (used / total) * 100;
  };

  const getAiProgress = () => {
    if (usageStatus.remainingAiUploads === 'unlimited') return 100;
    const total = planType === 'PRO' ? 100 : 3; // PRO는 무제한, FREE는 3개
    const used = total - (usageStatus.remainingAiUploads as number);
    return (used / total) * 100;
  };

  return (
    <LinearGradient
      colors={planType === 'PRO' ? ['#f093fb', '#f5576c'] : ['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* 플랜 헤더 - 미니멀 */}
      <View style={styles.header}>
        <View style={styles.planBadge}>
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

      {/* 사용량 대시보드 - 원형 프로그레스 */}
      <View style={styles.dashboardContainer}>
        
        {/* 업로드 진행률 */}
        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <View style={[styles.circleProgress, { 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              borderWidth: getUploadProgress() > 0 ? 3 : 1,
            }]}>
              <Ionicons name="cloud-upload" size={24} color="white" />
            </View>
            <View style={[
              styles.progressBar,
              { width: `${getUploadProgress()}%`, backgroundColor: 'rgba(255, 255, 255, 0.6)' }
            ]} />
          </View>
          <Text style={styles.progressLabel}>업로드</Text>
          <Text style={styles.progressValue}>
            {usageStatus.remainingUploads === 'unlimited' ? '∞' : usageStatus.remainingUploads}
          </Text>
        </View>

        {/* AI 분석 진행률 */}
        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <View style={[styles.circleProgress, { 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              borderWidth: getAiProgress() > 0 ? 3 : 1,
            }]}>
              <Ionicons name="bulb" size={24} color="white" />
            </View>
            <View style={[
              styles.progressBar,
              { width: `${getAiProgress()}%`, backgroundColor: 'rgba(255, 255, 255, 0.6)' }
            ]} />
          </View>
          <Text style={styles.progressLabel}>AI 분석</Text>
          <Text style={styles.progressValue}>
            {usageStatus.remainingAiUploads === 'unlimited' ? '∞' : usageStatus.remainingAiUploads}
          </Text>
        </View>
      </View>

      {/* 상태 표시 및 리셋 정보 */}
      <View style={styles.footerContainer}>
        {/* 상태 아이콘들 */}
        <View style={styles.statusIcons}>
          {!usageStatus.canUpload && (
            <View style={styles.statusIcon}>
              <Ionicons name="close-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
            </View>
          )}
          {usageStatus.canUpload && !usageStatus.canUseAI && (
            <View style={styles.statusIcon}>
              <Ionicons name="warning" size={16} color="rgba(255, 255, 255, 0.8)" />
            </View>
          )}
          {usageStatus.canUpload && usageStatus.canUseAI && (
            <View style={styles.statusIcon}>
              <Ionicons name="checkmark-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
            </View>
          )}
        </View>
        
        {/* 리셌 시간 - 시각적 */}
        {planType === 'FREE' && (
          <View style={styles.resetInfo}>
            <Ionicons name="time" size={14} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.resetText}>내일 00:00 초기화</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  dashboardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  circleProgress: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    height: 4,
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  progressLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  progressValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIcons: {
    flexDirection: 'row',
  },
  statusIcon: {
    marginRight: SPACING.xs,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
});

export default UsageCard;