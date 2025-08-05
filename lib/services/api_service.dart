import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';

class ApiError {
  final String code;
  final String message;
  final dynamic details;

  ApiError({
    required this.code,
    required this.message,
    this.details,
  });

  @override
  String toString() => 'ApiError($code): $message';
}

class UploadResponse {
  final String fileId;
  final String message;
  final String processingType;

  UploadResponse({
    required this.fileId,
    required this.message,
    required this.processingType,
  });

  factory UploadResponse.fromJson(Map<String, dynamic> json) {
    return UploadResponse(
      fileId: json['file_id'] ?? '',
      message: json['message'] ?? '',
      processingType: json['processing_type'] ?? 'basic',
    );
  }
}

class TablePreviewData {
  final List<String> headers;
  final List<List<String>> rows;
  final int totalRows;
  final int totalColumns;

  TablePreviewData({
    required this.headers,
    required this.rows,
    required this.totalRows,
    required this.totalColumns,
  });

  factory TablePreviewData.fromJson(Map<String, dynamic> json) {
    return TablePreviewData(
      headers: List<String>.from(json['headers'] ?? []),
      rows: (json['rows'] as List?)
          ?.map((row) => List<String>.from(row))
          .toList() ?? [],
      totalRows: json['rows']?.length ?? 0,
      totalColumns: json['headers']?.length ?? 0,
    );
  }
}

