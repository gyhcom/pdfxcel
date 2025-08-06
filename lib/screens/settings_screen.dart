import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import 'privacy_policy_screen.dart';
import 'terms_of_service_screen.dart';
import 'subscription_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        title: const Text(
          '설정',
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
        child: Column(
          children: [
            // 계정 정보
            _buildSection([
              Consumer<AppStateProvider>(
                builder: (context, appState, child) {
                  return _buildSettingItem(
                    icon: appState.isProUser ? Icons.diamond : Icons.person_outline_rounded,
                    title: appState.isProUser ? 'PRO 멤버십' : '무료 사용자',
                    subtitle: appState.isProUser 
                        ? '무제한 AI 변환 이용 중'
                        : appState.getConvertLimitMessage(),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // 구독 상태 새로고침 버튼 (PRO 사용자에게만 표시)
                        if (appState.isProUser)
                          GestureDetector(
                            onTap: () => _refreshSubscriptionStatus(context),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              child: const Icon(
                                Icons.refresh_rounded,
                                size: 18,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ),
                        appState.isProUser 
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEAB308),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'PRO',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                      ],
                    ),
                    onTap: appState.isProUser 
                        ? null 
                        : () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const SubscriptionScreen(),
                            ),
                          ),
                  );
                },
              ),
            ]),
            
            const SizedBox(height: 20),
            
            // 앱 정보
            _buildSection([
              _buildSettingItem(
                icon: Icons.info_outline_rounded,
                title: '앱 정보',
                subtitle: 'PDFXcel v1.0.0',
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => _showAppInfoDialog(context),
              ),
              _buildSettingItem(
                icon: Icons.star_outline_rounded,
                title: '앱 평가하기',
                subtitle: 'App Store에서 평가해주세요',
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => _showRatingDialog(context),
              ),
            ]),
            
            const SizedBox(height: 20),
            
            // 지원
            _buildSection([
              _buildSettingItem(
                icon: Icons.help_outline_rounded,
                title: '도움말',
                subtitle: '사용법 및 문제 해결',
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => _showHelpDialog(context),
              ),
              _buildSettingItem(
                icon: Icons.email_outlined,
                title: '문의하기',
                subtitle: '개발팀에 문의',
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => _showContactDialog(context),
              ),
            ]),
            
            const SizedBox(height: 20),
            
            // 법적 고지
            _buildSection([
              _buildSettingItem(
                icon: Icons.privacy_tip_outlined,
                title: '개인정보처리방침',
                subtitle: '개인정보 수집 및 이용 안내',
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const PrivacyPolicyScreen(),
                  ),
                ),
              ),
              _buildSettingItem(
                icon: Icons.description_outlined,
                title: '이용약관',
                subtitle: '서비스 이용 규정',
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TermsOfServiceScreen(),
                  ),
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSection(List<Widget> items) {
    return Container(
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
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          return Column(
            children: [
              item,
              if (index < items.length - 1)
                Divider(
                  height: 1,
                  color: Colors.grey.shade200,
                  indent: 60,
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
  
  Widget _buildSettingItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Widget trailing,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: const Color(0xFF3B82F6),
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              trailing,
            ],
          ),
        ),
      ),
    );
  }
  
  void _showAppInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('PDFXcel'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('버전: 1.0.0'),
            SizedBox(height: 8),
            Text('AI 기반 PDF to Excel 변환 서비스'),
            SizedBox(height: 8),
            Text('개발: PDFXcel 팀'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }
  
  void _showRatingDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('앱 평가'),
        content: const Text('PDFXcel이 도움이 되셨나요?\nApp Store에서 평가해주시면 큰 힘이 됩니다!'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('나중에'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: App Store 평가 페이지로 이동
            },
            child: const Text('평가하기'),
          ),
        ],
      ),
    );
  }
  
  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('도움말'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('1. PDF 파일을 선택하세요'),
            SizedBox(height: 8),
            Text('2. AI 변환을 시작하세요'),
            SizedBox(height: 8),
            Text('3. 변환 완료 후 Excel 파일을 다운로드하세요'),
            SizedBox(height: 16),
            Text('문제가 있으시면 문의하기를 이용해주세요.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }
  
  void _showContactDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('문의하기'),
        content: const Text('개발팀에 문의사항이 있으시면\n아래 이메일로 연락해주세요.\n\nsupport@pdfxcel.app'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }
  
  // 구독 상태 새로고침
  Future<void> _refreshSubscriptionStatus(BuildContext context) async {
    try {
      // 로딩 표시
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('구독 상태를 확인하고 있습니다...'),
          duration: Duration(seconds: 2),
        ),
      );
      
      final appState = Provider.of<AppStateProvider>(context, listen: false);
      await appState.refreshSubscriptionStatus();
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('구독 상태가 업데이트되었습니다.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('구독 상태 확인 실패: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}