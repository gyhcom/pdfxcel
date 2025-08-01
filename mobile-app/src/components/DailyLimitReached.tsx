import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { aiOnlyService } from '../services/aiOnlyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyLimitReachedProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

const DailyLimitReached: React.FC<DailyLimitReachedProps> = ({
  visible,
  onClose,
  onSubscribe,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!visible) return;

    const updateTimer = () => {
      const time = aiOnlyService.getTimeUntilTomorrow();
      setTimeLeft(time);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 메인 아이콘과 메시지 */}
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.limitIcon}>
                <Ionicons name="hourglass" size={40} color="#ff6b6b" />
              </View>
            </View>
            <Text style={styles.title}>오늘의 무료 변환 완료! 🎉</Text>
            <Text style={styles.subtitle}>
              무료 AI 변환을 모두 사용하셨습니다.{'\n'}
              더 많은 변환이 필요하시다면?
            </Text>
          </View>

          {/* 타이머 */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCard}>
              <Ionicons name="time" size={24} color="#667eea" />
              <View style={styles.timerText}>
                <Text style={styles.timerLabel}>다음 무료 변환까지</Text>
                <Text style={styles.timerValue}>
                  {timeLeft.hours}시간 {timeLeft.minutes}분
                </Text>
              </View>
            </View>
          </View>

          {/* PRO 혜택 강조 */}
          <View style={styles.proFeaturesContainer}>
            <Text style={styles.proFeaturesTitle}>PRO로 지금 바로 변환하기</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="infinite" size={18} color="white" />
                </View>
                <Text style={styles.featureText}>무제한 AI 변환</Text>
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>HOT</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="flash" size={18} color="white" />
                </View>
                <Text style={styles.featureText}>2배 빠른 처리 속도</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="shield-checkmark" size={18} color="white" />
                </View>
                <Text style={styles.featureText}>광고 없는 깔끔한 경험</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="cloud" size={18} color="white" />
                </View>
                <Text style={styles.featureText}>클라우드 무제한 저장</Text>
              </View>
            </View>
          </View>

          {/* 할인 가격 */}
          <View style={styles.pricingContainer}>
            <View style={styles.discountBanner}>
              <Text style={styles.discountText}>🔥 첫 달 50% 할인</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceOld}>월 ₩9,900</Text>
              <Text style={styles.priceNew}>월 ₩4,900</Text>
            </View>
          </View>

          {/* 액션 버튼들 */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.subscribeButton} onPress={onSubscribe}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.subscribeGradient}
              >
                <Text style={styles.subscribeButtonText}>PRO로 지금 변환하기</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.waitButton} onPress={onClose}>
              <Text style={styles.waitButtonText}>내일 다시 시도하기</Text>
            </TouchableOpacity>
          </View>

          {/* 작은 글씨 안내 */}
          <Text style={styles.disclaimer}>
            언제든지 구독을 취소할 수 있습니다
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: 34, // iOS Safe Area
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    paddingBottom: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  limitIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ff6b6b20',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  timerContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#667eea20',
  },
  timerText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  proFeaturesContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  proFeaturesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  featuresList: {
    gap: SPACING.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  hotBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  hotBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pricingContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  discountBanner: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  discountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  priceOld: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  priceNew: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
  },
  actionContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  subscribeButton: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
  },
  waitButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  waitButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default DailyLimitReached;