/**
 * 사용자 피드백 수집 모달
 * 앱 리뷰, 버그 리포트, 개선 제안 등을 수집
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { useSafeState } from '../hooks/useSafeState';
import crashReporter from '../utils/crashReporter';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (feedback: FeedbackData) => Promise<void>;
}

export interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'review';
  rating?: number; // 1-5 별점
  title: string;
  description: string;
  email?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    appVersion: string;
  };
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const [feedbackType, setFeedbackType] = useSafeState<FeedbackData['type']>('general');
  const [rating, setRating] = useSafeState<number>(5);
  const [title, setTitle] = useSafeState<string>('');
  const [description, setDescription] = useSafeState<string>('');
  const [email, setEmail] = useSafeState<string>('');
  const [submitting, setSubmitting] = useSafeState<boolean>(false);

  const feedbackTypes = [
    { id: 'review', label: '앱 리뷰', icon: 'star', color: COLORS.warning },
    { id: 'bug', label: '버그 신고', icon: 'bug', color: COLORS.error },
    { id: 'feature', label: '기능 제안', icon: 'bulb', color: COLORS.primary },
    { id: 'general', label: '기타 의견', icon: 'chatbubble', color: COLORS.textSecondary },
  ] as const;

  const handleClose = useCallback(() => {
    setFeedbackType('general');
    setRating(5);
    setTitle('');
    setDescription('');
    setEmail('');
    setSubmitting(false);
    onClose();
  }, [onClose, setFeedbackType, setRating, setTitle, setDescription, setEmail, setSubmitting]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const feedbackData: FeedbackData = {
        type: feedbackType,
        rating: feedbackType === 'review' ? rating : undefined,
        title: title.trim(),
        description: description.trim(),
        email: email.trim() || undefined,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
          appVersion: '1.0.0', // 실제 앱 버전으로 교체
        },
      };

      if (onSubmit) {
        await onSubmit(feedbackData);
      } else {
        // 기본 처리: 콘솔 로그 및 로컬 저장
        console.log('📝 Feedback submitted:', feedbackData);
        
        // 크래시 리포터를 통해 피드백 저장 (임시 방법)
        crashReporter.reportCrash(new Error('User Feedback'), {
          context: 'FeedbackModal.handleSubmit',
          feedbackData: JSON.stringify(feedbackData),
          type: 'user_feedback'
        });
      }

      Alert.alert(
        '피드백 전송 완료',
        '소중한 의견을 보내주셔서 감사합니다. 검토 후 반영하도록 하겠습니다.',
        [{ text: '확인', onPress: handleClose }]
      );

    } catch (error) {
      console.error('Feedback submission error:', error);
      Alert.alert(
        '전송 실패',
        '피드백 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    title, description, feedbackType, rating, email, onSubmit, 
    setSubmitting, handleClose
  ]);

  const renderStarRating = () => {
    if (feedbackType !== 'review') return null;

    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>별점을 선택해주세요</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? COLORS.warning : COLORS.border}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 1 && '매우 불만족'}
          {rating === 2 && '불만족'}
          {rating === 3 && '보통'}
          {rating === 4 && '만족'}
          {rating === 5 && '매우 만족'}
        </Text>
      </View>
    );
  };

  const getPlaceholderText = () => {
    switch (feedbackType) {
      case 'bug':
        return '발생한 버그를 자세히 설명해주세요. 언제 발생했는지, 어떤 상황에서 발생했는지 포함해주시면 도움이 됩니다.';
      case 'feature':
        return '원하시는 기능이나 개선사항을 자세히 설명해주세요. 어떤 문제를 해결하고 싶으신지 포함해주시면 좋습니다.';
      case 'review':
        return '앱을 사용하시면서 느끼신 점들을 자유롭게 말씀해주세요. 좋았던 점이나 아쉬웠던 점 모두 환영합니다.';
      default:
        return '의견이나 제안사항을 자유롭게 작성해주세요.';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>피드백 보내기</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 피드백 유형 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>피드백 유형</Text>
            <View style={styles.typeGrid}>
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    feedbackType === type.id && styles.typeButtonActive
                  ]}
                  onPress={() => setFeedbackType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={feedbackType === type.id ? 'white' : type.color}
                  />
                  <Text style={[
                    styles.typeButtonText,
                    feedbackType === type.id && styles.typeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 별점 (리뷰인 경우) */}
          {renderStarRating()}

          {/* 제목 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>제목 *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="간단한 제목을 입력해주세요"
              placeholderTextColor={COLORS.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* 내용 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내용 *</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder={getPlaceholderText()}
              placeholderTextColor={COLORS.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {description.length}/1000
            </Text>
          </View>

          {/* 이메일 (선택사항) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>이메일 (답변 받기)</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="답변을 받으실 이메일 주소 (선택사항)"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />
          </View>

          {/* 개인정보 처리 안내 */}
          <View style={styles.privacyNotice}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.privacyText}>
              입력하신 정보는 피드백 처리 목적으로만 사용되며, 
              별도 동의 없이 제3자에게 제공되지 않습니다.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim()}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? '전송 중...' : '피드백 전송'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  ratingContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.success + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  privacyText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  submitButton: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default FeedbackModal;