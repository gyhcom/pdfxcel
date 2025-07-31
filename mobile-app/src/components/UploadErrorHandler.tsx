import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { ApiError } from '../services/apiService';

interface UploadErrorHandlerProps {
  visible: boolean;
  error: ApiError | Error | null;
  onRetry: () => void;
  onCancel: () => void;
  fileName?: string;
}

const UploadErrorHandler: React.FC<UploadErrorHandlerProps> = ({
  visible,
  error,
  onRetry,
  onCancel,
  fileName
}) => {
  const getErrorIcon = (errorCode?: string) => {
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return 'cloud-offline';
      case 'FILE_TOO_LARGE':
        return 'warning';
      case 'TIMEOUT_ERROR':
        return 'time';
      case 'SERVER_ERROR':
        return 'server';
      default:
        return 'alert-circle';
    }
  };

  const getErrorTitle = (errorCode?: string) => {
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return '네트워크 연결 오류';
      case 'FILE_TOO_LARGE':
        return '파일 크기 초과';
      case 'TIMEOUT_ERROR':
        return '요청 시간 초과';
      case 'SERVER_ERROR':
        return '서버 오류';
      case 'BAD_REQUEST':
        return '잘못된 파일 형식';
      default:
        return '업로드 실패';
    }
  };

  const getErrorSolution = (errorCode?: string) => {
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return [
          'Wi-Fi 또는 모바일 데이터 연결을 확인해주세요',
          '네트워크 상태가 안정된 후 다시 시도해주세요'
        ];
      case 'FILE_TOO_LARGE':
        return [
          '파일 크기는 최대 10MB까지 지원됩니다',
          '더 작은 파일로 다시 시도해주세요'
        ];
      case 'TIMEOUT_ERROR':
        return [
          '네트워크 연결이 느려 시간이 초과되었습니다',
          '잠시 후 다시 시도해주세요'
        ];
      case 'SERVER_ERROR':
        return [
          '서버에 일시적인 문제가 발생했습니다',
          '잠시 후 다시 시도해주세요'
        ];
      case 'BAD_REQUEST':
        return [
          'PDF 파일만 업로드 가능합니다',
          '올바른 PDF 파일을 선택해주세요'
        ];
      default:
        return [
          '알 수 없는 오류가 발생했습니다',
          '다시 시도해주세요'
        ];
    }
  };

  const isApiError = (err: any): err is ApiError => {
    return err && typeof err === 'object' && 'code' in err;
  };

  const errorCode = isApiError(error) ? error.code : undefined;
  const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다';
  const solutions = getErrorSolution(errorCode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getErrorIcon(errorCode)} 
              size={48} 
              color={COLORS.error} 
            />
          </View>

          <Text style={styles.title}>{getErrorTitle(errorCode)}</Text>
          
          {fileName && (
            <Text style={styles.fileName}>파일: {fileName}</Text>
          )}
          
          <Text style={styles.message}>{errorMessage}</Text>

          <View style={styles.solutionContainer}>
            <Text style={styles.solutionTitle}>해결 방법:</Text>
            {solutions.map((solution, index) => (
              <Text key={index} style={styles.solutionItem}>
                • {solution}
              </Text>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.retryButton]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="white" />
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    maxWidth: 350,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  fileName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  solutionContainer: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  solutionItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default UploadErrorHandler;