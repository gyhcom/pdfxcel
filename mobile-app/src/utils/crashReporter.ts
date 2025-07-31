/**
 * 크래시 리포터 및 오류 로깅 유틸리티
 */

interface CrashReport {
  timestamp: string;
  error: Error;
  errorInfo?: any;
  userAgent?: string;
  url?: string;
  userId?: string;
  additionalInfo?: any;
}

class CrashReporter {
  private static instance: CrashReporter;
  private crashes: CrashReport[] = [];
  private maxCrashes = 10; // 최대 10개 크래시 보관

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  /**
   * 전역 오류 핸들러 설정
   */
  private setupGlobalErrorHandlers(): void {
    try {
      // React Native의 전역 오류 핸들러
      if (typeof ErrorUtils !== 'undefined') {
        const originalHandler = ErrorUtils.getGlobalHandler();
        
        ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
          console.error('🚨 Global Error Handler:', error, 'isFatal:', isFatal);
          
          this.reportCrash(error, {
            isFatal,
            source: 'ErrorUtils'
          });

          // 원래 핸들러도 호출
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
      }

      // React Native에서는 Promise rejection을 다르게 처리
      // 웹 환경에서만 window.addEventListener 사용
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('unhandledrejection', (event) => {
          console.error('🚨 Unhandled Promise Rejection:', event.reason);
          
          const error = event.reason instanceof Error 
            ? event.reason 
            : new Error(String(event.reason));
            
          this.reportCrash(error, {
            source: 'unhandledrejection',
            promise: true
          });
        });
      }

      // React Native 전용: Promise rejection 처리 (추가 안전장치)
      if (typeof global !== 'undefined') {
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
          // Promise rejection이나 기타 오류 패턴 감지
          const message = args.join(' ');
          if (message.includes('Possible Unhandled Promise Rejection')) {
            this.reportCrash(new Error('Unhandled Promise Rejection: ' + message), {
              source: 'console.error',
              promise: true,
              args
            });
          }
          
          // 원래 console.error 호출
          originalConsoleError.apply(console, args);
        };
      }

    } catch (setupError) {
      console.warn('Failed to setup global error handlers:', setupError);
    }
  }

  /**
   * 크래시 보고
   */
  public reportCrash(error: Error, additionalInfo?: any): void {
    const crashReport: CrashReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
      additionalInfo
    };

    // 메모리 관리: 오래된 크래시 제거
    if (this.crashes.length >= this.maxCrashes) {
      this.crashes.shift();
    }

    this.crashes.push(crashReport);

    // 개발 모드에서는 콘솔에 자세한 정보 출력
    if (__DEV__) {
      console.group('🚨 Crash Report');
      console.error('Error:', error);
      console.log('Additional Info:', additionalInfo);
      console.log('Stack Trace:', error.stack);
      console.groupEnd();
    }

    // 프로덕션에서는 원격 로깅 서비스에 전송 (향후 구현)
    if (!__DEV__) {
      this.sendCrashReportToRemote(crashReport);
    }
  }

  /**
   * 원격 서버로 크래시 리포트 전송 (향후 구현)
   */
  private async sendCrashReportToRemote(crashReport: CrashReport): Promise<void> {
    try {
      // TODO: 실제 서비스에서는 Sentry, Bugsnag 등의 서비스 사용
      console.log('📤 Sending crash report to remote service...');
      
      // 현재는 로컬 스토리지에만 저장
      const existingReports = await this.getStoredCrashReports();
      const updatedReports = [...existingReports, crashReport].slice(-this.maxCrashes);
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('crash_reports', JSON.stringify(updatedReports));
      }
    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }

  /**
   * 저장된 크래시 리포트 조회
   */
  private async getStoredCrashReports(): Promise<CrashReport[]> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('crash_reports');
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * 현재 세션의 크래시 리포트 조회
   */
  public getCrashReports(): CrashReport[] {
    return [...this.crashes];
  }

  /**
   * 크래시 리포트 삭제
   */
  public clearCrashReports(): void {
    this.crashes = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('crash_reports');
    }
  }

  /**
   * 안전한 함수 실행 래퍼
   */
  public safeExecute<T>(
    fn: () => T,
    fallback?: T,
    context?: string
  ): T | undefined {
    try {
      return fn();
    } catch (error) {
      console.error(`Safe execute failed${context ? ` in ${context}` : ''}:`, error);
      this.reportCrash(error as Error, { context, source: 'safeExecute' });
      return fallback;
    }
  }

  /**
   * 안전한 비동기 함수 실행 래퍼
   */
  public async safeExecuteAsync<T>(
    fn: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      console.error(`Safe execute async failed${context ? ` in ${context}` : ''}:`, error);
      this.reportCrash(error as Error, { context, source: 'safeExecuteAsync' });
      return fallback;
    }
  }
}

export default CrashReporter.getInstance();