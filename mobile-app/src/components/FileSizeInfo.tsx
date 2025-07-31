/**
 * 파일 크기 정보 표시 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/config';
import { FileSizeInfo as FileSizeInfoType } from '../utils/fileSizeValidator';

interface Props {
  filename: string;
  fileSizeInfo: FileSizeInfoType;
  showWarning?: boolean;
}

const FileSizeInfo: React.FC<Props> = ({ filename, fileSizeInfo, showWarning = false }) => {
  const getStatusColor = () => {
    if (!fileSizeInfo.isValid) return COLORS.ERROR;
    if (showWarning) return COLORS.WARNING;
    return COLORS.SUCCESS;
  };

  const getStatusIcon = () => {
    if (!fileSizeInfo.isValid) return 'close-circle';
    if (showWarning) return 'warning';
    return 'checkmark-circle';
  };

  const getProgressWidth = () => {
    const percentage = (fileSizeInfo.sizeMB / fileSizeInfo.maxSizeMB) * 100;
    return Math.min(percentage, 100);
  };

  return (
    <View style={styles.container}>
      {/* 파일 정보 헤더 */}
      <View style={styles.header}>
        <Ionicons name="document-outline" size={16} color={COLORS.TEXT_SECONDARY} />
        <Text style={styles.filename} numberOfLines={1} ellipsizeMode="middle">
          {filename}
        </Text>
        <Ionicons 
          name={getStatusIcon() as any} 
          size={16} 
          color={getStatusColor()} 
        />
      </View>

      {/* 파일 크기 정보 */}
      <View style={styles.sizeInfo}>
        <Text style={styles.sizeText}>
          {fileSizeInfo.formattedSize}
          <Text style={styles.maxSizeText}> / {fileSizeInfo.formattedMaxSize}</Text>
        </Text>
        <Text style={[styles.percentageText, { color: getStatusColor() }]}>
          {((fileSizeInfo.sizeMB / fileSizeInfo.maxSizeMB) * 100).toFixed(1)}%
        </Text>
      </View>

      {/* 진행률 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${getProgressWidth()}%`,
                backgroundColor: getStatusColor()
              }
            ]} 
          />
        </View>
      </View>

      {/* 상태 메시지 */}
      {!fileSizeInfo.isValid && (
        <Text style={[styles.statusMessage, { color: COLORS.ERROR }]}>
          파일 크기가 제한을 초과했습니다
        </Text>
      )}
      
      {showWarning && fileSizeInfo.isValid && (
        <Text style={[styles.statusMessage, { color: COLORS.WARNING }]}>
          큰 파일입니다. 업로드에 시간이 걸릴 수 있습니다
        </Text>
      )}
      
      {!showWarning && fileSizeInfo.isValid && (
        <Text style={[styles.statusMessage, { color: COLORS.SUCCESS }]}>
          업로드 준비 완료
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderRadius: 8,
    padding: SPACING.MD,
    marginVertical: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  filename: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: SPACING.SM,
  },
  sizeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  sizeText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  maxSizeText: {
    color: COLORS.TEXT_TERTIARY,
    fontWeight: '400',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: SPACING.SM,
  },
  progressBackground: {
    height: 4,
    backgroundColor: COLORS.BORDER_LIGHT,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  statusMessage: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default FileSizeInfo;