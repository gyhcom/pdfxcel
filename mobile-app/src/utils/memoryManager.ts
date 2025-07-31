/**
 * 메모리 관리 유틸리티
 * 파일 처리, 캐시 관리 및 메모리 누설 방지
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem {
  key: string;
  timestamp: number;
  size: number;
  data: any;
}

class MemoryManager {
  private static instance: MemoryManager;
  private cache = new Map<string, CacheItem>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private maxCacheAge = 24 * 60 * 60 * 1000; // 24시간
  private currentCacheSize = 0;

  private constructor() {
    this.startPeriodicCleanup();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * 주기적 정리 작업 시작
   */
  private startPeriodicCleanup(): void {
    // 5분마다 캐시 정리
    setInterval(() => {
      this.cleanupExpiredCache();
      this.cleanupTempFiles();
    }, 5 * 60 * 1000);
  }

  /**
   * 만료된 캐시 항목 정리
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedSize = 0;
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxCacheAge) {
        this.currentCacheSize -= item.size;
        this.cache.delete(key);
        cleanedSize += item.size;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired cache items (${this.formatBytes(cleanedSize)})`);
    }
  }

  /**
   * 임시 파일 정리
   */
  private async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = FileSystem.cacheDirectory;
      if (!tempDir) return;

      const files = await FileSystem.readDirectoryAsync(tempDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        try {
          const filePath = `${tempDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists && fileInfo.modificationTime) {
            const ageInMs = now - fileInfo.modificationTime * 1000;
            
            // 24시간 이상 된 임시 파일 삭제
            if (ageInMs > this.maxCacheAge) {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
              cleanedCount++;
            }
          }
        } catch (error) {
          console.warn(`Failed to clean temp file ${file}:`, error);
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} old temp files`);
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  /**
   * 캐시에 데이터 저장 (기존 호환성 유지)
   */
  public setCache(key: string, data: any): void {
    this.cacheItem(key, data);
  }

  /**
   * 캐시에서 데이터 조회 (기존 호환성 유지)
   */
  public getCache(key: string): any | null {
    return this.getFromCache(key);
  }

  /**
   * 오래된 캐시 항목 제거
   */
  private evictOldestCache(requiredSize: number): void {
    const sortedItems = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp);

    let freedSize = 0;
    let evictedCount = 0;

    for (const [key, item] of sortedItems) {
      if (freedSize >= requiredSize && this.currentCacheSize < this.maxCacheSize * 0.8) {
        break;
      }

      this.cache.delete(key);
      this.currentCacheSize -= item.size;
      freedSize += item.size;
      evictedCount++;
    }

    if (evictedCount > 0) {
      console.log(`🧹 Evicted ${evictedCount} cache items (${this.formatBytes(freedSize)})`);
    }
  }

  /**
   * 데이터 크기 추정
   */
  private estimateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 문자당 2바이트
    } catch {
      return 1024; // 기본 1KB로 추정
    }
  }

  /**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 메모리 상태 정보 조회
   */
  public getMemoryInfo(): {
    cacheSize: string;
    cacheItems: number;
    maxCacheSize: string;
  } {
    return {
      cacheSize: this.formatBytes(this.currentCacheSize),
      cacheItems: this.cache.size,
      maxCacheSize: this.formatBytes(this.maxCacheSize)
    };
  }

  /**
   * 모든 캐시 삭제
   */
  public clearAllCache(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
    console.log('🧹 All cache cleared');
  }

  /**
   * 수동 메모리 정리 수행
   */
  public async performCleanup(): Promise<void> {
    try {
      this.cleanupExpiredCache();
      await this.cleanupTempFiles();
      console.log('🧹 Manual memory cleanup completed');
    } catch (error) {
      console.error('Memory cleanup failed:', error);
    }
  }

  /**
   * 캐시 아이템 저장 (TTL 지원)
   */
  public cacheItem(key: string, data: any, ttl?: number): void {
    const size = this.estimateDataSize(data);
    
    // 캐시 크기 제한 확인
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictOldestCache(size);
    }

    const item: CacheItem = {
      key,
      timestamp: Date.now(),
      size,
      data: {
        value: data,
        expiresAt: ttl ? Date.now() + ttl : Date.now() + this.maxCacheAge
      }
    };

    this.cache.set(key, item);
    this.currentCacheSize += size;
  }

  /**
   * 캐시에서 데이터 조회 (TTL 지원)
   */
  public getFromCache(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const data = item.data;
    
    // TTL 확인
    if (data.expiresAt && now > data.expiresAt) {
      this.cache.delete(key);
      this.currentCacheSize -= item.size;
      return null;
    }

    // 일반 만료 확인 (TTL이 없는 경우)
    if (!data.expiresAt && now - item.timestamp > this.maxCacheAge) {
      this.cache.delete(key);
      this.currentCacheSize -= item.size;
      return null;
    }

    return data.value;
  }

  /**
   * 캐시에서 특정 키 제거
   */
  public removeFromCache(key: string): boolean {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.currentCacheSize -= item.size;
      console.log(`🗑️ Removed cache item: ${key}`);
      return true;
    }
    return false;
  }

  /**
   * 안전한 AsyncStorage 작업
   */
  public async safeAsyncStorageSet(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to save to AsyncStorage (${key}):`, error);
      return false;
    }
  }

  public async safeAsyncStorageGet(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to read from AsyncStorage (${key}):`, error);
      return null;
    }
  }

  /**
   * 안전한 파일 삭제
   */
  public async safeDeleteFile(uri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log(`🗑️ Deleted file: ${uri}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete file ${uri}:`, error);
      return false;
    }
  }
}

export default MemoryManager.getInstance();