/**
 * 개발용 디버그 패널
 * 메모리 사용량, 크래시 로그 등을 확인할 수 있는 도구
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import memoryManager from '../utils/memoryManager';
import crashReporter from '../utils/crashReporter';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ visible, onClose }) => {
  const [memoryInfo, setMemoryInfo] = useState(memoryManager.getMemoryInfo());
  const [crashReports, setCrashReports] = useState(crashReporter.getCrashReports());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (visible) {
      const timer = setInterval(() => {
        setMemoryInfo(memoryManager.getMemoryInfo());
        setCrashReports(crashReporter.getCrashReports());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [visible]);

  const handleClearCache = () => {
    Alert.alert(
      '캐시 삭제',
      '모든 캐시를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            memoryManager.clearAllCache();
            setRefreshKey(prev => prev + 1);
          }
        }
      ]
    );
  };

  const handleClearCrashReports = () => {
    Alert.alert(
      '크래시 로그 삭제',
      '모든 크래시 로그를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            crashReporter.clearCrashReports();
            setCrashReports([]);
          }
        }
      ]
    );
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🛠️ Debug Panel</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 메모리 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 메모리 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>캐시 크기:</Text>
                <Text style={styles.infoValue}>{memoryInfo.cacheSize}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>캐시 항목:</Text>
                <Text style={styles.infoValue}>{memoryInfo.cacheItems}개</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>최대 캐시:</Text>
                <Text style={styles.infoValue}>{memoryInfo.maxCacheSize}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
              <Text style={styles.actionButtonText}>캐시 삭제</Text>
            </TouchableOpacity>
          </View>

          {/* 크래시 리포트 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 크래시 로그 ({crashReports.length})</Text>
            {crashReports.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>크래시 로그가 없습니다</Text>
              </View>
            ) : (
              <>
                {crashReports.slice(-5).reverse().map((crash, index) => (
                  <View key={index} style={styles.crashCard}>
                    <Text style={styles.crashTime}>
                      {new Date(crash.timestamp).toLocaleString()}
                    </Text>
                    <Text style={styles.crashError}>
                      {crash.error.name}: {crash.error.message}
                    </Text>
                    {crash.additionalInfo && (
                      <Text style={styles.crashInfo}>
                        Context: {JSON.stringify(crash.additionalInfo, null, 2)}
                      </Text>
                    )}
                  </View>
                ))}
                <TouchableOpacity 
                  style={[styles.actionButton, styles.dangerButton]} 
                  onPress={handleClearCrashReports}
                >
                  <Text style={styles.actionButtonText}>크래시 로그 삭제</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* 시스템 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 시스템 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>플랫폼:</Text>
                <Text style={styles.infoValue}>React Native</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>개발 모드:</Text>
                <Text style={styles.infoValue}>{__DEV__ ? 'ON' : 'OFF'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>새로고침:</Text>
                <Text style={styles.infoValue}>#{refreshKey}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  crashCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  crashTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  crashError: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  crashInfo: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
});

export default DebugPanel;