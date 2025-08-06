import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        title: const Text(
          '개인정보처리방침',
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
                'PDFXcel 개인정보처리방침',
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
                '1. 개인정보의 수집 및 이용목적',
                '''PDFXcel은 다음의 목적을 위하여 개인정보를 처리합니다.

• 서비스 제공: PDF to Excel 변환 서비스 제공
• 서비스 개선: 변환 품질 향상 및 사용자 경험 개선
• 고객 지원: 문의사항 처리 및 기술 지원
• 결제 처리: 구독 서비스 결제 및 관리''',
              ),
              
              _buildSection(
                '2. 수집하는 개인정보 항목',
                '''• 필수정보: 기기 식별자, 앱 사용 정보
• 선택정보: 이메일 주소 (고객지원 시)
• 파일정보: 업로드한 PDF 파일 (임시 처리용, 변환 완료 후 자동 삭제)
• 결제정보: Apple App Store를 통한 구독 정보''',
              ),
              
              _buildSection(
                '3. 개인정보의 처리 및 보유기간',
                '''• 업로드된 PDF 파일: 변환 완료 후 즉시 삭제
• 변환 기록: 사용자가 삭제하기 전까지 보관
• 구독 정보: 구독 해지 후 3년간 보관 (전자상거래법)
• 기타 정보: 서비스 이용 기간 중 보관''',
              ),
              
              _buildSection(
                '4. 개인정보의 제3자 제공',
                '''PDFXcel은 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.

• 사용자의 동의가 있는 경우
• 법령의 규정에 의한 경우
• 서비스 제공을 위한 필수 제휴사 (Anthropic Claude API, Railway 호스팅)''',
              ),
              
              _buildSection(
                '5. 개인정보의 파기',
                '''수집된 개인정보는 보유기간이 경과하거나 처리목적이 달성된 경우 즉시 파기됩니다.

• 파기절차: 별도의 DB에 옮겨져 내부 방침에 따라 파기
• 파기방법: 전자적 파일은 복구 불가능한 방법으로 삭제''',
              ),
              
              _buildSection(
                '6. 이용자의 권리',
                '''이용자는 언제든지 다음의 권리를 행사할 수 있습니다.

• 개인정보 열람 요구
• 오류 등이 있을 경우 정정·삭제 요구
• 처리정지 요구
• 손해배상청구''',
              ),
              
              _buildSection(
                '7. 개인정보보호책임자',
                '''개발자: PDFXcel 개발팀
연락처: support@pdfxcel.app

개인정보처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용이 수정될 수 있으며, 변경 시 앱 내 공지를 통해 알려드립니다.''',
              ),
              
              const SizedBox(height: 32),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '본 개인정보처리방침은 PDFXcel 앱 사용 시 적용됩니다. 서비스 이용 시 본 방침에 동의한 것으로 봅니다.',
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