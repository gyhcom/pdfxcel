import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { apiService, ApiError } from '../services/apiService';
import { FileUtils } from '../utils/fileUtils';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;

interface DownloadState {
  isDownloading: boolean;
  downloadedUri?: string;
  error?: string;
}

const ResultScreen: React.FC = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();
  
  const { fileId, filename } = route.params;
  
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
  });

  useEffect(() => {
    // 파일 자동 다운로드 (옵션)
    // handleDownload();
  }, []);

  const handleDownload = async () => {
    if (downloadState.isDownloading) return;

    setDownloadState({ isDownloading: true });

    try {
      const downloadedUri = await apiService.downloadExcel(fileId);
      
      setDownloadState({
        isDownloading: false,
        downloadedUri,
      });

      Toast.show({
        type: 'success',
        text1: '다운로드 완료!',
        text2: 'Excel 파일이 준비되었습니다.',
      });

    } catch (error) {
      console.error('Download error:', error);
      
      let errorMessage = '다운로드 실패';
      let toastMessage = '다시 시도해주세요.';
      
      // ApiError 처리
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        errorMessage = apiError.message;
        
        switch (apiError.code) {
          case 'NETWORK_ERROR':
            toastMessage = '인터넷 연결을 확인하고 다시 시도해주세요.';
            break;
          case 'TIMEOUT_ERROR':
            toastMessage = '인터넷이 느릴 수 있습니다. 잠시 후 다시 시도해주세요.';
            break;
          case 'SERVER_ERROR':
            toastMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            break;
          default:
            toastMessage = '다시 시도해주세요.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setDownloadState({
        isDownloading: false,
        error: errorMessage,
      });

      Toast.show({
        type: 'error',
        text1: '다운로드 실패',
        text2: toastMessage,
        visibilityTime: 4000,
      });
    }
  };

  const handleShare = async () => {
    if (!downloadState.downloadedUri) {
      Alert.alert('알림', '먼저 파일을 다운로드해주세요.');
      return;
    }

    try {
      const excelFilename = `${filename?.replace('.pdf', '') || 'bank_statement'}_converted.xlsx`;
      await FileUtils.shareFile(downloadState.downloadedUri, excelFilename);
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({
        type: 'error',
        text1: '공유 실패',
        text2: '파일 공유 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!downloadState.downloadedUri) {
      Alert.alert('알림', '먼저 파일을 다운로드해주세요.');
      return;
    }

    try {
      const excelFilename = `${filename?.replace('.pdf', '') || 'bank_statement'}_converted.xlsx`;
      const success = await FileUtils.saveToGallery(downloadState.downloadedUri, excelFilename);
      
      if (success) {
        Toast.show({
          type: 'success',
          text1: '저장 완료',
          text2: '파일이 기기에 저장되었습니다.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '저장 실패',
        text2: '파일 저장 중 오류가 발생했습니다.',
      });
    }
  };

  const handleNewConversion = () => {
    // 임시 파일 정리
    apiService.deleteFile(fileId);
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 성공 헤더 */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>변환 완료!</Text>
          <Text style={styles.successSubtitle}>
            PDF 파일이 Excel로 성공적으로 변환되었습니다
          </Text>
        </View>

        {/* 파일 정보 */}
        <View style={styles.fileInfoSection}>
          <Text style={styles.sectionTitle}>변환된 파일</Text>
          <View style={styles.fileInfoCard}>
            <Ionicons name="grid" size={24} color={COLORS.primary} />
            <View style={styles.fileInfoDetails}>
              <Text style={styles.fileInfoTitle}>
                {filename?.replace('.pdf', '') || 'bank_statement'}_converted.xlsx
              </Text>
              <Text style={styles.fileInfoSubtitle}>
                Excel 스프레드시트 파일
              </Text>
            </View>
          </View>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionsSection}>
          
          {/* 다운로드 버튼 */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              downloadState.isDownloading && styles.disabledButton
            ]}
            onPress={handleDownload}
            disabled={downloadState.isDownloading}
          >
            {downloadState.isDownloading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons 
                name={downloadState.downloadedUri ? "checkmark" : "download"} 
                size={20} 
                color="white" 
              />
            )}
            <Text style={styles.actionButtonText}>
              {downloadState.isDownloading 
                ? '다운로드 중...' 
                : downloadState.downloadedUri 
                  ? '다운로드 완료' 
                  : 'Excel 다운로드'
              }
            </Text>
          </TouchableOpacity>

          {/* 미리보기 버튼 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={async () => {
              try {
                // 실제 API에서 변환된 데이터 가져오기
                const data = await apiService.getConvertedData(fileId);
                
                navigation.navigate('Preview', { 
                  fileId, 
                  filename, 
                  data 
                });
              } catch (error) {
                console.error('Preview data fetch error:', error);
                Toast.show({
                  type: 'error',
                  text1: '미리보기 실패',
                  text2: '데이터를 불러올 수 없습니다.',
                  visibilityTime: 3000,
                });
              }
            }}
          >
            <Ionicons name="eye" size={20} color={COLORS.secondary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              데이터 미리보기
            </Text>
          </TouchableOpacity>

          {/* 공유 버튼 */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              !downloadState.downloadedUri && styles.disabledButton
            ]}
            onPress={handleShare}
            disabled={!downloadState.downloadedUri}
          >
            <Ionicons name="share" size={20} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              파일 공유
            </Text>
          </TouchableOpacity>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              !downloadState.downloadedUri && styles.disabledButton
            ]}
            onPress={handleSave}
            disabled={!downloadState.downloadedUri}
          >
            <Ionicons name="save" size={20} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              기기에 저장
            </Text>
          </TouchableOpacity>
        </View>

        {/* 에러 표시 */}
        {downloadState.error && (
          <View style={styles.errorSection}>
            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={styles.errorText}>{downloadState.error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleDownload}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 하단 버튼들 */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.tertiaryButton]}
            onPress={handleNewConversion}
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, styles.tertiaryButtonText]}>
              새 파일 변환
            </Text>
          </TouchableOpacity>
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 변환된 파일은 24시간 후 자동으로 삭제됩니다
          </Text>
          <Text style={styles.infoText}>
            📱 파일을 기기에 저장하거나 클라우드에 백업하는 것을 권장합니다
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
  successHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fileInfoSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  fileInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileInfoDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  fileInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  fileInfoSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionsSection: {
    marginBottom: SPACING.xl,
  },
  actionButton: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tertiaryButton: {
    backgroundColor: COLORS.surface,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    color: 'white',
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  tertiaryButtonText: {
    color: COLORS.primary,
  },
  errorSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
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
  bottomActions: {
    marginBottom: SPACING.lg,
  },
  infoSection: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
});

export default ResultScreen;