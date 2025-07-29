import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { FileUtils, FilePickerResult } from '../utils/fileUtils';
import { apiService, ApiError } from '../services/apiService';
import { userPlanService } from '../services/userPlanService';
import ProgressBar from '../components/ProgressBar';
import { 
  WebSocketService, 
  ProgressData, 
  createWebSocketService 
} from '../services/websocketService';

type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

interface ConversionState {
  status: 'idle' | 'uploading' | 'connecting' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  fileId?: string;
  error?: string;
}

const EnhancedUploadScreen: React.FC = () => {
  const navigation = useNavigation<UploadScreenNavigationProp>();
  
  const [selectedFile, setSelectedFile] = useState<FilePickerResult | null>(null);
  const [useAI, setUseAI] = useState<boolean>(false);
  const [conversionState, setConversionState] = useState<ConversionState>({
    status: 'idle',
    progress: 0,
    message: '파일을 선택하여 시작하세요'
  });
  
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const progressAnimRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 컴포넌트 언마운트 시 WebSocket 정리
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // 진행률 애니메이션
    Animated.timing(progressAnimRef, {
      toValue: conversionState.progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [conversionState.progress]);

  const handleFileSelection = async () => {
    try {
      const file = await FileUtils.pickPdfFile();
      if (file) {
        // 파일 크기 체크
        if (file.size > 10 * 1024 * 1024) { // 10MB
          Toast.show({
            type: 'error',
            text1: '파일 크기 초과',
            text2: '최대 10MB까지 업로드 가능합니다.',
            visibilityTime: 4000,
          });
          return;
        }
        
        setSelectedFile(file);
        setConversionState({
          status: 'idle',
          progress: 0,
          message: '업로드 준비 완료'
        });
        
        Toast.show({
          type: 'success',
          text1: '파일 선택 완료',
          text2: `${file.name} (${FileUtils.formatFileSize(file.size)})`,
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error('File selection error:', error);
      Toast.show({
        type: 'error',
        text1: '파일 선택 실패',
        text2: 'PDF 파일만 선택 가능합니다.',
        visibilityTime: 3000,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('오류', 'PDF 파일을 먼저 선택해주세요.');
      return;
    }

    // 업로드 제한 확인
    const canUploadResult = await userPlanService.canUpload(useAI);
    
    if (!canUploadResult.allowed) {
      Alert.alert(
        '업로드 제한',
        canUploadResult.reason || '업로드가 제한되었습니다.',
        [
          { text: '확인', style: 'default' },
          {
            text: 'PRO 업그레이드',
            style: 'default',
            onPress: () => showProUpgradeDialog()
          }
        ]
      );
      return;
    }

    try {
      // 1. 업로드 시작
      setConversionState({
        status: 'uploading',
        progress: 0,
        message: '파일을 업로드하는 중...'
      });

      // 2. 파일 업로드 (백그라운드 변환 시작)
      const result = await apiService.uploadPdf(
        selectedFile.uri,
        selectedFile.name,
        useAI
      );

      const fileId = result.file_id;
      
      // 3. WebSocket 연결 시작
      setConversionState({
        status: 'connecting',
        progress: 10,
        message: '실시간 진행률 연결 중...',
        fileId
      });

      // WebSocket 서비스 생성 및 연결
      wsServiceRef.current = createWebSocketService({
        onProgress: handleProgressUpdate,
        onError: handleWebSocketError,
        onConnect: () => {
          console.log('🔌 WebSocket 연결됨');
          setConversionState(prev => ({
            ...prev,
            status: 'processing',
            message: '변환이 시작되었습니다...'
          }));
        },
        onDisconnect: () => {
          console.log('🔌 WebSocket 연결 해제됨');
        }
      });

      await wsServiceRef.current.connect(fileId);

    } catch (error) {
      console.error('Upload error:', error);
      handleUploadError(error);
    }
  };

  const handleProgressUpdate = (data: ProgressData) => {
    console.log('📊 Progress update:', data);
    
    setConversionState(prev => ({
      ...prev,
      status: data.status === 'completed' ? 'completed' : 'processing',
      progress: data.progress,
      message: data.message,
      fileId: data.file_id
    }));

    // 완료 시 처리
    if (data.status === 'completed') {
      handleConversionComplete(data);
    } else if (data.status === 'failed') {
      handleConversionFailed(data);
    } else if (data.status === 'cancelled') {
      handleConversionCancelled();
    }
  };

  const handleConversionComplete = async (data: ProgressData) => {
    try {
      // 사용량 기록
      await userPlanService.recordUpload(useAI);
      
      Toast.show({
        type: 'success',
        text1: '🎉 변환 완료!',
        text2: `${useAI ? 'AI 지능형 분석' : '기본 추출'}로 처리되었습니다.`,
        visibilityTime: 3000,
      });

      // WebSocket 연결 정리
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }

      // 결과 화면으로 이동
      setTimeout(() => {
        navigation.navigate('Result', {
          fileId: data.file_id,
          filename: selectedFile?.name || 'document.pdf'
        });
      }, 1000);

    } catch (error) {
      console.error('Error handling completion:', error);
      // 에러가 있어도 결과 화면으로 이동
      navigation.navigate('Result', {
        fileId: data.file_id,
        filename: selectedFile?.name || 'document.pdf'
      });
    }
  };

  const handleConversionFailed = (data: ProgressData) => {
    setConversionState({
      status: 'failed',
      progress: 0,
      message: data.message || '변환에 실패했습니다.',
      error: data.message
    });

    Toast.show({
      type: 'error',
      text1: '변환 실패',
      text2: data.message || '알 수 없는 오류가 발생했습니다.',
      visibilityTime: 4000,
    });

    // WebSocket 연결 정리
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
  };

  const handleConversionCancelled = () => {
    setConversionState({
      status: 'cancelled',
      progress: 0,
      message: '변환이 취소되었습니다.'
    });

    Toast.show({
      type: 'info',
      text1: '변환 취소됨',
      text2: '변환이 성공적으로 취소되었습니다.',
      visibilityTime: 2000,
    });

    // WebSocket 연결 정리
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
  };

  const handleWebSocketError = (error: Error) => {
    console.error('WebSocket error:', error);
    
    // WebSocket 오류 시 폴백 (폴링으로 상태 확인)
    Toast.show({
      type: 'warning',
      text1: '실시간 업데이트 오류',
      text2: '변환은 계속 진행됩니다.',
      visibilityTime: 3000,
    });
  };

  const handleUploadError = (error: any) => {
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    let toastMessage = '다시 시도해주세요.';
    
    // ApiError 처리
    if (error && typeof error === 'object' && 'code' in error) {
      const apiError = error as ApiError;
      errorMessage = apiError.message;
      
      switch (apiError.code) {
        case 'NETWORK_ERROR':
          toastMessage = 'Wi-Fi 또는 모바일 데이터 연결을 확인해주세요.';
          break;
        case 'FILE_TOO_LARGE':
          toastMessage = '더 작은 파일로 다시 시도해주세요.';
          break;
        case 'TIMEOUT_ERROR':
          toastMessage = '인터넷 연결이 느릴 수 있습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'RATE_LIMIT':
          toastMessage = '5분 후에 다시 시도해주세요.';
          break;
        default:
          toastMessage = '다시 시도해주세요.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    setConversionState({
      status: 'failed',
      progress: 0,
      message: errorMessage,
      error: errorMessage
    });

    Toast.show({
      type: 'error',
      text1: '업로드 실패',
      text2: toastMessage,
      visibilityTime: 4000,
    });
  };

  const handleCancel = () => {
    if (wsServiceRef.current && conversionState.status === 'processing') {
      Alert.alert(
        '변환 취소',
        '정말로 변환을 취소하시겠습니까?',
        [
          { text: '계속하기', style: 'cancel' },
          { 
            text: '취소하기', 
            style: 'destructive',
            onPress: () => {
              wsServiceRef.current?.cancelConversion();
            }
          }
        ]
      );
    }
  };

  const handleRetry = () => {
    setConversionState({
      status: 'idle',
      progress: 0,
      message: selectedFile ? '업로드 준비 완료' : '파일을 선택하여 시작하세요'
    });

    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
  };

  const showProUpgradeDialog = () => {
    Alert.alert(
      'PRO 플랜',
      'PRO 플랜으로 업그레이드하면 무제한으로 사용할 수 있습니다.',
      [
        { text: '나중에', style: 'cancel' },
        {
          text: '개발용 PRO 활성화',
          onPress: async () => {
            await userPlanService.setProUser(true);
            Toast.show({
              type: 'success',
              text1: 'PRO 플랜 활성화',
              text2: '이제 무제한으로 사용할 수 있습니다!',
            });
          }
        }
      ]
    );
  };

  const getStatusIcon = () => {
    switch (conversionState.status) {
      case 'idle':
        return 'document-text-outline';
      case 'uploading':
      case 'connecting':
        return 'cloud-upload-outline';
      case 'processing':
        return 'cog-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'alert-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getStatusColor = () => {
    switch (conversionState.status) {
      case 'completed':
        return COLORS.success;
      case 'failed':
        return COLORS.error;
      case 'cancelled':
        return COLORS.textSecondary;
      default:
        return COLORS.primary;
    }
  };

  const isProcessing = ['uploading', 'connecting', 'processing'].includes(conversionState.status);
  const canUpload = conversionState.status === 'idle' && selectedFile;
  const canCancel = conversionState.status === 'processing';
  const canRetry = ['failed', 'cancelled'].includes(conversionState.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>PDF to Excel 변환</Text>
          <Text style={styles.subtitle}>
            {useAI ? 'AI 지능형 분석으로 정확한 변환' : '기본 텍스트 추출 변환'}
          </Text>
        </View>

        {/* 파일 선택 영역 */}
        <View style={styles.fileSection}>
          <TouchableOpacity
            style={[
              styles.fileSelectButton,
              selectedFile && styles.fileSelectedButton,
              isProcessing && styles.disabledButton
            ]}
            onPress={handleFileSelection}
            disabled={isProcessing}
          >
            <Ionicons 
              name={selectedFile ? "document-text" : "document-text-outline"} 
              size={40} 
              color={selectedFile ? COLORS.primary : COLORS.textSecondary} 
            />
            <Text style={[
              styles.fileSelectText,
              selectedFile && styles.fileSelectedText
            ]}>
              {selectedFile ? selectedFile.name : 'PDF 파일 선택'}
            </Text>
            {selectedFile && (
              <Text style={styles.fileSize}>
                {FileUtils.formatFileSize(selectedFile.size)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* AI 스위치 */}
        <View style={styles.aiSection}>
          <View style={styles.aiSwitchRow}>
            <View style={styles.aiInfo}>
              <Ionicons 
                name="sparkles" 
                size={20} 
                color={useAI ? COLORS.primary : COLORS.textSecondary} 
              />
              <Text style={styles.aiLabel}>AI 지능형 분석</Text>
            </View>
            <Switch
              value={useAI}
              onValueChange={setUseAI}
              disabled={isProcessing}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={useAI ? COLORS.primary : COLORS.textSecondary}
            />
          </View>
          <Text style={styles.aiDescription}>
            {useAI 
              ? '🤖 Claude AI가 표와 데이터를 정확하게 분석합니다' 
              : '📄 기본 텍스트 추출로 빠르게 변환합니다'
            }
          </Text>
        </View>

        {/* 진행 상태 영역 */}
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getStatusIcon()} 
              size={24} 
              color={getStatusColor()} 
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {conversionState.message}
            </Text>
          </View>

          {isProcessing && (
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={conversionState.progress} 
                showPercentage={true}
                color={COLORS.primary}
              />
              <Text style={styles.progressText}>
                {conversionState.progress}% 완료
              </Text>
            </View>
          )}

          {conversionState.status === 'completed' && (
            <View style={styles.completedContainer}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
              <Text style={styles.completedText}>변환 완료!</Text>
            </View>
          )}
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionsSection}>
          {canUpload && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>변환 시작</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Ionicons name="stop" size={20} color={COLORS.error} />
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          )}

          {canRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          )}

          {isProcessing && (
            <View style={styles.processingIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.processingText}>
                {conversionState.status === 'connecting' ? '연결 중...' : '처리 중...'}
              </Text>
            </View>
          )}
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 변환 중에는 앱을 닫지 마세요
          </Text>
          <Text style={styles.infoText}>
            📱 실시간으로 진행 상황을 확인할 수 있습니다
          </Text>
          <Text style={styles.infoText}>
            ⚡ 최대 10MB PDF 파일까지 지원
          </Text>
        </View>

      </ScrollView>
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
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fileSection: {
    marginBottom: SPACING.xl,
  },
  fileSelectButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    minHeight: 120,
  },
  fileSelectedButton: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderStyle: 'solid',
  },
  disabledButton: {
    opacity: 0.6,
  },
  fileSelectText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  fileSelectedText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  aiSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  aiSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  aiDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statusSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  completedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: SPACING.sm,
  },
  actionsSection: {
    marginBottom: SPACING.xl,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginBottom: SPACING.md,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  retryButton: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  processingText: {
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontSize: 14,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
});

export default EnhancedUploadScreen;