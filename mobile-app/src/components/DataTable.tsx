import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { TablePreviewData } from '../types';

interface DataTableProps {
  data: TablePreviewData;
  maxHeight?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  maxHeight = 400 
}) => {
  const { headers, rows } = data;
  
  // 각 컬럼의 최소 너비 계산
  const getColumnWidth = (columnIndex: number): number => {
    const headerLength = headers[columnIndex]?.length || 0;
    const maxCellLength = Math.max(
      headerLength,
      ...rows.map(row => String(row[columnIndex] || '').length)
    );
    
    // 최소 80px, 최대 150px, 내용에 따라 조정
    return Math.min(Math.max(maxCellLength * 8 + 20, 80), 150);
  };

  // 테이블 전체 너비 계산
  const totalWidth = headers.reduce((sum, _, index) => {
    return sum + getColumnWidth(index);
  }, 0);

  const renderHeader = () => (
    <View style={[styles.headerRow, { width: Math.max(totalWidth, screenWidth - 32) }]}>
      {headers.map((header, index) => (
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
  );

  const renderRow = ({ item: row, index: rowIndex }: { 
    item: (string | number)[], 
    index: number 
  }) => (
    <View 
      style={[
        styles.dataRow,
        { width: Math.max(totalWidth, screenWidth - 32) },
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
          <Text style={styles.cellText} numberOfLines={2}>
            {String(cell || '')}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderEmptyRow = (rowIndex: number) => (
    <View 
      key={`empty-${rowIndex}`}
      style={[
        styles.dataRow,
        { width: Math.max(totalWidth, screenWidth - 32) },
        rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow
      ]}
    >
      {headers.map((_, cellIndex) => (
        <View
          key={`empty-cell-${rowIndex}-${cellIndex}`}
          style={[
            styles.dataCell,
            { width: getColumnWidth(cellIndex) }
          ]}
        >
          <Text style={styles.emptyCellText}>-</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 테이블 정보 */}
      <View style={styles.tableInfo}>
        <Text style={styles.infoText}>
          📊 {data.totalRows}행 × {data.totalColumns}열
        </Text>
      </View>

      {/* 테이블 컨테이너 */}
      <View style={[styles.tableContainer, { maxHeight }]}>
        {/* 고정 헤더 */}
        <View style={styles.stickyHeader}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            scrollEventThrottle={16}
          >
            {renderHeader()}
          </ScrollView>
        </View>

        {/* 데이터 영역 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          scrollEventThrottle={16}
        >
          <FlatList
            data={rows}
            renderItem={renderRow}
            keyExtractor={(_, index) => `row-${index}`}
            showsVerticalScrollIndicator={true}
            initialNumToRender={10}
            maxToRenderPerBatch={20}
            windowSize={10}
            getItemLayout={(_, index) => ({
              length: 50,
              offset: 50 * index,
              index,
            })}
            ListFooterComponent={() => {
              // 빈 행들을 렌더링하여 테이블 구조 완성
              const emptyRowsCount = Math.max(0, 5 - rows.length);
              return (
                <View>
                  {Array.from({ length: emptyRowsCount }, (_, index) => 
                    renderEmptyRow(rows.length + index)
                  )}
                </View>
              );
            }}
          />
        </ScrollView>
      </View>

      {/* 스크롤 힌트 */}
      {totalWidth > screenWidth - 32 && (
        <Text style={styles.scrollHint}>
          👈 좌우로 스크롤하여 모든 컬럼을 확인하세요
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableInfo: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
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
  stickyHeader: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
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
  emptyCellText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
});

export default DataTable;