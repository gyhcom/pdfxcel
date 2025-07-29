import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { apiService, ApiError } from '../services/apiService';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;
type PreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

interface TableData {
  headers: string[];
  rows: Array<Array<string | number>>;
}

const { width: screenWidth } = Dimensions.get('window');

const PreviewScreen: React.FC = () => {
  const navigation = useNavigation<PreviewScreenNavigationProp>();
  const route = useRoute<PreviewScreenRouteProp>();
  
  const { fileId, filename, data } = route.params;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processData();
  }, [data]);

  const processData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 시뮬레이션: 데이터 로딩 지연
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('미리보기 데이터가 없음, 빈 데이터로 처리');
        setTableData({
          headers: ['데이터 없음'],
          rows: [['변환된 데이터가 없습니다.']]
        });
        setLoading(false);
        return;
      }

      // JSON 배열에서 테이블 데이터 추출
      const headers = Object.keys(data[0]);
      const rows = data.map(item => 
        headers.map(header => item[header] || '')
      );

      setTableData({ headers, rows });
      setLoading(false);

    } catch (err) {
      console.error('Preview data processing error:', err);
      
      let errorMessage = '데이터 처리 중 오류가 발생했습니다.';
      let toastMessage = '다시 시도해주세요.';
      
      // ApiError 처리
      if (err && typeof err === 'object' && 'code' in err) {
        const apiError = err as ApiError;
        errorMessage = apiError.message;
        
        switch (apiError.code) {
          case 'NETWORK_ERROR':
            toastMessage = '인터넷 연결을 확인해주세요.';
            break;
          case 'TIMEOUT_ERROR':
            toastMessage = '잠시 후 다시 시도해주세요.';
            break;
          default:
            toastMessage = '다시 시도해주세요.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      
      Toast.show({
        type: 'error',
        text1: '미리보기 오류',
        text2: toastMessage,
        visibilityTime: 4000,
      });
    }
  };

  const getColumnWidth = (columnIndex: number): number => {
    if (!tableData) return 100;
    
    const headerLength = tableData.headers[columnIndex]?.length || 0;
    const maxCellLength = Math.max(
      headerLength,
      ...tableData.rows.map(row => String(row[columnIndex] || '').length)
    );
    
    // 최소 80px, 최대 200px
    return Math.min(Math.max(maxCellLength * 10 + 20, 80), 200);
  };

  const getTotalWidth = (): number => {
    if (!tableData) return screenWidth;
    return tableData.headers.reduce((sum, _, index) => sum + getColumnWidth(index), 0);
  };

  const renderTable = () => {
    if (!tableData) return null;

    const totalWidth = getTotalWidth();

    return (
      <View style={styles.tableContainer}>
        {/* 테이블 정보 */}
        <View style={styles.tableInfo}>
          <Text style={styles.infoText}>
            📊 {tableData.rows.length}행 × {tableData.headers.length}열
          </Text>
        </View>

        {/* 가로 스크롤 컨테이너 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.horizontalScroll}
        >
          <View style={{ width: Math.max(totalWidth, screenWidth - 32) }}>
            {/* 헤더 */}
            <View style={styles.headerRow}>
              {tableData.headers.map((header, index) => (
                <View
                  key={`header-${index}`}
                  style={[
                    styles.headerCell,
                    { width: getColumnWidth(index) }
                  ]}
                >
                  <Text style={styles.headerText} numberOfLines={2}>
                    {header}
                  </Text>
                </View>
              ))}
            </View>

            {/* 세로 스크롤 가능한 데이터 행들 */}
            <ScrollView 
              style={styles.verticalScroll}
              nestedScrollEnabled={true}
            >
              {tableData.rows.map((row, rowIndex) => (
                <View 
                  key={`row-${rowIndex}`}
                  style={[
                    styles.dataRow,
                    rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow
                  ]}
                >
                  {row.map((cell, cellIndex) => (
                    <View
                      key={`cell-${rowIndex}-${cellIndex}`}
                      style={[
                        styles.dataCell,
                        { width: getColumnWidth(cellIndex) }
                      ]}
                    >
                      <Text style={styles.cellText} numberOfLines={3}>
                        {String(cell || '')}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* 스크롤 힌트 */}
        {totalWidth > screenWidth - 32 && (
          <Text style={styles.scrollHint}>
            👈 좌우로 스크롤하여 모든 컬럼을 확인하세요
          </Text>
        )}
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>데이터를 처리하는 중...</Text>
      <Text style={styles.loadingSubtext}>잠시만 기다려주세요</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="warning" size={60} color={COLORS.error} />
      <Text style={styles.errorTitle}>미리보기 오류</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={processData}>
        <Ionicons name="refresh" size={20} color="white" />
        <Text style={styles.retryButtonText}>다시 시도</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={() => navigation.navigate('Result', { fileId, filename })}
      >
        <Text style={styles.skipButtonText}>미리보기 건너뛰고 계속</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.contentContainer}>
        {/* 파일 정보 헤더 */}
        <View style={styles.fileInfoHeader}>
          <View style={styles.fileInfoContent}>
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={2}>
                {filename || 'document.pdf'}
              </Text>
              <Text style={styles.fileSubtitle}>
                Claude AI 변환 결과 미리보기
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
          
          {renderTable()}
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => navigation.navigate('Result', { fileId, filename })}
          >
            <Ionicons name="download" size={20} color="white" />
            <Text style={styles.downloadButtonText}>Excel로 다운로드</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>이전으로</Text>
          </TouchableOpacity>
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 이 미리보기는 Claude AI가 추출한 데이터입니다
          </Text>
          <Text style={styles.infoText}>
            📄 Excel 파일을 다운로드하여 전체 데이터를 확인하세요
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
  // 테이블 스타일
  tableContainer: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tableInfo: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  horizontalScroll: {
    maxHeight: 400,
  },
  verticalScroll: {
    maxHeight: 300,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
  },
  headerCell: {
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.surface,
    minHeight: 50,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.surface,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  evenRow: {
    backgroundColor: COLORS.surface,
  },
  oddRow: {
    backgroundColor: COLORS.background,
  },
  dataCell: {
    padding: SPACING.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    minHeight: 50,
  },
  cellText: {
    color: COLORS.text,
    fontSize: 13,
    textAlign: 'center',
  },
  scrollHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.sm,
    fontStyle: 'italic',
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
  infoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
});

export default PreviewScreen;