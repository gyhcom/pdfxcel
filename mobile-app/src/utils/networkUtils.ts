/**
 * 네트워크 연결 상태 확인 유틸리티
 */
import { API_CONFIG } from '../constants/config';

export class NetworkUtils {
  /**
   * 네트워크 연결 상태 확인 (간단한 fetch 테스트)
   */
  static async isConnected(): Promise<boolean> {
    try {
      // React Native에서는 timeout을 AbortController로 구현
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      return false;
    }
  }

  /**
   * 서버 연결 테스트
   */
  static async testServerConnection(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      return {
        connected: response.ok,
        latency,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
      
    } catch (error) {
      return {
        connected: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Railway 서버 상태 확인
   */
  static async checkRailwayServer(): Promise<{
    status: 'online' | 'offline' | 'error';
    message: string;
    responseTime?: number;
  }> {
    try {
      console.log('🔍 Checking Railway server status...');
      
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('https://pdfxcel-production.up.railway.app/api/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'online',
          message: `서버 정상 동작 중 (${responseTime}ms)`,
          responseTime
        };
      } else {
        return {
          status: 'error',
          message: `서버 오류: HTTP ${response.status}`,
          responseTime
        };
      }
      
    } catch (error) {
      console.error('Railway server check failed:', error);
      
      return {
        status: 'offline',
        message: error instanceof Error ? error.message : '서버 연결 실패'
      };
    }
  }

  /**
   * 네트워크 오류인지 확인
   */
  static isNetworkError(error: any): boolean {
    if (error instanceof TypeError) {
      return error.message.includes('Network request failed') ||
             error.message.includes('fetch is not defined') ||
             error.message.includes('Failed to fetch');
    }
    
    return false;
  }

  /**
   * 재시도 로직이 포함된 fetch
   */
  static async fetchWithRetry(
    url: string, 
    options: RequestInit = {}, 
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Success on attempt ${attempt}`);
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Attempt ${attempt} failed:`, error);
        
        // 마지막 시도가 아니라면 잠시 대기
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // 1초, 2초, 3초...
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

export default NetworkUtils;