# PDFXcel Flutter App - Claude Code 가이드

## 프로젝트 개요
AI 기반 PDF to Excel 변환 서비스를 제공하는 Flutter 모바일 앱

### 기술 스택
- **Framework**: Flutter 3.8.1+
- **Language**: Dart
- **Platform**: iOS (Android 향후 지원 예정)
- **State Management**: Provider 패턴
- **HTTP Client**: Dio
- **Localization**: Flutter Intl
- **In-App Purchase**: Flutter official in_app_purchase
- **Ads**: Google Mobile Ads

## 프로젝트 구조

```
lib/
├── main.dart                    # 앱 진입점
├── providers/                   # 상태 관리
│   ├── app_state_provider.dart  # 앱 전역 상태 (구독, 변환 제한)
│   └── language_provider.dart   # 언어 설정 관리
├── screens/                     # 화면 위젯
│   ├── home_screen.dart         # 메인 화면 (PDF 업로드/변환)
│   ├── settings_screen.dart     # 설정 화면
│   ├── contact_screen.dart      # 문의하기 화면
│   ├── subscription_screen.dart # 구독 화면
│   ├── privacy_policy_screen.dart
│   └── terms_of_service_screen.dart
├── services/                    # 비즈니스 로직
│   ├── api_service.dart         # API 통신
│   ├── purchase_service.dart    # 인앱 결제 처리
│   ├── file_service.dart        # 파일 관리
│   └── ad_service.dart          # 광고 관리
├── widgets/                     # 재사용 가능한 위젯
│   ├── language_selector.dart   # 언어 선택 위젯
│   └── conversion_progress.dart # 변환 진행상황 위젯
├── utils/                       # 유틸리티
│   ├── network_checker.dart     # 네트워크 상태 확인
│   └── constants.dart           # 상수 정의
└── l10n/                        # 다국어 지원
    ├── app_en.arb              # 영어 번역
    ├── app_ko.arb              # 한국어 번역
    └── app_localizations*.dart  # 생성된 로컬라이제이션 코드
```

## 주요 기능

### 1. PDF to Excel 변환
- **위치**: `lib/screens/home_screen.dart`
- **API 서버**: Railway에 호스팅된 Python 백엔드
- **AI 모델**: Anthropic Claude API 사용
- **파일 처리**: `file_picker` 패키지로 PDF 선택, `path_provider`로 저장

### 2. 구독 시스템
- **위치**: `lib/services/purchase_service.dart`, `lib/screens/subscription_screen.dart`
- **Apple StoreKit**: Flutter 공식 `in_app_purchase` 패키지 사용
- **구독 상품**: 
  - 월간 플랜: `com.pdfxcel.mobile.monthly`
  - 연간 플랜: `com.pdfxcel.mobile.yearly`
  - 1회 변환권: `com.pdfxcel.mobile.OneTimeAI`

### 3. 다국어 지원
- **위치**: `lib/l10n/`
- **지원 언어**: 한국어(기본), 영어
- **구현**: Flutter Intl 패키지 사용
- **로컬 설정**: `lib/providers/language_provider.dart`에서 관리

### 4. 문의하기 시스템
- **위치**: `lib/screens/contact_screen.dart`
- **기능**: 
  - 이메일 앱 자동 실행 (`url_launcher`)
  - 기기 정보 자동 수집 (`device_info_plus`, `package_info_plus`)
  - 클립보드 복사 대체 기능
  - 완전한 다국어 지원

## 개발 가이드라인

### 코딩 컨벤션
- **파일명**: snake_case (예: `home_screen.dart`)
- **클래스명**: PascalCase (예: `HomeScreen`)
- **변수/함수**: camelCase (예: `isLoading`)
- **상수**: SCREAMING_SNAKE_CASE (예: `API_BASE_URL`)

### 상태 관리 패턴
```dart
// Provider 패턴 사용
class AppStateProvider extends ChangeNotifier {
  // 상태 변수들
  bool _isLoading = false;
  
  // Getter
  bool get isLoading => _isLoading;
  
  // 상태 변경 메소드
  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}

// 위젯에서 사용
Consumer<AppStateProvider>(
  builder: (context, appState, child) {
    return Text(appState.isLoading ? '로딩 중...' : '완료');
  },
)
```

### 로컬라이제이션 사용법
```dart
// 위젯 내에서
final l10n = AppLocalizations.of(context)!;
Text(l10n.homeTitle) // "PDF to Excel Converter" 또는 "PDF를 Excel로 변환"

// ARB 파일에 키 추가
// app_ko.arb: "homeTitle": "PDF를 Excel로 변환"
// app_en.arb: "homeTitle": "PDF to Excel Converter"
```

### API 호출 패턴
```dart
// services/api_service.dart
class ApiService {
  static const String baseUrl = 'https://your-railway-app.railway.app';
  
  static Future<Map<String, dynamic>> convertPdf(File pdfFile) async {
    try {
      // Dio를 사용한 파일 업로드
      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(pdfFile.path),
      });
      
      Response response = await dio.post('$baseUrl/convert', data: formData);
      return response.data;
    } catch (e) {
      throw Exception('변환 실패: $e');
    }
  }
}
```

## 환경 설정

### 필수 의존성
```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.1          # 상태 관리
  dio: ^5.4.0               # HTTP 클라이언트
  file_picker: ^10.2.1      # 파일 선택
  url_launcher: ^6.2.4      # 외부 앱 실행
  in_app_purchase: ^3.1.13  # 인앱 결제
  google_mobile_ads: ^5.0.0 # 광고
  device_info_plus: ^11.2.0 # 기기 정보
  package_info_plus: ^8.1.1 # 앱 정보
```

### iOS 설정
- **Bundle ID**: `com.pdfxcel.mobile`
- **App Store Connect**: 인앱 결제 상품 등록 필요
- **Info.plist**: 파일 액세스 권한 설정 완료

### 빌드 명령어
```bash
# 개발 빌드
flutter run

# 프로덕션 빌드 (iOS)
flutter build ios --release

# 의존성 설치
flutter pub get

# 로컬라이제이션 생성
flutter gen-l10n
```

## 트러블슈팅

### 자주 발생하는 이슈
1. **로컬라이제이션 오류**: `flutter gen-l10n` 실행 후 핫 리로드
2. **빌드 오류**: `flutter clean && flutter pub get` 실행
3. **iOS 빌드 실패**: `cd ios && pod install --repo-update`
4. **인앱 결제 테스트**: Sandbox 계정과 TestFlight 사용

### 디버깅 팁
- **네트워크 이슈**: `lib/utils/network_checker.dart` 활용
- **상태 관리 이슈**: Flutter Inspector 사용
- **퍼포먼스**: `flutter run --profile` 모드로 테스트

## 연락처
- **개발자**: Gyh
- **이메일**: gyeonho@gmail.com
- **GitHub**: https://github.com/gyhcom/pdfxcel

---

이 문서는 Claude Code와 함께 PDFXcel Flutter 앱을 효율적으로 개발하기 위한 가이드입니다.