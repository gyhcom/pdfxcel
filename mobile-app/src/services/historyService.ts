/**
 * 파일 히스토리 서비스
 * 변환 기록 관리 및 세션 기반 히스토리 기능
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';
import { ApiError } from './apiService';

export interface FileHistoryItem {
  file_id: string;
  original_filename: string;
  converted_filename: string;
  upload_time: string;
  status: 'completed' | 'processing' | 'failed' | 'cancelled';
  file_size?: number;
  processing_type: 'ai' | 'basic';
  excel_path?: string;
}

export interface HistoryResponse {
  success: boolean;
  files: FileHistoryItem[];
  total_count: number;
  session_stats?: {
    total_files: number;
    completed_files: number;
    failed_files: number;
    ai_conversions: number;
    basic_conversions: number;
    session_created: string;
    last_accessed: string;
  };
}

export class HistoryService {
  private static instance: HistoryService;
  private sessionId: string | null = null;
  
  private constructor() {
    this.initializeSession();
  }

  public static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * 세션 ID 초기화 또는 복원
   */
  private async initializeSession(): Promise<void> {
    try {
      // 기존 세션 ID 확인
      let storedSessionId = await AsyncStorage.getItem('session_id');
      
      if (!storedSessionId) {
        // 새 세션 ID 생성
        storedSessionId = this.generateSessionId();
        await AsyncStorage.setItem('session_id', storedSessionId);
        console.log('📝 New session created:', storedSessionId);
      } else {
        console.log('📝 Session restored:', storedSessionId);
      }
      
      this.sessionId = storedSessionId;
      
    } catch (error) {
      console.error('Session initialization error:', error);
      // 세션 ID 생성 실패 시 임시 ID 사용
      this.sessionId = this.generateSessionId();
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `session_${timestamp}_${random}`;
  }

  /**
   * 현재 세션 ID 반환
   */
  public async getSessionId(): Promise<string> {
    if (!this.sessionId) {
      await this.initializeSession();
    }
    return this.sessionId || 'default_session';
  }

  /**
   * 파일 히스토리 조회
   */
  public async getHistory(): Promise<HistoryResponse> {
    try {
      const sessionId = await this.getSessionId();
      
      const response = await fetch(`${API_CONFIG.baseUrl}/history`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Session-ID': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error(`히스토리 조회 실패: ${response.status}`);
      }

      const data: HistoryResponse = await response.json();
      console.log('📝 History retrieved:', data.total_count, 'files');
      
      return data;

    } catch (error) {
      console.error('History fetch error:', error);
      throw this.createHistoryError(error, 'getHistory');
    }
  }

  /**
   * 특정 파일 정보 조회
   */
  public async getFileInfo(fileId: string): Promise<FileHistoryItem> {
    try {
      const sessionId = await this.getSessionId();
      
      const response = await fetch(`${API_CONFIG.baseUrl}/history/${fileId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Session-ID': sessionId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('파일을 찾을 수 없습니다.');
        }
        throw new Error(`파일 정보 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 File info retrieved:', fileId);
      
      return data.file;

    } catch (error) {
      console.error('File info fetch error:', error);
      throw this.createHistoryError(error, 'getFileInfo');
    }
  }

  /**
   * 히스토리에서 파일 삭제
   */
  public async deleteFileFromHistory(fileId: string): Promise<boolean> {
    try {
      const sessionId = await this.getSessionId();
      
      const response = await fetch(`${API_CONFIG.baseUrl}/history/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-Session-ID': sessionId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('삭제할 파일을 찾을 수 없습니다.');
        }
        throw new Error(`파일 삭제 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 File deleted from history:', fileId);
      
      return data.success;

    } catch (error) {
      console.error('File deletion error:', error);
      throw this.createHistoryError(error, 'deleteFileFromHistory');
    }
  }

  /**
   * 파일 재다운로드 준비
   */
  public async prepareRedownload(fileId: string): Promise<string> {
    try {
      const sessionId = await this.getSessionId();
      
      const response = await fetch(`${API_CONFIG.baseUrl}/history/${fileId}/redownload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Session-ID': sessionId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('파일을 찾을 수 없거나 만료되었습니다.');
        }
        if (response.status === 400) {
          throw new Error('완료된 파일만 재다운로드할 수 있습니다.');
        }
        throw new Error(`재다운로드 준비 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 Redownload prepared:', fileId);
      
      return data.download_url;

    } catch (error) {
      console.error('Redownload preparation error:', error);
      throw this.createHistoryError(error, 'prepareRedownload');
    }
  }

  /**
   * 세션 통계 조회
   */
  public async getSessionStats(): Promise<any> {
    try {
      const sessionId = await this.getSessionId();
      
      const response = await fetch(`${API_CONFIG.baseUrl}/history/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Session-ID': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error(`통계 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 Session stats retrieved');
      
      return data.stats;

    } catch (error) {
      console.error('Session stats error:', error);
      throw this.createHistoryError(error, 'getSessionStats');
    }
  }

  /**
   * 로컬 캐시 정리
   */
  public async clearLocalCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('session_id');
      await AsyncStorage.removeItem('cached_history');
      this.sessionId = null;
      
      console.log('📝 Local cache cleared');
      
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * 새 세션 시작
   */
  public async startNewSession(): Promise<string> {
    try {
      await this.clearLocalCache();
      await this.initializeSession();
      
      const newSessionId = await this.getSessionId();
      console.log('📝 New session started:', newSessionId);
      
      return newSessionId;
      
    } catch (error) {
      console.error('New session start error:', error);
      throw this.createHistoryError(error, 'startNewSession');
    }
  }

  /**
   * 로컬 히스토리 캐싱 (오프라인 지원)
   */
  public async cacheHistory(history: HistoryResponse): Promise<void> {
    try {
      const cacheData = {
        ...history,
        cached_at: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('cached_history', JSON.stringify(cacheData));
      console.log('📝 History cached locally');
      
    } catch (error) {
      console.error('History caching error:', error);
    }
  }

  /**
   * 캐시된 히스토리 조회
   */
  public async getCachedHistory(): Promise<HistoryResponse | null> {
    try {
      const cachedData = await AsyncStorage.getItem('cached_history');
      
      if (!cachedData) {
        return null;
      }
      
      const parsedData = JSON.parse(cachedData);
      
      // 캐시가 1시간 이상 오래되면 무효화
      const cacheAge = Date.now() - new Date(parsedData.cached_at).getTime();
      if (cacheAge > 60 * 60 * 1000) { // 1시간
        await AsyncStorage.removeItem('cached_history');
        return null;
      }
      
      console.log('📝 Using cached history');
      return parsedData;
      
    } catch (error) {
      console.error('Cached history retrieval error:', error);
      return null;
    }
  }

  /**
   * 히스토리 에러 생성
   */
  private createHistoryError(error: any, context: string): ApiError {
    console.error(`History error in ${context}:`, error);
    
    if (error instanceof Error) {
      return {
        code: 'HISTORY_ERROR',
        message: error.message,
        details: error
      };
    }
    
    return {
      code: 'UNKNOWN_HISTORY_ERROR',
      message: '히스토리 서비스 오류가 발생했습니다.',
      details: error
    };
  }

  /**
   * 파일 크기 포맷팅
   */
  public formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '알 수 없음';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * 상대 시간 포맷팅
   */
  public formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) return '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      
      // 1주일 이상이면 날짜 표시
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
    } catch (error) {
      return '알 수 없음';
    }
  }
}

// 전역 히스토리 서비스 인스턴스
export const historyService = HistoryService.getInstance();