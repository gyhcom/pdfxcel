import 'dart:io';
import 'package:flutter/material.dart';

class NetworkChecker {
  static Future<bool> hasConnection() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } on SocketException catch (_) {
      return false;
    }
  }

  /// 네트워크 연결 상태를 확인하고 오프라인 시 다이얼로그 표시
  static Future<bool> checkConnectionWithDialog(BuildContext context) async {
    final hasNet = await hasConnection();
    if (!hasNet && context.mounted) {
      showOfflineDialog(context);
    }
    return hasNet;
  }

  /// 오프라인 안내 다이얼로그
  static void showOfflineDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.wifi_off_rounded,
              color: Colors.orange.shade600,
              size: 24,
            ),
            const SizedBox(width: 12),
            const Text('인터넷 연결이 필요합니다'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'PDF 변환은 AI 서버가 필요해요',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 20),
            
            // 지금 할 수 있는 작업들
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FA),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.search_rounded,
                        color: Colors.blue.shade600,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '지금 할 수 있는 작업:',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  _buildOfflineAction(Icons.history_rounded, '변환 히스토리 보기'),
                  _buildOfflineAction(Icons.download_rounded, '이전 파일 다운로드'),
                  _buildOfflineAction(Icons.help_outline_rounded, '사용 가이드 보기'),
                  _buildOfflineAction(Icons.settings_rounded, '앱 설정'),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    color: Colors.blue.shade600,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Wi-Fi나 모바일 데이터를 연결하고 다시 시도해주세요',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              // 네트워크 재확인
              final hasNet = await hasConnection();
              if (context.mounted) {
                if (hasNet) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✅ 인터넷에 연결되었습니다!'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('❌ 아직 인터넷에 연결되지 않았습니다'),
                      backgroundColor: Colors.orange,
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              }
            },
            child: const Text('다시 확인'),
          ),
        ],
      ),
    );
  }

  static Widget _buildOfflineAction(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: const Color(0xFF6B7280),
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  /// 오프라인 상태 배너 위젯
  static Widget buildOfflineBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.orange.shade100,
      child: Row(
        children: [
          Icon(
            Icons.wifi_off_rounded,
            color: Colors.orange.shade700,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '오프라인 모드 • PDF 변환을 위해 인터넷 연결이 필요합니다',
              style: TextStyle(
                fontSize: 13,
                color: Colors.orange.shade800,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}