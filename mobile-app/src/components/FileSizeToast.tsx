/**
 * 파일 크기 관련 토스트 메시지 컴포넌트
 */
import Toast from 'react-native-toast-message';
import { FileSizeInfo } from '../utils/fileSizeValidator';

export interface FileSizeToastOptions {
  filename?: string;
  fileSizeInfo?: FileSizeInfo;
  visibilityTime?: number;
}

export class FileSizeToast {
  /**
   * 파일 크기 초과 오류 토스트
   */
  static showSizeExceeded(options: FileSizeToastOptions = {}) {
    const { filename, fileSizeInfo, visibilityTime = 5000 } = options;
    
    let text1 = '📋 파일 크기 초과';
    let text2 = '최대 10MB까지 업로드 가능합니다.';
    
    if (filename) {
      text1 = `📋 ${filename} - 크기 초과`;
    }
    
    if (fileSizeInfo) {
      text2 = `업로드: ${fileSizeInfo.formattedSize} / 최대: ${fileSizeInfo.formattedMaxSize}`;
    }

    Toast.show({
      type: 'error',
      text1,
      text2,
      visibilityTime,
      topOffset: 60,
    });
  }

  /**
   * 잘못된 파일 형식 토스트
   */
  static showInvalidFileType(filename?: string, visibilityTime = 4000) {
    const extension = filename ? filename.substring(filename.lastIndexOf('.')).toLowerCase() : '';
    
    Toast.show({
      type: 'error',
      text1: '📄 지원하지 않는 파일 형식',
      text2: `PDF 파일만 업로드 가능합니다.${extension ? ` (현재: ${extension})` : ''}`,
      visibilityTime,
      topOffset: 60,
    });
  }

  /**
   * 빈 파일 오류 토스트
   */
  static showEmptyFile(filename?: string, visibilityTime = 3000) {
    Toast.show({
      type: 'error',
      text1: '📭 빈 파일',
      text2: `${filename ? `'${filename}'는 ` : ''}빈 파일입니다.`,
      visibilityTime,
      topOffset: 60,
    });
  }

  /**
   * 큰 파일 경고 토스트
   */
  static showLargeFileWarning(options: FileSizeToastOptions = {}) {
    const { filename, fileSizeInfo, visibilityTime = 4000 } = options;
    
    let text1 = '⚠️ 큰 파일';
    let text2 = '업로드에 시간이 걸릴 수 있습니다.';
    
    if (filename && fileSizeInfo) {
      text1 = `⚠️ ${filename} (${fileSizeInfo.formattedSize})`;
    }

    Toast.show({
      type: 'info',
      text1,
      text2,
      visibilityTime,
      topOffset: 60,
    });
  }

  /**
   * 파일 선택 성공 토스트
   */
  static showFileSelected(options: FileSizeToastOptions = {}) {
    const { filename, fileSizeInfo, visibilityTime = 2000 } = options;
    
    let text1 = '✅ 파일 선택됨';
    let text2 = '업로드 준비가 완료되었습니다.';
    
    if (filename && fileSizeInfo) {
      text1 = `✅ ${filename}`;
      text2 = `크기: ${fileSizeInfo.formattedSize} | 업로드 준비 완료`;
    }

    Toast.show({
      type: 'success',
      text1,
      text2,
      visibilityTime,
      topOffset: 60,
    });
  }

  /**
   * 서버 파일 크기 오류 응답 처리
   */
  static showServerSizeError(errorResponse: any, visibilityTime = 5000) {
    // 서버에서 반환된 상세 오류 정보 파싱
    const detail = errorResponse?.detail || errorResponse;
    
    if (typeof detail === 'object' && detail.error === 'FILE_SIZE_EXCEEDED') {
      const { filename, file_size_mb, max_size_mb } = detail;
      
      Toast.show({
        type: 'error',
        text1: `📋 ${filename || '파일'} - 서버 검증 실패`,
        text2: `크기: ${file_size_mb}MB / 최대: ${max_size_mb}MB`,
        visibilityTime,
        topOffset: 60,
      });
    } else {
      // 일반적인 서버 오류 메시지
      const message = typeof detail === 'string' ? detail : detail?.message || '서버에서 파일을 거부했습니다.';
      
      Toast.show({
        type: 'error',
        text1: '🚫 서버 검증 실패',
        text2: message,
        visibilityTime,
        topOffset: 60,
      });
    }
  }

  /**
   * 네트워크 오류로 인한 파일 크기 확인 불가 토스트
   */
  static showNetworkError(visibilityTime = 4000) {
    Toast.show({
      type: 'error',
      text1: '🌐 네트워크 오류',
      text2: '파일 업로드에 실패했습니다. 다시 시도해주세요.',
      visibilityTime,
      topOffset: 60,
    });
  }
}