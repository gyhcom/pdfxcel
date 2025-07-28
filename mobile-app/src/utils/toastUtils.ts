import Toast from 'react-native-toast-message';

export interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
}

export class ToastUtils {
  static showSuccess({ title, message, duration = 2000 }: ToastOptions) {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: duration,
      topOffset: 60,
    });
  }

  static showError({ title, message, duration = 4000 }: ToastOptions) {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      visibilityTime: duration,
      topOffset: 60,
    });
  }

  static showInfo({ title, message, duration = 3000 }: ToastOptions) {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: duration,
      topOffset: 60,
    });
  }

  static showWarning({ title, message, duration = 3000 }: ToastOptions) {
    Toast.show({
      type: 'error', // Warning type이 없으므로 error 사용
      text1: `⚠️ ${title}`,
      text2: message,
      visibilityTime: duration,
      topOffset: 60,
    });
  }

  // API 에러 전용 토스트
  static showApiError(code: string, message: string) {
    let title = '오류 발생';
    let displayMessage = message;
    let duration = 4000;

    switch (code) {
      case 'NETWORK_ERROR':
        title = '🌐 연결 오류';
        duration = 5000;
        break;
      case 'TIMEOUT_ERROR':
        title = '⏱️ 시간 초과';
        duration = 4000;
        break;
      case 'FILE_TOO_LARGE':
        title = '📁 파일 크기 초과';
        duration = 5000;
        break;
      case 'RATE_LIMIT':
        title = '🚫 요청 제한';
        duration = 6000;
        break;
      case 'SERVER_ERROR':
        title = '🔧 서버 오류';
        duration = 4000;
        break;
      default:
        title = '❌ 오류';
    }

    Toast.show({
      type: 'error',
      text1: title,
      text2: displayMessage,
      visibilityTime: duration,
      topOffset: 60,
    });
  }

  static hide() {
    Toast.hide();
  }
}

export default ToastUtils;