import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { apiService } from '../services/apiService';
import { PreviewState } from '../types';
import DataTable from '../components/DataTable';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;
type PreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

const PreviewScreen: React.FC = () => {
  const navigation = useNavigation<PreviewScreenNavigationProp>();
  const route = useRoute<PreviewScreenRouteProp>();
  
  const { fileId, filename } = route.params;
  
  const [previewState, setPreviewState] = useState<PreviewState>({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    loadPreviewData();
  }, [fileId]);

  const loadPreviewData = async () => {
    try {
      setPreviewState({ loading: true, data: null, error: null });
      
      // 현재는 Mock 데이터 사용, 향후 실제 API로 교체
      const data = await apiService.getMockTablePreview(fileId);
      
      setPreviewState({
        loading: false,
        data,
        error: null,
      });

    } catch (error) {
      console.error('Error loading preview data:', error);
      
      const errorMessage = error instanceof Error ? error.message : '미리보기를 불러올 수 없습니다.';
      
      setPreviewState({
        loading: false,
        data: null,
        error: errorMessage,
      });

      Toast.show({
        type: 'error',
        text1: '미리보기 오류',
        text2: errorMessage,
      });
    }
  };

  const handleRetry = () => {
    loadPreviewData();
  };

  const handleDownload = () => {
    navigation.navigate('Result', { fileId, filename });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      <Text style={styles.loadingSubtext}>잠시만 기다려주세요</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="warning" size={60} color={COLORS.error} />
      <Text style={styles.errorTitle}>미리보기 오류</Text>
      <Text style={styles.errorMessage}>{previewState.error}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Ionicons name="refresh" size={20} color="white" />
        <Text style={styles.retryButtonText}>다시 시도</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.skipButton} onPress={handleDownload}>
        <Text style={styles.skipButtonText}>미리보기 건너뛰고 다운로드</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreviewContent = () => {
    if (!previewState.data) return null;

    return (
      <ScrollView style={styles.contentContainer}>
        {/* 파일 정보 헤더 */}
        <View style={styles.fileInfoHeader}>
          <View style={styles.fileInfoContent}>
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={2}>
                {filename || 'bank_statement.pdf'}
              </Text>
              <Text style={styles.fileSubtitle}>
                변환 결과 미리보기
              </Text>
            </View>
          </View>
        </View>

        {/* 데이터 테이블 */}
        <View style={styles.tableSection}>
          <View style={styles.tableSectionHeader}>
            <Ionicons name="grid" size={20} color={COLORS.primary} />
            <Text style={styles.tableSectionTitle}>추출된 데이터</Text>
          </View>
          
          <DataTable data={previewState.data} maxHeight={400} />
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
          >
            <Ionicons name="download" size={20} color="white" />
            <Text style={styles.downloadButtonText}>Excel로 다운로드</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>이전으로</Text>
          </TouchableOpacity>
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 이 미리보기는 실제 Excel 파일의 일부분입니다
          </Text>
          <Text style={styles.infoText}>
            📄 전체 데이터를 확인하려면 Excel 파일을 다운로드하세요
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {previewState.loading && renderLoadingState()}
      {previewState.error && renderErrorState()}
      {previewState.data && renderPreviewContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  // 로딩 상태
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  // 에러 상태
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  skipButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  skipButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // 파일 정보 헤더
  fileInfoHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  fileSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  // 테이블 섹션
  tableSection: {
    marginBottom: SPACING.lg,
  },
  tableSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tableSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  // 액션 버튼
  actionsSection: {
    marginVertical: SPACING.lg,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  backButton: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  // 안내 정보
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

export default PreviewScreen;