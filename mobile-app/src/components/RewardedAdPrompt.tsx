import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RewardedAdPromptProps {
  visible: boolean;
  onClose: () => void;
  onWatchAd: () => Promise<void>;
  onSubscribe: () => void;
}

const RewardedAdPrompt: React.FC<RewardedAdPromptProps> = ({
  visible,
  onClose,
  onWatchAd,
  onSubscribe,
}) => {
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const handleWatchAd = async () => {
    try {
      setIsWatchingAd(true);
      await onWatchAd();
    } catch (error) {
      console.error('Error watching ad:', error);
    } finally {
      setIsWatchingAd(false);
    }
  };

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

          {/* AI 아이콘과 제목 */}
          <View style={styles.titleContainer}>
            <View style={styles.aiIconContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.aiIconGradient}
              >
                <Ionicons name="sparkles" size={32} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>AI 변환 잠금 해제 🚀</Text>
            <Text style={styles.subtitle}>
              오늘의 무료 AI 변환을 사용하려면{'\n'}
              짧은 광고를 시청해주세요!
            </Text>
          </View>

          {/* AI 변환 혜택 미리보기 */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="sparkles" size={20} color="#667eea" />
              <Text style={styles.benefitText}>AI 지능형 데이터 인식</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="document-text" size={20} color="#667eea" />
              <Text style={styles.benefitText}>정확한 표 구조 분석</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#667eea" />
              <Text style={styles.benefitText}>자동 데이터 검증</Text>
            </View>
          </View>

          {/* 광고 시청 버튼 */}
          <TouchableOpacity 
            style={styles.watchAdButton}
            onPress={handleWatchAd}
            disabled={isWatchingAd}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.watchAdGradient}
            >
              {isWatchingAd ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={24} color="white" />
                  <Text style={styles.watchAdText}>광고 보고 무료 변환하기</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* 구분선과 PRO 옵션 */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* PRO 업그레이드 옵션 */}
          <View style={styles.proContainer}>
            <View style={styles.proHeader}>
              <Ionicons name="diamond" size={20} color="#667eea" />
              <Text style={styles.proTitle}>PRO로 업그레이드</Text>
            </View>
            <Text style={styles.proSubtitle}>
              무제한 AI 변환 + 광고 없음 + 2배 빠른 처리
            </Text>
            <TouchableOpacity style={styles.proButton} onPress={onSubscribe}>
              <Text style={styles.proButtonText}>PRO 시작하기</Text>
              <Ionicons name="arrow-forward" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>

          {/* 작은 글씨 안내 */}
          <Text style={styles.disclaimer}>
            📺 광고는 하루 1회만 시청 가능합니다
          </Text>
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
    paddingBottom: 34, // iOS Safe Area
    maxHeight: '80%',
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
  aiIconContainer: {
    marginBottom: SPACING.md,
  },
  aiIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  benefitsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  benefitText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: SPACING.md,
    fontWeight: '500',
  },
  watchAdButton: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  watchAdGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  watchAdText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.md,
  },
  proContainer: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: '#f8f9ff',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#667eea20',
    marginBottom: SPACING.lg,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  proTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginLeft: SPACING.sm,
  },
  proSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  proButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginRight: SPACING.sm,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default RewardedAdPrompt;