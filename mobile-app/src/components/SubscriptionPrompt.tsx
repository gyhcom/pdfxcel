import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SubscriptionPromptProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  trigger: 'usage_limit' | 'feature_locked' | 'speed_boost' | 'ad_free';
}

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({
  visible,
  onClose,
  onSubscribe,
  trigger,
}) => {
  const getPromptContent = () => {
    switch (trigger) {
      case 'usage_limit':
        return {
          title: '오늘의 변환 횟수를 모두 사용했어요 😅',
          subtitle: 'PRO로 업그레이드하고 무제한으로 변환하세요!',
          benefits: [
            { icon: 'infinite', text: '무제한 PDF 변환', highlight: true },
            { icon: 'flash', text: '2배 빠른 변환 속도' },
            { icon: 'sparkles', text: 'AI 지능형 분석' },
            { icon: 'cloud', text: '클라우드 무제한 저장' },
          ],
        };
      case 'feature_locked':
        return {
          title: 'AI 분석은 PRO 전용 기능이에요 🤖',
          subtitle: '더 정확한 데이터 추출을 경험해보세요!',
          benefits: [
            { icon: 'sparkles', text: 'AI 지능형 데이터 분석', highlight: true },
            { icon: 'infinite', text: '무제한 PDF 변환' },
            { icon: 'flash', text: '우선 처리 (2배 빠름)' },
            { icon: 'shield-checkmark', text: '광고 없는 깔끔한 경험' },
          ],
        };
      case 'speed_boost':
        return {
          title: '더 빠른 변환이 필요하신가요? ⚡',
          subtitle: 'PRO 사용자는 우선 처리로 2배 빠르게!',
          benefits: [
            { icon: 'flash', text: '2배 빠른 변환 속도', highlight: true },
            { icon: 'infinite', text: '무제한 변환' },
            { icon: 'sparkles', text: 'AI 분석 포함' },
            { icon: 'download', text: '우선 다운로드' },
          ],
        };
      case 'ad_free':
        return {
          title: '광고 없이 깔끔하게 사용하세요 ✨',
          subtitle: 'PRO로 업그레이드하고 방해받지 마세요!',
          benefits: [
            { icon: 'shield-checkmark', text: '광고 완전 제거', highlight: true },
            { icon: 'infinite', text: '무제한 변환' },
            { icon: 'flash', text: '빠른 변환 속도' },
            { icon: 'sparkles', text: 'AI 분석 기능' },
          ],
        };
      default:
        return {
          title: 'PRO로 업그레이드하세요!',
          subtitle: '더 많은 기능을 사용해보세요',
          benefits: [],
        };
    }
  };

  const content = getPromptContent();

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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 타이틀 */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            {/* PRO 배지 */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proBadge}
            >
              <Ionicons name="diamond" size={20} color="white" />
              <Text style={styles.proBadgeText}>PDFXcel PRO</Text>
            </LinearGradient>

            {/* 혜택 리스트 */}
            <View style={styles.benefitsList}>
              {content.benefits.map((benefit, index) => (
                <View key={index} style={[styles.benefitItem, benefit.highlight && styles.benefitHighlight]}>
                  <View style={[styles.benefitIcon, benefit.highlight && styles.benefitIconHighlight]}>
                    <Ionicons 
                      name={benefit.icon as any} 
                      size={18} 
                      color={benefit.highlight ? '#667eea' : COLORS.primary} 
                    />
                  </View>
                  <Text style={[styles.benefitText, benefit.highlight && styles.benefitTextHighlight]}>
                    {benefit.text}
                  </Text>
                  {benefit.highlight && (
                    <View style={styles.highlightBadge}>
                      <Text style={styles.highlightBadgeText}>HOT</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* 가격 정보 */}
            <View style={styles.pricingContainer}>
              <View style={styles.pricingCard}>
                <Text style={styles.priceOld}>월 ₩9,900</Text>
                <Text style={styles.priceNew}>월 ₩4,900</Text>
                <Text style={styles.priceNote}>50% 할인 (첫 달)</Text>
              </View>
            </View>

            {/* 액션 버튼들 */}
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.subscribeButton} onPress={onSubscribe}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.subscribeGradient}
                >
                  <Text style={styles.subscribeButtonText}>PRO로 업그레이드</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                <Text style={styles.laterButtonText}>나중에 하기</Text>
              </TouchableOpacity>
            </View>

            {/* 작은 글씨 안내 */}
            <Text style={styles.disclaimer}>
              언제든지 설정에서 구독을 취소할 수 있습니다
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: 34, // iOS Safe Area
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
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  proBadgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  benefitsList: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  benefitHighlight: {
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
    borderColor: '#667eea20',
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  benefitIconHighlight: {
    backgroundColor: '#667eea10',
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  benefitTextHighlight: {
    fontWeight: '600',
    color: '#667eea',
  },
  highlightBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  highlightBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pricingContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  pricingCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  priceOld: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  priceNew: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: SPACING.xs,
  },
  priceNote: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
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
  laterButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  laterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 18,
  },
});

export default SubscriptionPrompt;