import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:io';
import '../l10n/app_localizations.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isLoading = false;

  // 문의 카테고리
  String _selectedCategory = 'general';

  List<String> get _categories {
    return [
      'general',
      'bug',
      'feature',
      'payment',
      'account',
      'other'
    ];
  }

  String _getCategoryDisplayName(String category) {
    final l10n = AppLocalizations.of(context)!;
    final isKorean = l10n.localeName == 'ko';
    switch (category) {
      case 'general':
        return isKorean ? '일반 문의' : 'General Inquiry';
      case 'bug':
        return isKorean ? '버그 신고' : 'Bug Report';
      case 'feature':
        return isKorean ? '기능 제안' : 'Feature Request';
      case 'payment':
        return isKorean ? '결제 문제' : 'Payment Issue';
      case 'account':
        return isKorean ? '계정 문제' : 'Account Issue';
      case 'other':
        return isKorean ? '기타' : 'Other';
      default:
        return category;
    }
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<String> _getDeviceInfo() async {
    final packageInfo = await PackageInfo.fromPlatform();
    final deviceInfo = DeviceInfoPlugin();
    
    String deviceDetails = '';
    
    try {
      if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        deviceDetails = '''
앱 버전: ${packageInfo.version} (${packageInfo.buildNumber})
기기: ${iosInfo.name}
모델: ${iosInfo.model}
시스템: iOS ${iosInfo.systemVersion}
기기 식별자: ${iosInfo.identifierForVendor}
''';
      }
    } catch (e) {
      deviceDetails = '앱 버전: ${packageInfo.version} (${packageInfo.buildNumber})';
    }
    
    return deviceDetails;
  }

  Future<void> _sendEmail() async {
    final l10n = AppLocalizations.of(context)!;
    
    final isKorean = l10n.localeName == 'ko';
    
    if (_subjectController.text.trim().isEmpty || _messageController.text.trim().isEmpty) {
      _showSnackBar(isKorean ? '제목과 내용을 모두 입력해주세요.' : 'Please enter both subject and message.', isError: true);
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final deviceInfo = await _getDeviceInfo();
      
      final categoryName = _getCategoryDisplayName(_selectedCategory);
      final subject = '[PDFXcel] $categoryName - ${_subjectController.text.trim()}';
      final body = isKorean ? '''
문의 카테고리: $categoryName
제목: ${_subjectController.text.trim()}

문의 내용:
${_messageController.text.trim()}

---
시스템 정보:
$deviceInfo

※ 위 정보는 문제 해결을 위해 자동으로 포함되었습니다.
''' : '''
Inquiry Category: $categoryName
Subject: ${_subjectController.text.trim()}

Message:
${_messageController.text.trim()}

---
System Information:
$deviceInfo

※ This information is automatically included for troubleshooting.
''';

      final emailUri = Uri(
        scheme: 'mailto',
        path: 'gyeonho@gmail.com',
        queryParameters: {
          'subject': subject,
          'body': body,
        },
      );

      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri);
        if (mounted) {
          _showSnackBar(isKorean ? '이메일 앱이 열렸습니다. 전송 버튼을 눌러주세요.' : 'Email app opened. Please tap the send button.');
        }
      } else {
        _showEmailCopyDialog(subject, body);
      }
    } catch (e) {
      _showSnackBar(isKorean ? '이메일을 여는 중 오류가 발생했습니다.' : 'An error occurred while opening the email app.', isError: true);
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showEmailCopyDialog(String subject, String body) {
    final l10n = AppLocalizations.of(context)!;
    final isKorean = l10n.localeName == 'ko';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isKorean ? '이메일 복사' : 'Copy Email'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(isKorean ? '이메일 앱을 열 수 없어 내용을 복사합니다.' : 'Cannot open email app. Copying content instead.'),
            const SizedBox(height: 16),
            Text(isKorean ? '받는 사람:' : 'To:', style: const TextStyle(fontWeight: FontWeight.bold)),
            const Text('gyeonho@gmail.com'),
            const SizedBox(height: 8),
            Text(isKorean ? '제목:' : 'Subject:', style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(subject),
            const SizedBox(height: 8),
            Text(isKorean ? '내용:' : 'Content:', style: const TextStyle(fontWeight: FontWeight.bold)),
            Container(
              height: 100,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(4),
              ),
              child: SingleChildScrollView(
                child: Text(body, style: const TextStyle(fontSize: 12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(isKorean ? '취소' : 'Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: body));
              Navigator.pop(context);
              _showSnackBar(isKorean ? '내용이 복사되었습니다.' : 'Content copied to clipboard.');
            },
            child: Text(isKorean ? '내용 복사' : 'Copy Content'),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        title: Text(
          l10n.contactUs,
          style: const TextStyle(
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
              // 헤더
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.support_agent_rounded,
                      color: Theme.of(context).primaryColor,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.contactUs,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        Text(
                          l10n.localeName == 'ko' 
                            ? '궁금한 점이나 문제가 있으시면 언제든 연락해주세요'
                            : 'Feel free to contact us if you have any questions or issues',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              // 문의 카테고리
              Text(
                l10n.contactCategory,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedCategory,
                    isExpanded: true,
                    items: _categories.map((category) => DropdownMenuItem(
                      value: category,
                      child: Text(_getCategoryDisplayName(category)),
                    )).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _selectedCategory = value;
                        });
                      }
                    },
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // 제목
              Text(
                l10n.contactSubject,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _subjectController,
                decoration: InputDecoration(
                  hintText: l10n.contactSubjectHint,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Theme.of(context).primaryColor, width: 2),
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // 문의 내용
              Text(
                l10n.contactMessage,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _messageController,
                maxLines: 6,
                decoration: InputDecoration(
                  hintText: l10n.contactMessageHint,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Theme.of(context).primaryColor, width: 2),
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // 안내사항
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.info_outline, color: Color(0xFF0EA5E9), size: 20),
                        const SizedBox(width: 8),
                        Text(
                          l10n.contactNotice,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0C4A6E),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.contactNoticeText,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF075985),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // 전송 버튼
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _sendEmail,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send_rounded),
                  label: Text(_isLoading ? l10n.sending : l10n.sendInquiry),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}