class ApiService {
  static const String _baseUrl = 'https://pdfxcel-production.up.railway.app/api';
  static const int _timeout = 60000; // 60초로 증가
  
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: Duration(milliseconds: _timeout),
      receiveTimeout: Duration(milliseconds: _timeout),
      sendTimeout: Duration(milliseconds: _timeout),
      headers: {
        'Accept': 'application/json',
      },
    ));

    // 인터셉터 추가 (로깅용)
    _dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      requestHeader: true,
      responseHeader: false,
    ));
  }

  // 네트워크 연결 상태 확인
  Future<bool> _checkNetworkConnection() async {
    try {
      // health 엔드포인트는 /api 없이 루트에 있음
      final healthDio = Dio(BaseOptions(
        baseUrl: 'https://pdfxcel-production.up.railway.app',
        connectTimeout: Duration(milliseconds: 15000), // 15초로 증가
        receiveTimeout: Duration(milliseconds: 15000), // 15초로 증가
      ));
      
      final response = await healthDio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('네트워크 연결 확인 실패: $e');
      // health check 실패해도 true 반환 (실제 업로드에서 재시도)
      return true;
    }
  }

  // 에러 분류 및 사용자 친화적 메시지 생성
  ApiError _createApiError(dynamic error, String context) {
    debugPrint('API Error in $context: $error');
    
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return ApiError(
            code: 'TIMEOUT_ERROR',
            message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
            details: error,
          );
        
        case DioExceptionType.connectionError:
          return ApiError(
            code: 'NETWORK_ERROR',
            message: '인터넷 연결을 확인해주세요.',
            details: error,
          );
        
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          switch (statusCode) {
            case 400:
              return ApiError(
                code: 'BAD_REQUEST',
                message: '잘못된 요청입니다. 파일 형식을 확인해주세요.',
                details: error,
              );
            case 401:
              return ApiError(
                code: 'UNAUTHORIZED',
                message: '인증이 필요합니다.',
                details: error,
              );
            case 413:
              return ApiError(
                code: 'FILE_TOO_LARGE',
                message: '파일 크기가 너무 큽니다. (최대 10MB)',
                details: error,
              );
            case 429:
              return ApiError(
                code: 'RATE_LIMIT',
                message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
                details: error,
              );
            case 500:
              return ApiError(
                code: 'SERVER_ERROR',
                message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                details: error,
              );
            default:
              return ApiError(
                code: 'HTTP_ERROR',
                message: '서버 오류 ($statusCode): 관리자에게 문의해주세요.',
                details: error,
              );
          }
        
        default:
          return ApiError(
            code: 'UNKNOWN_ERROR',
            message: error.message ?? '알 수 없는 오류가 발생했습니다.',
            details: error,
          );
      }
    }
    
    return ApiError(
      code: 'UNKNOWN_ERROR',
      message: error.toString(),
      details: error,
    );
  }

  // 세션 ID 가져오기
  Future<String> _getSessionId() async {
    final prefs = await SharedPreferences.getInstance();
    String? sessionId = prefs.getString('session_id');
    
    if (sessionId == null) {
      sessionId = DateTime.now().millisecondsSinceEpoch.toString();
      await prefs.setString('session_id', sessionId);
    }
    
    return sessionId;
  }

  // PDF 업로드
  Future<UploadResponse> uploadPdf(
    String filePath,
    String fileName, {
    bool useAi = false,
    Function(int, int)? onSendProgress,
  }) async {
    try {
      debugPrint('🚀 PDF 업로드 시작: $fileName (AI: $useAi)');
      
      // 네트워크 연결 확인 (실패해도 계속 진행)
      await _checkNetworkConnection();

      // 파일 크기 확인
      final file = File(filePath);
      final fileSize = await file.length();
      if (fileSize > 10 * 1024 * 1024) { // 10MB
        throw ApiError(
          code: 'FILE_TOO_LARGE',
          message: '파일 크기가 너무 큽니다. (최대 10MB)',
        );
      }
      
      // 세션 ID 가져오기
      final sessionId = await _getSessionId();

      // 파일 크기 로깅
      final fileBytes = await file.readAsBytes();
      debugPrint('📄 파일 크기: ${fileBytes.length} bytes');

      // FormData 생성 (multipart/form-data 형식)
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          filePath, 
          filename: fileName,
          contentType: MediaType('application', 'pdf'),
        ),
        'use_ai': useAi,
        'original_filename': fileName,
      });

      debugPrint('🔑 세션 ID: $sessionId');
      
      // 업로드 요청
      final response = await _dio.post(
        '/upload',
        data: formData,
        onSendProgress: onSendProgress,
        options: Options(
          headers: {
            'X-Session-ID': sessionId,
            'Content-Type': 'multipart/form-data',
          },
          validateStatus: (status) => status! < 500, // 4xx 에러도 응답으로 받음
          sendTimeout: Duration(minutes: 2), // 업로드 timeout 2분
          receiveTimeout: Duration(minutes: 1), // 응답 timeout 1분
        ),
      );
      
      debugPrint('📤 업로드 응답: ${response.statusCode}');
      debugPrint('📤 응답 데이터: ${response.data}');
      debugPrint('📤 응답 헤더: ${response.headers}');
      
      if (response.statusCode != 200) {
        debugPrint('❌ HTTP ${response.statusCode} 에러: ${response.data}');
        throw _createApiError(
          DioException.badResponse(
            statusCode: response.statusCode!,
            requestOptions: RequestOptions(path: '/upload'),
            response: response,
          ),
          'uploadPdf',
        );
      }

      final uploadResponse = UploadResponse.fromJson(response.data);
      
      // 응답 데이터 검증
      if (uploadResponse.fileId.isEmpty) {
        throw ApiError(
          code: 'INVALID_RESPONSE',
          message: '서버 응답이 올바르지 않습니다.',
        );
      }
      
      debugPrint('✅ 업로드 성공: ${uploadResponse.fileId}');
      debugPrint('🔄 처리 타입: ${uploadResponse.processingType}');
      debugPrint('📝 응답 메시지: ${uploadResponse.message}');
      
      // 업로드 성공 후 즉시 작업 상태 확인
      try {
        await Future.delayed(Duration(seconds: 1)); // 1초 대기
        final status = await getConversionStatus(uploadResponse.fileId);
        debugPrint('🔍 초기 변환 상태: ${status['status']} - ${status['message']}');
      } catch (e) {
        debugPrint('⚠️ 상태 확인 실패 (정상적): $e');
      }
      
      return uploadResponse;

    } catch (error) {
      debugPrint('❌ 업로드 실패 상세: $error');
      if (error is DioException) {
        debugPrint('❌ DioException 세부정보:');
        debugPrint('   - Type: ${error.type}');
        debugPrint('   - Message: ${error.message}');
        debugPrint('   - Response: ${error.response?.data}');
        debugPrint('   - Status Code: ${error.response?.statusCode}');
      }
      
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'uploadPdf');
    }
  }

  // Excel 다운로드
  Future<String> downloadExcel(String fileId) async {
    try {
      debugPrint('📥 Excel 다운로드 시작: $fileId');
      
      // 네트워크 연결 확인 (실패해도 계속 진행)
      await _checkNetworkConnection();
      
      // 세션 ID 가져오기
      final sessionId = await _getSessionId();
      
      // 다운로드 경로 설정 - iOS에서 파일 앱 접근 가능하도록 Documents 폴더 사용
      final directory = await getApplicationDocumentsDirectory();
      
      // iOS에서 파일 앱에서 보이도록 PDFXcel 폴더 생성
      Directory pdfxcelFolder;
      if (Platform.isIOS) {
        pdfxcelFolder = Directory('${directory.path}/PDFXcel');
        if (!await pdfxcelFolder.exists()) {
          await pdfxcelFolder.create(recursive: true);
          debugPrint('📁 PDFXcel 폴더 생성: ${pdfxcelFolder.path}');
        }
      } else {
        // Android는 기본 Documents 폴더 사용
        pdfxcelFolder = directory;
      }
      
      // 원본 파일명 가져오기
      String filename = 'PDFxcel_${fileId}_${DateTime.now().millisecondsSinceEpoch}.xlsx'; // 기본값
      try {
        final history = await getFileHistory(fileId);
        if (history != null && history['file'] != null) {
          final originalFilename = history['file']['original_filename'] as String?;
          if (originalFilename != null && originalFilename.isNotEmpty) {
            // 원본 파일명에서 확장자를 .xlsx로 변경
            final nameWithoutExt = originalFilename.contains('.') 
                ? originalFilename.substring(0, originalFilename.lastIndexOf('.'))
                : originalFilename;
            // 파일명에서 안전하지 않은 문자 제거 및 길이 제한
            final cleanName = _sanitizeFilename(nameWithoutExt);
            final truncatedName = cleanName.length > 50 
                ? cleanName.substring(0, 50)
                : cleanName;
            
            filename = '${truncatedName}_변환됨.xlsx';
            debugPrint('📋 원본 파일명 사용: $originalFilename -> $filename');
          }
        }
      } catch (e) {
        debugPrint('⚠️ 원본 파일명 가져오기 실패, 기본 파일명 사용: $e');
      }
      final savePath = '${pdfxcelFolder.path}/$filename';

      debugPrint('📥 다운로드 URL: $_baseUrl/download/$fileId');
      
      // 파일 다운로드
      final response = await _dio.download(
        '/download/$fileId',
        savePath,
        options: Options(
          headers: {
            'X-Session-ID': sessionId,
          },
        ),
      );

      debugPrint('📥 다운로드 응답: ${response.statusCode}');
      
      if (response.statusCode != 200) {
        throw _createApiError(
          DioException.badResponse(
            statusCode: response.statusCode!,
            requestOptions: RequestOptions(path: '/download/$fileId'),
            response: response,
          ),
          'downloadExcel',
        );
      }

      // 다운로드된 파일 확인
      final file = File(savePath);
      if (!await file.exists() || await file.length() < 100) {
        throw ApiError(
          code: 'DOWNLOAD_FAILED',
          message: '다운로드된 파일이 손상되었습니다.',
        );
      }
      
      debugPrint('✅ 다운로드 성공: $savePath');
      return savePath;

    } catch (error) {
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'downloadExcel');
    }
  }

  // 파일 삭제
  Future<void> deleteFile(String fileId) async {
    try {
      debugPrint('🗑️ 파일 삭제 시작: $fileId');
      
      await _dio.delete('/download/$fileId');
      
      debugPrint('✅ 파일 삭제 성공: $fileId');
    } catch (error) {
      debugPrint('Delete error: $error');
      // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  }

  // 테이블 미리보기 (변환된 데이터에서 생성)
  Future<TablePreviewData> getTablePreview(String fileId) async {
    try {
      debugPrint('📊 테이블 미리보기 생성 시작: $fileId');
      
      // 변환된 데이터 가져오기
      final convertedData = await getConvertedData(fileId);
      
      if (convertedData.isEmpty) {
        throw ApiError(
          code: 'NO_DATA',
          message: '변환된 데이터가 없습니다.',
        );
      }

      // 첫 번째 행에서 헤더 추출
      List<String> headers = [];
      List<List<String>> rows = [];
      
      if (convertedData.isNotEmpty && convertedData[0] is Map) {
        // 객체 형태의 데이터인 경우
        final firstRow = convertedData[0] as Map<String, dynamic>;
        headers = firstRow.keys.toList();
        
        // 최대 10행까지만 미리보기
        final previewCount = convertedData.length > 10 ? 10 : convertedData.length;
        
        for (int i = 0; i < previewCount; i++) {
          final row = convertedData[i] as Map<String, dynamic>;
          final rowData = headers.map((header) => 
            row[header]?.toString() ?? ''
          ).toList();
          rows.add(rowData);
        }
      } else if (convertedData.isNotEmpty && convertedData[0] is List) {
        // 배열 형태의 데이터인 경우
        final firstRow = convertedData[0] as List<dynamic>;
        headers = firstRow.asMap().entries.map((e) => 'Column ${e.key + 1}').toList();
        
        final previewCount = convertedData.length > 10 ? 10 : convertedData.length;
        for (int i = 0; i < previewCount; i++) {
          final row = convertedData[i] as List<dynamic>;
          final rowData = row.map((cell) => cell?.toString() ?? '').toList();
          rows.add(rowData);
        }
      }

      final preview = TablePreviewData(
        headers: headers,
        rows: rows,
        totalRows: convertedData.length,
        totalColumns: headers.length,
      );
      
      debugPrint('✅ 테이블 미리보기 생성 완료: ${preview.totalRows}행 ${preview.totalColumns}열');
      return preview;
      
    } catch (error) {
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'getTablePreview');
    }
  }

  // 변환 상태 확인
  Future<Map<String, dynamic>> getConversionStatus(String fileId) async {
    try {
      debugPrint('🔍 변환 상태 확인 시작: $fileId');
      
      final response = await _dio.get('/status/$fileId');
      
      if (response.statusCode != 200) {
        throw _createApiError(
          DioException.badResponse(
            statusCode: response.statusCode!,
            requestOptions: RequestOptions(path: '/status/$fileId'),
            response: response,
          ),
          'getConversionStatus',
        );
      }
      
      final status = response.data as Map<String, dynamic>;
      debugPrint('🔍 원본 응답: $status');
      
      // 응답 구조에 따라 다르게 처리
      String? taskStatus;
      String? message;
      
      try {
        if (status.containsKey('success') && status['success'] == false) {
          // 실패 응답: {success: false, file_id: ..., message: ...}
          taskStatus = 'not_found';
          message = status['message']?.toString();
        } else if (status.containsKey('status')) {
          // 성공 응답: {task_name: ..., started_at: ..., status: running}
          final statusValue = status['status'];
          taskStatus = statusValue?.toString();
          
          final taskNameValue = status['task_name'];
          message = taskNameValue?.toString();
        } else {
          // 알 수 없는 응답 형태
          taskStatus = 'unknown';
          message = 'Unknown response format';
        }
      } catch (castError) {
        debugPrint('❌ 응답 파싱 에러: $castError');
        debugPrint('❌ 문제가 되는 status 필드: ${status['status']}');
        debugPrint('❌ 문제가 되는 message 필드: ${status['message']}');
        
        // 안전한 fallback
        taskStatus = 'unknown';
        message = 'Response parsing error';
      }
      
      debugPrint('📊 변환 상태: $taskStatus - $message');
      
      // 표준화된 응답 형태로 반환
      return {
        'status': taskStatus,
        'message': message,
        'raw_response': status,
      };
    } catch (error) {
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'getConversionStatus');
    }
  }

  // 히스토리에서 파일 정보 확인
  Future<Map<String, dynamic>?> getFileHistory(String fileId) async {
    try {
      debugPrint('📋 파일 히스토리 확인: $fileId');
      
      final sessionId = await _getSessionId();
      final response = await _dio.get(
        '/history/$fileId',
        options: Options(
          headers: {
            'X-Session-ID': sessionId,
          },
        ),
      );
      
      if (response.statusCode == 200) {
        debugPrint('📋 히스토리 찾음: ${response.data}');
        return response.data as Map<String, dynamic>;
      }
      
      return null;
    } catch (error) {
      debugPrint('📋 히스토리 확인 실패: $error');
      return null;
    }
  }

  // 변환된 데이터 조회
  Future<List<dynamic>> getConvertedData(String fileId) async {
    try {
      debugPrint('📊 변환된 데이터 조회 시작: $fileId');
      
      // 세션 ID 가져오기
      final sessionId = await _getSessionId();
      debugPrint('🔍 세션 ID: $sessionId');
      
      final response = await _dio.get(
        '/data/$fileId',
        options: Options(
          headers: {
            'X-Session-ID': sessionId,
          },
        ),
      );
      
      if (response.statusCode != 200) {
        throw _createApiError(
          DioException.badResponse(
            statusCode: response.statusCode!,
            requestOptions: RequestOptions(path: '/data/$fileId'),
            response: response,
          ),
          'getConvertedData',
        );
      }
      
      final data = response.data;
      
      // 데이터 검증
      if (data is! List) {
        throw ApiError(
          code: 'INVALID_RESPONSE',
          message: '올바르지 않은 데이터 형식입니다.',
        );
      }
      
      debugPrint('✅ 변환된 데이터 조회 성공: ${data.length}개의 레코드');
      return data;
      
    } catch (error) {
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'getConvertedData');
    }
  }

  // 파일명 안전하게 처리하는 헬퍼 함수
  String _sanitizeFilename(String filename) {
    // Windows/macOS/Linux에서 허용되지 않는 문자들 제거
    const forbiddenChars = r'[<>:\"/\\\\|?*]';
    final sanitized = filename.replaceAll(RegExp(forbiddenChars), '_');
    
    // 연속된 공백을 하나로 변경하고 앞뒤 공백 제거
    final trimmed = sanitized.replaceAll(RegExp(r'\\s+'), ' ').trim();
    
    // 빈 문자열인 경우 기본 이름 사용
    return trimmed.isEmpty ? 'PDFXcel변환파일' : trimmed;
  }

  // 히스토리 조회
  Future<HistoryResponse> getHistory() async {
    try {
      debugPrint('📋 히스토리 조회 시작');
      
      final sessionId = await _getSessionId();
      
      final response = await _dio.get(
        '/history',
        options: Options(
          headers: {
            'X-Session-ID': sessionId,
          },
        ),
      );
      
      if (response.statusCode != 200) {
        throw _createApiError(
          DioException.badResponse(
            statusCode: response.statusCode!,
            requestOptions: RequestOptions(path: '/history'),
            response: response,
          ),
          'getHistory',
        );
      }
      
      final historyResponse = HistoryResponse.fromJson(response.data);
      
      debugPrint('✅ 히스토리 조회 성공: ${historyResponse.files.length}개 파일');
      return historyResponse;
      
    } catch (error) {
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'getHistory');
    }
  }

  // 히스토리에서 파일 삭제
  Future<void> deleteFileFromHistory(String fileId) async {
    try {
      debugPrint('🗑️ 히스토리에서 파일 삭제: $fileId');
      
      final sessionId = await _getSessionId();
      
      final response = await _dio.delete(
        '/history/$fileId',
        options: Options(
          headers: {
            'X-Session-ID': sessionId,
          },
        ),
      );
      
      if (response.statusCode != 200) {
        throw _createApiError(
          DioException.badResponse(
            statusCode: response.statusCode!,
            requestOptions: RequestOptions(path: '/history/$fileId'),
            response: response,
          ),
          'deleteFileFromHistory',
        );
      }
      
      debugPrint('✅ 히스토리에서 파일 삭제 성공: $fileId');
      
    } catch (error) {
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'deleteFileFromHistory');
    }
  }

  // 세션 통계 조회
  Future<Map<String, dynamic>> getSessionStats() async {
    try {
      debugPrint('📊 세션 통계 조회 시작');
      
      final sessionId = await _getSessionId();
      
      final response = await _dio.get(
        '/history/stats',
        options: Options(
          headers: {
            'X-Session-ID': sessionId,
          },
        ),
      );
      
      if (response.statusCode != 200) {
        throw _createApiError(
          DioException.badResponse(
            statusCode: response.statusCode!,
            requestOptions: RequestOptions(path: '/history/stats'),
            response: response,
          ),
          'getSessionStats',
        );
      }
      
      final stats = response.data['stats'] as Map<String, dynamic>;
      
      debugPrint('✅ 세션 통계 조회 성공: $stats');
      return stats;
      
    } catch (error) {
      if (error is ApiError) {
        rethrow;
      }
      throw _createApiError(error, 'getSessionStats');
    }
  }

  // Mock 테이블 미리보기 (개발용)
  Future<TablePreviewData> getMockTablePreview(String fileId) async {
    // 로딩 시뮬레이션
    await Future.delayed(Duration(seconds: 1));

    return TablePreviewData(
      headers: ['날짜', '거래 내용', '출금', '입금', '잔액', '메모'],
      rows: [
        ['2024-01-01', '이체 수수료', '500', '', '1,999,500', '온라인'],
        ['2024-01-02', '스타벅스 강남점', '4,500', '', '1,995,000', '카드결제'],
        ['2024-01-03', '급여 입금', '', '3,000,000', '4,995,000', '회사'],
        ['2024-01-04', '통신비 자동이체', '55,000', '', '4,940,000', 'SKT'],
        ['2024-01-05', 'ATM 출금', '100,000', '', '4,840,000', '신한 ATM'],
        ['2024-01-06', '카페 베네 신촌점', '3,800', '', '4,836,200', '카드결제'],
        ['2024-01-07', '온라인 쇼핑', '89,000', '', '4,747,200', '쿠팡'],
        ['2024-01-08', '친구 송금', '50,000', '', '4,697,200', '카카오페이'],
        ['2024-01-09', '부모님 용돈', '200,000', '', '4,497,200', '송금'],
        ['2024-01-10', '교통비 충전', '30,000', '', '4,467,200', '티머니'],
      ],
      totalRows: 10,
      totalColumns: 6,
    );
  }
}

