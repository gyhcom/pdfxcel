import 'dart:io';

class FileValidationResult {
  final bool isValid;
  final String? errorMessage;
  final String? warningMessage;
  
  const FileValidationResult({
    required this.isValid,
    this.errorMessage,
    this.warningMessage,
  });
  
  static const FileValidationResult valid = FileValidationResult(isValid: true);
}

class FileValidator {
  // 파일 크기 제한 (50MB)
  static const int maxFileSizeBytes = 50 * 1024 * 1024;
  
  // 지원하는 파일 확장자
  static const List<String> supportedExtensions = ['.pdf'];
  
  /// PDF 파일 검증
  static Future<FileValidationResult> validatePdfFile(String filePath) async {
    try {
      final file = File(filePath);
      
      // 파일 존재 여부 확인
      if (!await file.exists()) {
        return const FileValidationResult(
          isValid: false,
          errorMessage: '파일을 찾을 수 없습니다. 다시 선택해주세요.',
        );
      }
      
      // 파일 확장자 확인
      final fileName = file.path.toLowerCase();
      final hasValidExtension = supportedExtensions.any(
        (ext) => fileName.endsWith(ext),
      );
      
      if (!hasValidExtension) {
        return const FileValidationResult(
          isValid: false,
          errorMessage: 'PDF 파일만 업로드할 수 있습니다.\n지원 형식: .pdf',
        );
      }
      
      // 파일 크기 확인
      final fileSize = await file.length();
      if (fileSize > maxFileSizeBytes) {
        final fileSizeMB = (fileSize / (1024 * 1024)).toStringAsFixed(1);
        return FileValidationResult(
          isValid: false,
          errorMessage: '파일 크기가 너무 큽니다.\n'
              '현재 크기: ${fileSizeMB}MB\n'
              '최대 허용: 50MB',
        );
      }
      
      // 경고 메시지 (큰 파일)
      String? warningMessage;
      if (fileSize > 10 * 1024 * 1024) { // 10MB 이상
        final fileSizeMB = (fileSize / (1024 * 1024)).toStringAsFixed(1);
        warningMessage = '큰 파일입니다 (${fileSizeMB}MB).\n변환에 시간이 더 걸릴 수 있습니다.';
      }
      
      // 파일 내용 간단 검증 (PDF 헤더 확인)
      final bytes = await file.readAsBytes();
      if (bytes.length < 4 || 
          !(bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46)) {
        return const FileValidationResult(
          isValid: false,
          errorMessage: '올바른 PDF 파일이 아닙니다.\n다른 파일을 선택해주세요.',
        );
      }
      
      return FileValidationResult(
        isValid: true,
        warningMessage: warningMessage,
      );
      
    } catch (e) {
      return FileValidationResult(
        isValid: false,
        errorMessage: '파일을 읽는 중 오류가 발생했습니다.\n$e',
      );
    }
  }
  
  /// 파일 크기를 사람이 읽기 쉬운 형태로 변환
  static String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '${bytes}B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)}KB';
    } else {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
    }
  }
  
  /// 파일 정보 요약
  static Future<Map<String, String>> getFileInfo(String filePath) async {
    try {
      final file = File(filePath);
      final fileName = file.path.split('/').last;
      final fileSize = await file.length();
      final lastModified = await file.lastModified();
      
      return {
        'name': fileName,
        'size': formatFileSize(fileSize),
        'modified': '${lastModified.year}-${lastModified.month.toString().padLeft(2, '0')}-${lastModified.day.toString().padLeft(2, '0')}',
      };
    } catch (e) {
      return {
        'name': '알 수 없음',
        'size': '알 수 없음',
        'modified': '알 수 없음',
      };
    }
  }
}