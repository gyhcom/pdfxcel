/**
 * WebSocket 서비스
 * 실시간 변환 진행률 업데이트를 위한 WebSocket 연결 관리
 */
import { API_CONFIG } from '../constants/config';

export interface ProgressData {
  file_id: string;
  status: 'starting' | 'validating' | 'extracting' | 'processing' | 'generating' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  message: string;
  timestamp: string;
  data?: any;
}

export interface ProgressCallback {
  (data: ProgressData): void;
}

export interface WebSocketConfig {
  onProgress?: ProgressCallback;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private fileId: string = '';
  private config: WebSocketConfig = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 2000; // 2초
  private pingInterval: NodeJS.Timeout | null = null;
  private isManualClose: boolean = false;

  constructor(config: WebSocketConfig = {}) {
    this.config = config;
  }

  /**
   * WebSocket 연결 시작
   */
  connect(fileId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.fileId = fileId;
        this.isManualClose = false;
        
        // WebSocket URL 생성 (HTTP -> WS 변환)
        const wsUrl = API_CONFIG.baseUrl
          .replace('http://', 'ws://')
          .replace('https://', 'wss://') + `/ws/${fileId}`;
        
        console.log('🔌 Connecting to WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for file:', fileId);
          this.reconnectAttempts = 0;
          this.startPing();
          this.config.onConnect?.();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data: ProgressData = JSON.parse(event.data);
            console.log('📨 Progress update:', data.status, `${data.progress}%`);
            this.config.onProgress?.(data);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.stopPing();
          this.config.onDisconnect?.();
          
          // 의도적인 종료가 아니면 재연결 시도
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          const wsError = new Error('WebSocket connection failed');
          this.config.onError?.(wsError);
          reject(wsError);
        };
        
      } catch (error) {
        console.error('❌ WebSocket connection setup failed:', error);
        reject(error);
      }
    });
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopPing();
    
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Manual disconnect');
      }
      this.ws = null;
    }
    
    console.log('🔌 WebSocket manually disconnected');
  }

  /**
   * 변환 취소 요청
   */
  cancelConversion(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const cancelMessage = {
        action: 'cancel_request',
        timestamp: new Date().toISOString()
      };
      
      this.ws.send(JSON.stringify(cancelMessage));
      console.log('🛑 Cancel request sent for file:', this.fileId);
    }
  }

  /**
   * 현재 상태 요청
   */
  requestStatus(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const statusMessage = {
        action: 'status_request',
        timestamp: new Date().toISOString()
      };
      
      this.ws.send(JSON.stringify(statusMessage));
      console.log('📊 Status request sent for file:', this.fileId);
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 현재 파일 ID 반환
   */
  getCurrentFileId(): string {
    return this.fileId;
  }

  /**
   * 재연결 시도
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // 지수 백오프
    
    console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect(this.fileId).catch((error) => {
          console.error('❌ Reconnect failed:', error);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            const finalError = new Error('Maximum reconnection attempts reached');
            this.config.onError?.(finalError);
          }
        });
      }
    }, delay);
  }

  /**
   * Ping 시작 (연결 유지)
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingMessage = {
          action: 'ping',
          timestamp: new Date().toISOString()
        };
        
        this.ws.send(JSON.stringify(pingMessage));
      }
    }, 30000); // 30초마다 ping
  }

  /**
   * Ping 중지
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

/**
 * 전역 WebSocket 서비스 인스턴스
 */
export const createWebSocketService = (config: WebSocketConfig): WebSocketService => {
  return new WebSocketService(config);
};