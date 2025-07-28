import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  const openEmail = () => {
    Linking.openURL('mailto:support@pdfxcel.com?subject=개인정보 처리방침 문의');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보 처리방침</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 개요</Text>
          <Text style={styles.text}>
            PDFxcel은 사용자의 개인정보 보호를 중요하게 생각합니다. 
            본 방침은 앱 사용 시 수집되는 정보와 사용 목적을 설명합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 수집 정보</Text>
          <Text style={styles.subsectionTitle}>수집하는 정보:</Text>
          <Text style={styles.bulletText}>• PDF 파일 (변환 목적으로만 사용)</Text>
          <Text style={styles.bulletText}>• 앱 사용 통계 (익명화)</Text>
          <Text style={styles.bulletText}>• 디바이스 정보 (성능 최적화)</Text>
          
          <Text style={styles.subsectionTitle}>수집하지 않는 정보:</Text>
          <Text style={styles.bulletText}>• 개인 식별 정보 (이름, 이메일 등)</Text>
          <Text style={styles.bulletText}>• 위치 정보</Text>
          <Text style={styles.bulletText}>• 연락처, 사진</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 데이터 보호</Text>
          <View style={styles.protectionCard}>
            <View style={styles.protectionItem}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.protectionText}>
                업로드된 PDF는 24시간 내 자동 삭제
              </Text>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              <Text style={styles.protectionText}>
                모든 데이터 HTTPS 암호화 전송
              </Text>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
              <Text style={styles.protectionText}>
                제3자에게 개인정보 미제공
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 사용 목적</Text>
          <Text style={styles.bulletText}>• PDF to Excel 변환 서비스 제공</Text>
          <Text style={styles.bulletText}>• AI 기반 데이터 추출 및 분석</Text>
          <Text style={styles.bulletText}>• 앱 성능 및 사용자 경험 개선</Text>
          <Text style={styles.bulletText}>• 기술적 문제 해결</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤝 제3자 서비스</Text>
          <Text style={styles.text}>
            다음 서비스들이 앱 운영에 사용됩니다:
          </Text>
          <Text style={styles.bulletText}>• Railway.app (서버 호스팅)</Text>
          <Text style={styles.bulletText}>• Anthropic Claude (AI 분석)</Text>
          <Text style={styles.bulletText}>• Expo (앱 플랫폼)</Text>
          <Text style={styles.text}>
            각 서비스는 자체 개인정보 처리방침을 따릅니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 사용자 권리</Text>
          <Text style={styles.text}>
            사용자는 언제든지 다음을 요청할 수 있습니다:
          </Text>
          <Text style={styles.bulletText}>• 업로드한 파일의 즉시 삭제</Text>
          <Text style={styles.bulletText}>• 개인정보 처리 관련 문의</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 문의</Text>
          <Text style={styles.text}>
            개인정보 처리에 관한 문의사항이 있으시면 언제든지 연락해주세요.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Ionicons name="mail" size={20} color="white" />
            <Text style={styles.contactButtonText}>문의하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            최종 업데이트: 2025년 7월 28일
          </Text>
          <Text style={styles.footerText}>
            이 정책은 사용자 보호를 위해 지속적으로 개선됩니다.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 40, // backButton과 같은 크기
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  section: {
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  protectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  protectionText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
});

export default PrivacyPolicyScreen;