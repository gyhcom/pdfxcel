import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { FileUtils, FilePickerResult } from '../utils/fileUtils';
import { apiService } from '../services/apiService';
import { ProcessingStatus, UploadProgress } from '../types';
import { userPlanService } from '../services/userPlanService';
import ProgressBar from '../components/ProgressBar';

type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

const UploadScreen: React.FC = () => {
  const navigation = useNavigation<UploadScreenNavigationProp>();
  
  const [selectedFile, setSelectedFile] = useState<FilePickerResult | null>(null);
  const [useAI, setUseAI] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
  });

  const handleFileSelection = async () => {
    try {
      const file = await FileUtils.pickPdfFile();
      if (file) {
        setSelectedFile(file);
        Toast.show({
          type: 'success',
          text1: '파일 선택 완료',
          text2: file.name,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '파일 선택 실패',
        text2: '다시 시도해주세요.',
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
            onPress: () => {
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
            }
          }
        ]
      );
      return;
    }

    setProcessingStatus({ status: 'uploading' });

    try {
      const result = await apiService.uploadPdf(
        selectedFile.uri,
        selectedFile.name,
        useAI,
        (progress: UploadProgress) => {
          setProcessingStatus({
            status: 'uploading',
            progress,
          });
        }
      );

      setProcessingStatus({
        status: 'processing',
      });

      // 처리 완료 대기 (실제로는 백엔드에서 즉시 처리됨)
      setTimeout(async () => {
        try {
          // 사용량 기록
          await userPlanService.recordUpload(useAI);
          
          setProcessingStatus({
            status: 'completed',
            result,
          });
          
          Toast.show({
            type: 'success',
            text1: '변환 완료!',
            text2: `${useAI ? 'AI' : '기본'} 모드로 처리되었습니다.`,
          });

          navigation.navigate('Preview', {
            fileId: result.file_id,
            filename: selectedFile.name,
          });
        } catch (recordError) {
          console.error('Error recording usage:', recordError);
          // 사용량 기록 실패해도 미리보기 화면으로 이동
          setProcessingStatus({
            status: 'completed',
            result,
          });
          
          navigation.navigate('Preview', {
            fileId: result.file_id,
            filename: selectedFile.name,
          });
        }
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setProcessingStatus({
        status: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
      
      Toast.show({
        type: 'error',
        text1: '업로드 실패',
        text2: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setProcessingStatus({ status: 'idle' });
  };

  const isProcessing = ['uploading', 'processing'].includes(processingStatus.status);
  const isCompleted = processingStatus.status === 'completed';
  const hasError = processingStatus.status === 'error';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 파일 선택 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. PDF 파일 선택</Text>
          
          {!selectedFile ? (
            <TouchableOpacity
              style={styles.fileSelectButton}
              onPress={handleFileSelection}
              disabled={isProcessing}
            >
              <Ionicons name="cloud-upload" size={48} color={COLORS.primary} />
              <Text style={styles.fileSelectText}>PDF 파일 선택</Text>
              <Text style={styles.fileSelectSubtext}>
                은행 명세서 PDF를 선택해주세요
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedFile}>
              <View style={styles.fileInfo}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {FileUtils.formatFileSize(selectedFile.size)}
                  </Text>
                </View>
              </View>
              {!isProcessing && (
                <TouchableOpacity onPress={resetUpload}>
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* AI 옵션 섹션 */}
        {selectedFile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. 처리 방식 선택</Text>
            
            <View style={styles.aiOption}>
              <View style={styles.aiOptionInfo}>
                <Text style={styles.aiOptionTitle}>
                  {useAI ? 'AI 지능형 분석' : '기본 파싱'}
                </Text>
                <Text style={styles.aiOptionDescription}>
                  {useAI 
                    ? 'Claude AI로 정확한 데이터 추출 (권장)'
                    : '기본 테이블 추출 방식'
                  }
                </Text>
              </View>
              <Switch
                value={useAI}
                onValueChange={setUseAI}
                disabled={isProcessing}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={useAI ? COLORS.surface : COLORS.textSecondary}
              />
            </View>
          </View>
        )}

        {/* 업로드 버튼 */}
        {selectedFile && (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (isProcessing || isCompleted) && styles.uploadButtonDisabled
            ]}
            onPress={handleUpload}
            disabled={isProcessing || isCompleted}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons 
                name={isCompleted ? "checkmark" : "send"} 
                size={20} 
                color="white" 
              />
            )}
            <Text style={styles.uploadButtonText}>
              {isProcessing ? '처리 중...' : isCompleted ? '완료' : '변환 시작'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 진행률 표시 */}
        {processingStatus.status === 'uploading' && processingStatus.progress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>업로드 중...</Text>
            <ProgressBar progress={processingStatus.progress.percentage} />
          </View>
        )}

        {processingStatus.status === 'processing' && (
          <View style={styles.progressSection}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.progressTitle}>
              {useAI ? 'AI로 분석 중...' : '데이터 추출 중...'}
            </Text>
            <Text style={styles.progressSubtext}>
              잠시만 기다려주세요
            </Text>
          </View>
        )}

        {/* 에러 표시 */}
        {hasError && (
          <View style={styles.errorSection}>
            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={styles.errorText}>{processingStatus.error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setProcessingStatus({ status: 'idle' })}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  fileSelectButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  fileSelectText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  fileSelectSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  selectedFile: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  fileSize: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  aiOption: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiOptionInfo: {
    flex: 1,
  },
  aiOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiOptionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  progressSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  progressSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  errorSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UploadScreen;