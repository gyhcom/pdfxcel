/**
 * 파일 크기 검증 유틸리티
 */

export interface FileSizeInfo {
  sizeBytes: number;
  sizeMB: number;
  maxSizeMB: number;
  isValid: boolean;
  formattedSize: string;
  formattedMaxSize: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: 'SIZE_EXCEEDED' | 'INVALID_TYPE' | 'EMPTY_FILE';
  fileSizeInfo?: FileSizeInfo;
}

export class FileSizeValidator {
  // 최대 파일 크기 (바이트)
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  // 허용된 파일 확장자
  private static readonly ALLOWED_EXTENSIONS = ['.pdf'];

  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * 파일 크기 정보 생성
   */
  static getFileSizeInfo(sizeBytes: number): FileSizeInfo {
    const sizeMB = Number((sizeBytes / (1024 * 1024)).toFixed(2));
    const maxSizeMB = this.MAX_FILE_SIZE / (1024 * 1024);
    
    return {
      sizeBytes,
      sizeMB,
      maxSizeMB,
      isValid: sizeBytes <= this.MAX_FILE_SIZE,
      formattedSize: this.formatFileSize(sizeBytes),
      formattedMaxSize: this.formatFileSize(this.MAX_FILE_SIZE)
    };
  }

  /**
   * 파일 크기 검증
   */
  static validateFileSize(sizeBytes: number): ValidationResult {
    const fileSizeInfo = this.getFileSizeInfo(sizeBytes);
    
    // 빈 파일 체크
    if (sizeBytes === 0) {
      return {
        isValid: false,
        error: '파일이 비어있습니다.',
        errorType: 'EMPTY_FILE',
        fileSizeInfo
      };
    }
    
    // 크기 초과 체크
    if (sizeBytes > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `파일 크기가 제한을 초과했습니다.\n업로드: ${fileSizeInfo.formattedSize} / 최대: ${fileSizeInfo.formattedMaxSize}`,
        errorType: 'SIZE_EXCEEDED',
        fileSizeInfo
      };
    }
    
    return {
      isValid: true,
      fileSizeInfo
    };
  }

  /**
   * 파일 확장자 검증
   */
  static validateFileExtension(filename: string): ValidationResult {
    if (!filename) {
      return {
        isValid: false,
        error: '파일명이 제공되지 않았습니다.',
        errorType: 'INVALID_TYPE'
      };
    }

    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `지원하지 않는 파일 형식입니다.\nPDF 파일만 업로드 가능합니다. (현재: ${extension})`,
        errorType: 'INVALID_TYPE'
      };
    }

    return { isValid: true };
  }

  /**
   * 전체 파일 검증 (크기 + 확장자)
   */
  static validateFile(sizeBytes: number, filename: string): ValidationResult {
    // 1. 확장자 검증
    const extensionResult = this.validateFileExtension(filename);
    if (!extensionResult.isValid) {
      return extensionResult;
    }

    // 2. 파일 크기 검증
    return this.validateFileSize(sizeBytes);
  }

  /**
   * 파일 업로드 전 사전 검증
   */
  static preUploadValidation(file: { size: number; name: string }): {
    canUpload: boolean;
    warningMessage?: string;
    errorMessage?: string;
    fileSizeInfo: FileSizeInfo;
  } {
    const validation = this.validateFile(file.size, file.name);
    const fileSizeInfo = validation.fileSizeInfo!;

    if (!validation.isValid) {
      return {
        canUpload: false,
        errorMessage: validation.error,
        fileSizeInfo
      };
    }

    // 크기가 큰 파일에 대한 경고 (8MB 이상)
    const warningThreshold = 8 * 1024 * 1024; // 8MB
    let warningMessage: string | undefined;
    
    if (file.size > warningThreshold) {
      warningMessage = `파일 크기가 큽니다 (${fileSizeInfo.formattedSize}). 업로드에 시간이 걸릴 수 있습니다.`;
    }

    return {
      canUpload: true,
      warningMessage,
      fileSizeInfo
    };
  }

  /**
   * 파일 크기 제한 정보 반환
   */
  static getFileSizeLimits() {
    return {
      maxSizeBytes: this.MAX_FILE_SIZE,
      maxSizeMB: this.MAX_FILE_SIZE / (1024 * 1024),
      formattedMaxSize: this.formatFileSize(this.MAX_FILE_SIZE),
      allowedExtensions: this.ALLOWED_EXTENSIONS
    };
  }
}