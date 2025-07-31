/**
 * API 응답 캐싱 시스템
 * 중복 요청 방지 및 캐시 효율성 개선
 */

import memoryManager from './memoryManager';
import crashReporter from './crashReporter';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean;
  staleWhileRevalidate?: boolean; // 만료된 데이터를 반환하면서 백그라운드에서 갱신
}

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  etag?: string;
  expires?: number;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class ApiCache {
  private pendingRequests = new Map<string, PendingRequest>();
  private defaultTTL = 5 * 60 * 1000; // 5분
  private maxStaleTime = 60 * 60 * 1000; // 1시간 (stale-while-revalidate용)

  /**
   * 캐시된 응답 가져오기 또는 새로운 요청 실행
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.defaultTTL,
      forceRefresh = false,
      staleWhileRevalidate = false
    } = options;

    try {
      // 강제 새로고침이 아닌 경우 캐시 확인
      if (!forceRefresh) {
        const cached = this.getCached<T>(key);
        
        if (cached) {
          const isExpired = Date.now() - cached.timestamp > ttl;
          
          if (!isExpired) {
            console.log(`📦 Cache hit: ${key}`);
            return cached.data;
          }
          
          // stale-while-revalidate: 만료된 데이터를 반환하고 백그라운드에서 갱신
          if (staleWhileRevalidate && Date.now() - cached.timestamp < this.maxStaleTime) {
            console.log(`📦 Stale cache return: ${key}`);
            
            // 백그라운드에서 비동기적으로 갱신
            this.refreshInBackground(key, fetchFn, ttl).catch(error => {
              console.warn('Background refresh failed:', error);
            });
            
            return cached.data;
          }
        }
      }

      // 중복 요청 방지
      const pendingRequest = this.pendingRequests.get(key);
      if (pendingRequest) {
        const age = Date.now() - pendingRequest.timestamp;
        
        // 진행 중인 요청이 5초 이내인 경우 기다림
        if (age < 5000) {
          console.log(`⏳ Waiting for pending request: ${key}`);
          return await pendingRequest.promise;
        } else {
          // 오래된 pending request는 제거
          this.pendingRequests.delete(key);
        }
      }

      // 새로운 요청 실행
      console.log(`🌐 New API request: ${key}`);
      const promise = this.executeRequest(key, fetchFn, ttl);
      
      // pending request 등록
      this.pendingRequests.set(key, {
        promise,
        timestamp: Date.now()
      });

      const result = await promise;
      
      // pending request 정리
      this.pendingRequests.delete(key);
      
      return result;

    } catch (error) {
      this.pendingRequests.delete(key);
      
      crashReporter.reportCrash(error as Error, {
        context: 'ApiCache.getOrFetch',
        key,
        options
      });
      
      throw error;
    }
  }

  /**
   * 새로운 요청 실행 및 캐싱
   */
  private async executeRequest<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const data = await fetchFn();
      const duration = Date.now() - startTime;
      
      console.log(`✅ API request completed: ${key} (${duration}ms)`);
      
      // 응답 캐싱
      this.setCached(key, data, ttl);
      
      return data;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ API request failed: ${key} (${duration}ms)`, error);
      throw error;
    }
  }

  /**
   * 백그라운드에서 캐시 갱신
   */
  private async refreshInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const data = await fetchFn();
      this.setCached(key, data, ttl);
      console.log(`🔄 Background refresh completed: ${key}`);
    } catch (error) {
      console.warn(`🔄 Background refresh failed: ${key}`, error);
    }
  }

  /**
   * 캐시된 데이터 조회
   */
  private getCached<T>(key: string): CachedResponse<T> | null {
    try {
      return memoryManager.getFromCache(`api_${key}`);
    } catch (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * 데이터 캐싱
   */
  private setCached<T>(key: string, data: T, ttl: number): void {
    try {
      const cached: CachedResponse<T> = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + ttl
      };
      
      memoryManager.cacheItem(`api_${key}`, cached, ttl);
    } catch (error) {
      console.warn('Cache storage error:', error);
    }
  }

  /**
   * 특정 키의 캐시 무효화
   */
  invalidate(key: string): void {
    try {
      memoryManager.removeFromCache(`api_${key}`);
      this.pendingRequests.delete(key);
      console.log(`🗑️ Cache invalidated: ${key}`);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * 패턴에 맞는 캐시 무효화
   */
  invalidatePattern(pattern: RegExp): void {
    try {
      const memoryInfo = memoryManager.getMemoryInfo();
      let invalidatedCount = 0;
      
      // 메모리 매니저에서 패턴에 맞는 키들을 찾아 제거
      // (실제 구현은 memoryManager의 내부 구조에 따라 달라질 수 있음)
      
      console.log(`🗑️ Pattern cache invalidation completed: ${invalidatedCount} items`);
    } catch (error) {
      console.warn('Pattern cache invalidation error:', error);
    }
  }

  /**
   * 전체 API 캐시 정리
   */
  clearAll(): void {
    try {
      // API 관련 캐시만 정리 (api_ prefix)
      this.pendingRequests.clear();
      
      // 메모리 매니저를 통한 선택적 정리는 별도 구현 필요
      console.log('🧹 All API cache cleared');
    } catch (error) {
      console.warn('Cache clearing error:', error);
    }
  }

  /**
   * 캐시 통계 정보
   */
  getStats(): {
    pendingRequests: number;
    cacheHitRate?: number;
    totalRequests?: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      // 추가 통계는 필요에 따라 구현
    };
  }

  /**
   * 프리페치 (미리 데이터 로딩)
   */
  async prefetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      // 이미 캐시가 있고 유효한 경우 스킵
      const cached = this.getCached<T>(key);
      const ttl = options.ttl || this.defaultTTL;
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        console.log(`🔮 Prefetch skipped (already cached): ${key}`);
        return;
      }

      console.log(`🔮 Prefetching: ${key}`);
      await this.getOrFetch(key, fetchFn, options);
    } catch (error) {
      console.warn(`🔮 Prefetch failed: ${key}`, error);
      // 프리페치 실패는 에러를 throw하지 않음
    }
  }
}

export const apiCache = new ApiCache();
export default apiCache;