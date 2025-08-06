import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../utils/file_validator.dart';

class FileUploadDialog {
  /// 파일 업로드 안내 및 선택 다이얼로그
  static Future<PlatformFile?> showUploadDialog(BuildContext context) async {
    // 먼저 안내 다이얼로그 표시
    final shouldProceed = await _showGuidelineDialog(context);
    if (!shouldProceed) return null;
    
    // 파일 선택
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      allowMultiple: false,
    );
    
    if (result == null || result.files.isEmpty) {
      return null;
    }
    
    final file = result.files.first;
    if (file.path == null) {
      if (context.mounted) {
        _showErrorDialog(context, '파일 경로를 가져올 수 없습니다.');
      }
      return null;
    }
    
    // 파일 검증
    final validationResult = await FileValidator.validatePdfFile(file.path!);
    
    if (!validationResult.isValid) {
      if (context.mounted) {
        _showErrorDialog(context, validationResult.errorMessage!);
      }
      return null;
    }
    
    // 경고 메시지가 있으면 표시
    if (validationResult.warningMessage != null) {
      if (!context.mounted) return null;
      final shouldContinue = await _showWarningDialog(
        context, 
        validationResult.warningMessage!,
      );
      if (!shouldContinue) return null;
    }
    
    // 파일 정보 확인 다이얼로그
    final fileInfo = await FileValidator.getFileInfo(file.path!);
    if (!context.mounted) return null;
    final confirmed = await _showFileConfirmDialog(context, fileInfo);
    
    return confirmed ? file : null;
  }
  
  /// 업로드 가이드라인 다이얼로그
  static Future<bool> _showGuidelineDialog(BuildContext context) async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.upload_file_rounded,
                color: Color(0xFF3B82F6),
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'PDF 파일 업로드',
              style: TextStyle(fontSize: 18),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '업로드하기 전에 확인해주세요:',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 16),
              
              _buildGuidelineItem(
                icon: Icons.check_circle_outline,
                title: '지원 형식',
                description: 'PDF 파일만 가능',
                color: const Color(0xFF10B981),
              ),
              
              _buildGuidelineItem(
                icon: Icons.data_usage_rounded,
                title: '파일 크기',
                description: '최대 50MB까지',
                color: const Color(0xFF3B82F6),
              ),
              
              _buildGuidelineItem(
                icon: Icons.table_chart_rounded,
                title: '최적 파일',
                description: '표나 데이터가 포함된 PDF',
                color: const Color(0xFF8B5CF6),
              ),
              
              _buildGuidelineItem(
                icon: Icons.security_rounded,
                title: '개인정보',
                description: '민감한 정보는 제거 후 업로드',
                color: const Color(0xFFEAB308),
              ),
              
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.tips_and_updates_rounded,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        '테이블이 명확한 PDF일수록 더 정확한 변환이 가능합니다',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('취소'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('파일 선택'),
          ),
        ],
      ),
    ) ?? false;
  }
  
  /// 가이드라인 아이템 위젯
  static Widget _buildGuidelineItem({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  /// 파일 확인 다이얼로그
  static Future<bool> _showFileConfirmDialog(
    BuildContext context, 
    Map<String, String> fileInfo,
  ) async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('파일 정보 확인'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildFileInfoRow('파일명', fileInfo['name']!),
            _buildFileInfoRow('크기', fileInfo['size']!),
            _buildFileInfoRow('수정일', fileInfo['modified']!),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Color(0xFF3B82F6),
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '파일은 변환 완료 후 자동으로 삭제됩니다',
                      style: TextStyle(
                        fontSize: 13,
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
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('다른 파일 선택'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('변환 시작'),
          ),
        ],
      ),
    ) ?? false;
  }
  
  /// 파일 정보 행 위젯
  static Widget _buildFileInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Color(0xFF6B7280),
              ),
            ),
          ),
          const Text(': '),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Color(0xFF1F2937)),
            ),
          ),
        ],
      ),
    );
  }
  
  /// 경고 다이얼로그
  static Future<bool> _showWarningDialog(
    BuildContext context, 
    String message,
  ) async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: Colors.orange.shade600,
            ),
            const SizedBox(width: 12),
            const Text('알림'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('취소'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('계속 진행'),
          ),
        ],
      ),
    ) ?? false;
  }
  
  /// 에러 다이얼로그
  static void _showErrorDialog(BuildContext context, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.error_outline_rounded,
              color: Colors.red.shade600,
            ),
            const SizedBox(width: 12),
            const Text('오류'),
          ],
        ),
        content: Text(message),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }
}