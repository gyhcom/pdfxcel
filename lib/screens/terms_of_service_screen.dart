import 'package:flutter/material.dart';

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        title: const Text(
          '이용약관',
          style: TextStyle(
            color: Color(0xFF1F2937),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
            color: Color(0xFF6B7280),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                offset: const Offset(0, 4),
                blurRadius: 20,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'PDFXcel 서비스 이용약관',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '최종 업데이트: ${DateTime.now().year}년 ${DateTime.now().month}월 ${DateTime.now().day}일',
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 32),
              
              _buildSection(
                '1. 서비스 개요',
                '''PDFXcel은 AI 기술을 활용한 PDF to Excel 변환 서비스입니다.

• 서비스명: PDFXcel
• 제공자: PDFXcel 개발팀  
• 서비스 내용: PDF 파일을 Excel 파일로 변환
• 플랫폼: iOS 앱스토어를 통한 모바일 앱''',
              ),
              
              _buildSection(
                '2. 이용계약의 성립',
                '''• 본 약관에 동의하고 앱을 설치·이용하는 경우 이용계약이 성립됩니다.
• 만 14세 미만은 법정대리인의 동의가 필요합니다.
• 허위정보 제공 시 계약이 취소될 수 있습니다.''',
              ),
              
              _buildSection(
                '3. 서비스 이용',
                '''• 무료 서비스: 일일 제한된 횟수의 AI 변환 제공
• 유료 서비스(PRO): 무제한 AI 변환, 광고 제거
• 업로드 파일 제한: PDF 형식, 최대 50MB
• 변환 품질은 원본 PDF의 품질에 따라 달라질 수 있습니다.''',
              ),
              
              _buildSection(
                '4. 사용자의 의무',
                '''사용자는 다음 행위를 하여서는 안 됩니다.

• 저작권을 침해하는 파일 업로드
• 악성코드가 포함된 파일 업로드
• 개인정보가 포함된 민감한 문서 업로드 (보안 위험)
• 서비스의 정상적인 운영을 방해하는 행위
• 타인의 권리를 침해하는 행위''',
              ),
              
              _buildSection(
                '5. 결제 및 환불',
                '''• 결제: Apple App Store를 통한 인앱결제
• 구독형 서비스: 자동 갱신 (해지 전까지)
• 환불: Apple App Store 환불 정책에 따름
• 구독 해지: iOS 설정 > 구독 메뉴에서 직접 해지''',
              ),
              
              _buildSection(
                '6. 서비스 제한 및 중단',
                '''다음의 경우 서비스 이용이 제한될 수 있습니다.

• 약관 위반 시
• 기술적 문제 발생 시
• 정기 점검 시
• 법적 요구가 있는 경우

서비스 중단 시 사전 공지하며, 불가피한 경우 사후 공지할 수 있습니다.''',
              ),
              
              _buildSection(
                '7. 지적재산권',
                '''• PDFXcel 앱 및 서비스에 대한 모든 권리는 개발팀에 있습니다.
• 사용자가 업로드한 파일의 저작권은 사용자에게 있습니다.
• 변환된 Excel 파일의 이용 권한은 사용자에게 있습니다.''',
              ),
              
              _buildSection(
                '8. 면책조항',
                '''• 변환 결과의 정확성을 100% 보장하지 않습니다.
• 사용자의 파일 내용에 대해 책임지지 않습니다.
• 네트워크 장애, 기기 문제로 인한 손실에 대해 책임지지 않습니다.
• 제3자 서비스(Apple, Anthropic 등) 정책 변경으로 인한 서비스 변경 가능''',
              ),
              
              _buildSection(
                '9. 약관의 변경',
                '''• 약관 변경 시 앱 내 공지 또는 팝업으로 알려드립니다.
• 중요한 변경사항은 30일 전 사전 공지합니다.
• 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하시기 바랍니다.''',
              ),
              
              _buildSection(
                '10. 분쟁해결',
                '''• 서비스 관련 분쟁은 상호 협의를 통해 해결합니다.
• 협의가 불가능한 경우 관련 법령에 따라 해결합니다.
• 준거법: 대한민국 법률
• 관할법원: 서울중앙지방법원''',
              ),
              
              const SizedBox(height: 32),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '본 약관은 PDFXcel 앱 사용 시 적용됩니다. 서비스 이용 시 본 약관에 동의한 것으로 봅니다.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF1F2937),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          content,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF4B5563),
            height: 1.6,
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}