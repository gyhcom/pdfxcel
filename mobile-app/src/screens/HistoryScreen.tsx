import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { 
  historyService, 
  FileHistoryItem, 
  HistoryResponse 
} from '../services/historyService';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'History'>;

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // 캐시된 데이터 먼저 로드
      const cachedHistory = await historyService.getCachedHistory();
      if (cachedHistory && showLoading) {
        setHistoryData(cachedHistory);
        setLoading(false);
      }

      // 서버에서 최신 데이터 가져오기
      const history = await historyService.getHistory();
      setHistoryData(history);
      
      // 새 데이터 캐싱
      await historyService.cacheHistory(history);
      
    } catch (error: any) {
      console.error('History load error:', error);
      setError(error.message || '히스토리를 불러올 수 없습니다.');
      
      // 캐시된 데이터라도 보여주기
      if (!historyData) {
        const cachedHistory = await historyService.getCachedHistory();
        if (cachedHistory) {
          setHistoryData(cachedHistory);
          Toast.show({
            type: 'info',
            text1: '오프라인 모드',
            text2: '캐시된 데이터를 표시합니다.',
            visibilityTime: 3000,
          });
        }
      }
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory(false);
  };

  const handleFileRedownload = async (file: FileHistoryItem) => {
    try {
      Toast.show({
        type: 'info',
        text1: '다운로드 준비 중...',
        text2: '잠시만 기다려주세요.',
        visibilityTime: 2000,
      });

      await historyService.prepareRedownload(file.file_id);
      
      // Result 화면으로 이동하여 다운로드
      navigation.navigate('Result', {
        fileId: file.file_id,
        filename: file.original_filename
      });
      
    } catch (error: any) {
      console.error('Redownload error:', error);
      Toast.show({
        type: 'error',
        text1: '재다운로드 실패',
        text2: error.message || '다시 시도해주세요.',
        visibilityTime: 4000,
      });
    }
  };

  const handleFileDelete = (file: FileHistoryItem) => {
    Alert.alert(
      '파일 삭제',
      `"${file.original_filename}"을(를) 히스토리에서 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await historyService.deleteFileFromHistory(file.file_id);
              
              Toast.show({
                type: 'success',
                text1: '삭제 완료',
                text2: '히스토리에서 파일이 삭제되었습니다.',
                visibilityTime: 2000,
              });
              
              // 히스토리 새로고침
              loadHistory(false);
              
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: '삭제 실패',
                text2: error.message || '다시 시도해주세요.',
                visibilityTime: 3000,
              });
            }
          }
        }
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'cancelled':
        return 'stop-circle';
      case 'processing':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'failed':
        return COLORS.error;
      case 'cancelled':
        return COLORS.textSecondary;
      case 'processing':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
      case 'cancelled':
        return '취소됨';
      case 'processing':
        return '처리 중';
      default:
        return '알 수 없음';
    }
  };

  const formatFileName = (filename: string) => {
    // UUID 패턴 확인 (8-4-4-4-12 형태)
    const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\.pdf$/i;
    
    if (uuidPattern.test(filename)) {
      return 'PDF 문서';
    }
    
    // 실제 파일명에서 확장자 제거
    return filename.replace(/\.[^/.]+$/, '');
  };

  const formatUploadDate = (uploadTime: string) => {
    const uploadDate = new Date(uploadTime);
    return uploadDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '/').replace(/\s/g, '').slice(0, -1); // "2025/07/29"
  };

  const renderFileItem = (file: FileHistoryItem, index: number) => (
    <View key={file.file_id} style={styles.fileItem}>
      <View style={styles.fileHeader}>
        <View style={styles.fileInfo}>
          <Ionicons 
            name="document-text" 
            size={20} 
            color={COLORS.primary} 
          />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {formatFileName(file.original_filename)}
            </Text>
            <Text style={styles.fileSubtitle}>
              {formatUploadDate(file.upload_time)} • {' '}
              {file.processing_type === 'ai' ? 'AI 분석' : '기본 추출'}
              {file.file_size && ` • ${historyService.formatFileSize(file.file_size)}`}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(file.status)} 
            size={18} 
            color={getStatusColor(file.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(file.status) }]}>
            {getStatusText(file.status)}
          </Text>
        </View>
      </View>

      <View style={styles.fileActions}>
        {file.status === 'completed' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton]}
              onPress={() => handleFileRedownload(file)}
            >
              <Ionicons name="download" size={16} color="white" />
              <Text style={styles.downloadButtonText}>재다운로드</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.previewButton]}
              onPress={async () => {
                try {
                  // Result 화면으로 이동하여 미리보기
                  navigation.navigate('Result', {
                    fileId: file.file_id,
                    filename: file.original_filename
                  });
                } catch (error: any) {
                  Toast.show({
                    type: 'error',
                    text1: '미리보기 실패',
                    text2: '다시 시도해주세요.',
                    visibilityTime: 3000,
                  });
                }
              }}
            >
              <Ionicons name="eye" size={16} color={COLORS.primary} />
              <Text style={styles.previewButtonText}>미리보기</Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleFileDelete(file)}
        >
          <Ionicons name="trash" size={16} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => {
    if (!historyData?.session_stats) return null;

    const stats = historyData.session_stats;
    
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📊 변환 통계</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total_files}</Text>
            <Text style={styles.statLabel}>총 파일</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completed_files}</Text>
            <Text style={styles.statLabel}>완료</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.ai_conversions}</Text>
            <Text style={styles.statLabel}>AI 변환</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.basic_conversions}</Text>
            <Text style={styles.statLabel}>기본 변환</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>변환 기록이 없습니다</Text>
      <Text style={styles.emptySubtitle}>
        PDF 파일을 변환하면 여기에 기록이 표시됩니다
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Upload')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.emptyButtonText}>첫 파일 변환하기</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning" size={60} color={COLORS.error} />
      <Text style={styles.errorTitle}>히스토리 로드 실패</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadHistory()}
      >
        <Ionicons name="refresh" size={20} color="white" />
        <Text style={styles.retryButtonText}>다시 시도</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !historyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>히스토리를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !historyData) {
    return (
      <SafeAreaView style={styles.container}>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  const files = historyData?.files || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>변환 기록</Text>
          <Text style={styles.subtitle}>
            {files.length}개의 변환 기록
          </Text>
        </View>

        {/* 통계 */}
        {renderStats()}

        {/* 파일 목록 */}
        {files.length === 0 ? renderEmptyState() : (
          <View style={styles.filesContainer}>
            {files.map((file, index) => renderFileItem(file, index))}
          </View>
        )}

        {/* 안내 메시지 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 파일은 7일간 보관됩니다
          </Text>
          <Text style={styles.infoText}>
            📱 아래로 당겨서 새로고침
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
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
  header: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statsContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  filesContainer: {
    paddingHorizontal: SPACING.lg,
  },
  fileItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  fileDetails: {
    marginLeft: SPACING.sm,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  previewButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  previewButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  infoContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
});

export default HistoryScreen;