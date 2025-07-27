import React, { useState, useEffect } from 'react';
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

  // 화면이 포커스될 때마다 사용량 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadUsageData();
    }, [])
  );

  const handleStartConversion = async () => {
    if (!usageStatus) {
      navigation.navigate('Upload');
      return;
    }

    // 업로드 가능 여부 확인
    const canUploadResult = await userPlanService.canUpload(false);
    
    if (!canUploadResult.allowed) {
      Alert.alert(
        '업로드 제한',
        canUploadResult.reason || '업로드가 제한되었습니다.',
        [
          { text: '확인', style: 'default' },
          ...(planType === 'FREE' ? [
            { 
              text: 'PRO 업그레이드', 
              style: 'default' as const,
              onPress: handleUpgradePress 
            }
          ] : [])
        ]
      );
      return;
    }

    navigation.navigate('Upload');
  };

  const handleUpgradePress = () => {
    Alert.alert(
      'PRO 플랜 업그레이드',
      'PRO 플랜으로 업그레이드하면 무제한으로 PDF를 변환할 수 있습니다.',
      [
        { text: '나중에', style: 'cancel' },
        { 
          text: '개발용 PRO 활성화', 
          style: 'default',
          onPress: async () => {
            await userPlanService.setProUser(true);
            await loadUsageData();
          }
        }
      ]
    );
  };

  const handlePlanToggle = async () => {
    const isCurrentlyPro = planType === 'PRO';
    Alert.alert(
      '플랜 변경 (개발용)',
      `${isCurrentlyPro ? 'FREE' : 'PRO'} 플랜으로 변경하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '변경', 
          style: 'default',
          onPress: async () => {
            await userPlanService.setProUser(!isCurrentlyPro);
            await loadUsageData();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 헤더 섹션 */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>PDFXcel</Text>
          <Text style={styles.subtitle}>
            PDF 은행 명세서를 Excel로 간편하게 변환하세요
          </Text>
        </View>

        {/* 사용량 카드 */}
        {!loading && usageStatus && (
          <UsageCard
            usageStatus={usageStatus}
            planType={planType}
            onUpgradePress={handleUpgradePress}
          />
        )}

        {/* 개발용 플랜 토글 버튼 */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.devButton}
            onPress={handlePlanToggle}
          >
            <Ionicons name="settings" size={16} color={COLORS.textSecondary} />
            <Text style={styles.devButtonText}>
              개발용: {planType} 플랜 토글
            </Text>
          </TouchableOpacity>
        )}

        {/* 기능 설명 */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>주요 기능</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="cloud-upload" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>간편한 업로드</Text>
              <Text style={styles.featureDescription}>
                PDF 파일을 선택하여 쉽게 업로드
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="bulb" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI 지능형 분석</Text>
              <Text style={styles.featureDescription}>
                Claude AI로 정확한 데이터 추출
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="grid" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Excel 변환</Text>
              <Text style={styles.featureDescription}>
                구조화된 Excel 파일로 자동 변환
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="share" size={24} color={COLORS.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>쉬운 공유</Text>
              <Text style={styles.featureDescription}>
                변환된 파일을 바로 공유하거나 저장
              </Text>
            </View>
          </View>
        </View>

        {/* 시작 버튼 */}
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartConversion}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={24} color="white" />
          <Text style={styles.startButtonText}>변환 시작하기</Text>
        </TouchableOpacity>

        {/* 안내 텍스트 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            📋 지원 형식: PDF 은행 명세서
          </Text>
          <Text style={styles.infoText}>
            🔒 안전한 처리: 업로드된 파일은 24시간 후 자동 삭제
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
    paddingVertical: SPACING.lg,
  },
  iconContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 20,
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