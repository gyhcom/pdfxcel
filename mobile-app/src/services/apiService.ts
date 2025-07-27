import * as FileSystem from 'expo-file-system';
import { API_CONFIG } from '../constants/config';
import { UploadResponse, UploadProgress, TablePreviewData } from '../types';

export class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
  }

  async uploadPdf(
    fileUri: string,
    fileName: string,
    useAi: boolean = false,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
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
          },
        }
      );
      
      if (result.status !== 200) {
        throw new Error(`Upload failed with status: ${result.status}`);
      }

      const response: UploadResponse = JSON.parse(result.body);
      return response;

    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : '파일 업로드 중 오류가 발생했습니다.'
      );
    }
  }

  async downloadExcel(fileId: string): Promise<string> {
    try {
      const downloadUrl = `${this.baseUrl}/download/${fileId}`;
      const filename = `bank_statement_${fileId}.xlsx`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;

      // 파일 다운로드
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        localUri
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      return downloadResult.uri;

    } catch (error) {
      console.error('Download error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : '파일 다운로드 중 오류가 발생했습니다.'
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/download/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }

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