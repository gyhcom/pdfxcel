import * as FileSystem from 'expo-file-system';
import { API_CONFIG } from '../constants/config';
import { UploadResponse, UploadProgress, TablePreviewData } from '../types';
import { historyService } from './historyService';

// 에러 타입 정의
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
  }

  // 네트워크 연결 상태 확인
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('네트워크 연결 확인 실패:', error);
      return false;
    }
  }

  // 에러 분류 및 사용자 친화적 메시지 생성
  private createApiError(error: any, context: string): ApiError {
    console.error(`API Error in ${context}:`, error);
    
    // 네트워크 에러
    if (error.name === 'AbortError' || error.code === 'NETWORK_ERR') {
      return {
        code: 'NETWORK_ERROR',
        message: '인터넷 연결을 확인해주세요.',
        details: error
      };
    }
    
    // 타임아웃 에러
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        details: error
      };
    }
    
    // HTTP 상태 코드별 처리
    if (error.status) {
      switch (error.status) {
        case 400:
          return {
            code: 'BAD_REQUEST',
            message: '잘못된 요청입니다. 파일 형식을 확인해주세요.',
            details: error
          };
        case 401:
          return {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
            details: error
          };
        case 413:
          return {
            code: 'FILE_TOO_LARGE',
            message: '파일 크기가 너무 큽니다. (최대 10MB)',
            details: error
          };
        case 429:
          return {
            code: 'RATE_LIMIT',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            details: error
          };
        case 500:
          return {
            code: 'SERVER_ERROR',
            message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            details: error
          };
        default:
          return {
            code: 'HTTP_ERROR',
            message: `서버 오류 (${error.status}): 관리자에게 문의해주세요.`,
            details: error
          };
      }
    }
    
    // 기본 에러
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      details: error
    };
  }

  async uploadPdf(
    fileUri: string,
    fileName: string,
    useAi: boolean = false,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
      console.log('🚀 PDF 업로드 시작:', {
        fileName,
        useAi,
        apiUrl: this.baseUrl
      });
      
      // 네트워크 연결 확인
      const isConnected = await this.checkNetworkConnection();
      if (!isConnected) {
        throw this.createApiError(
          { code: 'NETWORK_ERROR' },
          'uploadPdf - network check'
        );
      }

      // 파일 크기 확인
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 10 * 1024 * 1024) { // 10MB
        throw this.createApiError(
          { status: 413 },
          'uploadPdf - file size check'
        );
      }
      
      // 세션 ID 가져오기
      const sessionId = await historyService.getSessionId();

      // 업로드 요청
      const result = await FileSystem.uploadAsync(
        `${this.baseUrl}/upload`,
        fileUri,
        {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          parameters: {
            use_ai: useAi.toString(),
          },
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
            'X-Session-ID': sessionId,
          },
        }
      );
      
      console.log('📤 업로드 응답:', {
        status: result.status,
        bodyLength: result.body?.length
      });
      
      if (result.status !== 200) {
        const errorData = result.body ? JSON.parse(result.body) : {};
        throw this.createApiError(
          { status: result.status, ...errorData },
          'uploadPdf - upload request'
        );
      }

      const response: UploadResponse = JSON.parse(result.body);
      
      // 응답 데이터 검증
      if (!response.file_id) {
        throw this.createApiError(
          { message: '서버 응답이 올바르지 않습니다.' },
          'uploadPdf - response validation'
        );
      }
      
      console.log('✅ 업로드 성공:', response.file_id);
      return response;

    } catch (error) {
      if (error.code) {
        // 이미 ApiError로 처리된 경우
        throw error;
      }
      
      const apiError = this.createApiError(error, 'uploadPdf');
      throw apiError;
    }
  }

  async downloadExcel(fileId: string): Promise<string> {
    try {
      console.log('📥 Excel 다운로드 시작:', fileId);
      
      // 네트워크 연결 확인
      const isConnected = await this.checkNetworkConnection();
      if (!isConnected) {
        throw this.createApiError(
          { code: 'NETWORK_ERROR' },
          'downloadExcel - network check'
        );
      }
      
      const downloadUrl = `${this.baseUrl}/download/${fileId}`;
      const filename = `PDFxcel_${fileId}_${new Date().getTime()}.xlsx`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;

      console.log('📥 다운로드 URL:', downloadUrl);
      
      // 파일 다운로드
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        localUri
      );

      console.log('📥 다운로드 응답:', {
        status: downloadResult.status,
        uri: downloadResult.uri
      });
      
      if (downloadResult.status !== 200) {
        throw this.createApiError(
          { status: downloadResult.status },
          'downloadExcel - download request'
        );
      }

      // 다운로드된 파일 확인
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      if (!fileInfo.exists || (fileInfo.size && fileInfo.size < 100)) {
        throw this.createApiError(
          { message: '다운로드된 파일이 손상되었습니다.' },
          'downloadExcel - file validation'
        );
      }
      
      console.log('✅ 다운로드 성공:', downloadResult.uri);
      return downloadResult.uri;

    } catch (error) {
      if (error.code) {
        throw error;
      }
      
      const apiError = this.createApiError(error, 'downloadExcel');
      throw apiError;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      console.log('🗑️ 파일 삭제 시작:', fileId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      const response = await fetch(`${this.baseUrl}/download/${fileId}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('파일 삭제 실패:', response.status);
        // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
        return;
      }
      
      console.log('✅ 파일 삭제 성공:', fileId);

    } catch (error) {
      console.error('Delete error:', error);
      // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  }

  async getTablePreview(fileId: string): Promise<TablePreviewData> {
    try {
      const response = await fetch(`${this.baseUrl}/preview/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Preview failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // 응답 데이터 검증 및 변환
      if (!data.headers || !Array.isArray(data.headers)) {
        throw new Error('Invalid response: missing headers');
      }

      if (!data.rows || !Array.isArray(data.rows)) {
        throw new Error('Invalid response: missing rows');
      }

      return {
        headers: data.headers,
        rows: data.rows,
        totalRows: data.rows.length,
        totalColumns: data.headers.length,
      };

    } catch (error) {
      console.error('Preview error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : '미리보기 데이터를 가져오는 중 오류가 발생했습니다.'
      );
    }
  }

  async getConvertedData(fileId: string): Promise<any[]> {
    try {
      console.log('📊 변환된 데이터 조회 시작:', fileId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(`${this.baseUrl}/data/${fileId}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw this.createApiError(
          { status: response.status },
          'getConvertedData - API request'
        );
      }
      
      const data = await response.json();
      
      // 데이터 검증
      if (!Array.isArray(data)) {
        throw this.createApiError(
          { message: '올바르지 않은 데이터 형식입니다.' },
          'getConvertedData - data validation'
        );
      }
      
      console.log('✅ 변환된 데이터 조회 성공:', data.length, '개의 레코드');
      return data;
      
    } catch (error) {
      if (error.code) {
        throw error;
      }
      
      const apiError = this.createApiError(error, 'getConvertedData');
      throw apiError;
    }
  }

  // 임시 방법: 파일 ID를 기반으로 가상 데이터 생성 (백엔드 API 구현 전)
  async getMockTablePreview(fileId: string): Promise<TablePreviewData> {
    // 개발용 가상 데이터
    await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션

    const mockData: TablePreviewData = {
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
    };

    return mockData;
  }
}

export const apiService = new ApiService();