import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';
import { userPlanService } from '../services/userPlanService';
import { UsageStatus } from '../types';
import UsageCard from '../components/UsageCard';

const ICON_SIZE = 28;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [planType, setPlanType] = useState<'FREE' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(true);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const stats = await userPlanService.getUsageStats();
      setUsageStatus(stats.usageStatus);
      setPlanType(stats.plan);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadUsageData(); }, []));

  const handleStartConversion = async () => {
    if (!usageStatus) return navigation.navigate('Upload');

    const canUploadResult = await userPlanService.canUpload(false);
    if (!canUploadResult.allowed) {
      Alert.alert(
        '업로드 제한',
        canUploadResult.reason || '업로드가 제한되었습니다.',
        [
          { text: '확인', style: 'default' },
          ...(planType === 'FREE' ? [{ text: 'PRO 업그레이드', onPress: handleUpgradePress }] : []),
        ]
      );
      return;
    }
    navigation.navigate('Upload');
  };

  const handleUpgradePress = () => {
    Alert.alert('PRO 플랜 업그레이드', 'PRO 플랜으로 업그레이드하면 무제한으로 PDF를 변환할 수 있습니다.', [
      { text: '나중에', style: 'cancel' },
      { text: '개발용 PRO 활성화', onPress: async () => {
        await userPlanService.setProUser(true);
        await loadUsageData();
      }}
    ]);
  };

  const handlePlanToggle = async () => {
    const isPro = planType === 'PRO';
    Alert.alert('플랜 변경 (개발용)', `${isPro ? 'FREE' : 'PRO'} 플랜으로 변경하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '변경', onPress: async () => {
        await userPlanService.setProUser(!isPro);
        await loadUsageData();
      }}
    ]);
  };

  const renderCard = (title: string, subtitle: string, icon: any, color: string, onPress?: () => void) => (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardIconContainer}>
        <Ionicons name={icon} size={ICON_SIZE} color="white" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>안녕하세요! 😊</Text>
          <Text style={styles.title}>PDFXcel</Text>
          <Text style={styles.subtitle}>PDF 은행 명세서를 Excel로 빠르게 변환하세요</Text>
        </View>

        <View style={styles.mainGrid}>
          {renderCard('PDF 업로드', '파일 선택하기', 'cloud-upload', '#FF6B6B', handleStartConversion)}
          {renderCard('변환 기록', '이전 파일들', 'time', '#4ECDC4', () => navigation.navigate('History'))}
          {renderCard('AI 분석', '지능형 추출', 'bulb', '#45B7D1')}
          {renderCard('Excel 변환', '즉시 사용가능', 'grid', '#96CEB4')}
        </View>

        {!loading && usageStatus && (
          <UsageCard usageStatus={usageStatus} planType={planType} onUpgradePress={handleUpgradePress} />
        )}

        {__DEV__ && (
          <TouchableOpacity style={styles.devButton} onPress={handlePlanToggle}>
            <Ionicons name="settings" size={16} color={COLORS.textSecondary} />
            <Text style={styles.devButtonText}>개발용: {planType} 플랜 토글</Text>
          </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  gridCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.sm,
  },
  devButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
});

export default HomeScreen;