// 히스토리 관련 모델 클래스들을 파일 하단에 추가
class HistoryResponse {
  final bool success;
  final List<HistoryItem> files;
  final int totalCount;
  final Map<String, dynamic>? sessionStats;

  HistoryResponse({
    required this.success,
    required this.files,
    required this.totalCount,
    this.sessionStats,
  });

  factory HistoryResponse.fromJson(Map<String, dynamic> json) {
    return HistoryResponse(
      success: json['success'] ?? false,
      files: (json['files'] as List?)
          ?.map((file) => HistoryItem.fromJson(file))
          .toList() ?? [],
      totalCount: json['total_count'] ?? 0,
      sessionStats: json['session_stats'],
    );
  }
}

class HistoryItem {
  final String fileId;
  final String originalFilename;
  final String status;
  final DateTime createdAt;
  final DateTime? completedAt;
  final String? errorMessage;
  final bool useAi;
  final int? fileSizeBytes;

  HistoryItem({
    required this.fileId,
    required this.originalFilename,
    required this.status,
    required this.createdAt,
    this.completedAt,
    this.errorMessage,
    required this.useAi,
    this.fileSizeBytes,
  });

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    return HistoryItem(
      fileId: json['file_id'] ?? '',
      originalFilename: json['original_filename'] ?? '알 수 없는 파일',
      status: json['status'] ?? 'unknown',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      completedAt: json['completed_at'] != null 
          ? DateTime.tryParse(json['completed_at'])
          : null,
      errorMessage: json['error_message'],
      useAi: json['use_ai'] ?? false,
      fileSizeBytes: json['file_size_bytes'],
    );
  }

  String get statusText {
    switch (status) {
      case 'completed':
        return '완료';
      case 'processing':
        return '처리중';
      case 'failed':
        return '실패';
      case 'uploaded':
        return '업로드됨';
      default:
        return '알 수 없음';
    }
  }

  Color get statusColor {
    switch (status) {
      case 'completed':
        return Colors.green;
      case 'processing':
        return Colors.orange;
      case 'failed':
        return Colors.red;
      case 'uploaded':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData get statusIcon {
    switch (status) {
      case 'completed':
        return Icons.check_circle;
      case 'processing':
        return Icons.hourglass_empty;
      case 'failed':
        return Icons.error;
      case 'uploaded':
        return Icons.upload_file;
      default:
        return Icons.help;
    }
  }

  String get fileSizeText {
    if (fileSizeBytes == null) return '';
    
    if (fileSizeBytes! < 1024) {
      return '${fileSizeBytes}B';
    } else if (fileSizeBytes! < 1024 * 1024) {
      return '${(fileSizeBytes! / 1024).toStringAsFixed(1)}KB';
    } else {
      return '${(fileSizeBytes! / (1024 * 1024)).toStringAsFixed(1)}MB';
    }
  }
}