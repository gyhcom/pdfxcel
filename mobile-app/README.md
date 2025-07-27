# PDFXcel Mobile App 📱

PDF 은행 명세서를 Excel로 변환하는 React Native (Expo) 모바일 앱입니다.

## 🎯 주요 기능

- **PDF 파일 업로드**: 은행 명세서 PDF 파일을 간편하게 선택하고 업로드
- **AI 지능형 분석**: Claude AI를 사용한 정확한 데이터 추출 (선택 가능)
- **기본 파싱**: pdfplumber를 사용한 기본 테이블 추출
- **Excel 변환**: 구조화된 Excel 파일로 자동 변환
- **파일 관리**: 다운로드, 공유, 저장 기능
- **한국어 UI**: 완전한 한국어 사용자 인터페이스
- **사용량 제한**: FREE/PRO 플랜 기반 일일 업로드 제한
- **구독 관리**: RevenueCat 연동 준비된 구독 시스템

## 📱 화면 구성

### 1. 홈 화면 (HomeScreen)
- 앱 소개 및 주요 기능 설명
- **사용량 표시 카드**: 현재 플랜 및 남은 업로드 횟수
- 변환 시작 버튼 (제한 확인 포함)
- 개발용 플랜 토글 버튼

### 2. 업로드 화면 (UploadScreen)
- PDF 파일 선택 (Document Picker)
- Claude AI 사용 여부 토글
- **업로드 제한 체크**: 업로드 전 사용량 확인
- 업로드 진행률 표시
- 실시간 처리 상태 표시

### 3. 결과 화면 (ResultScreen)
- 변환 완료 알림
- Excel 파일 다운로드
- 파일 공유 및 저장 기능
- 새 변환 시작

## 🛠️ 기술 스택

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **Language**: TypeScript
- **Styling**: StyleSheet (Native)
- **File Handling**: expo-document-picker, expo-file-system
- **Sharing**: expo-sharing, expo-media-library
- **UI Components**: Custom components with Ionicons
- **State Management**: React Hooks

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
cd mobile-app
npm install
```

### 2. 백엔드 서버 실행
먼저 FastAPI 백엔드 서버가 실행되어 있어야 합니다:
```bash
cd ..  # 루트 디렉토리로
python run.py
```

### 3. 모바일 앱 실행
```bash
cd mobile-app

# 개발 서버 시작
npm start

# 특정 플랫폼에서 실행
npm run ios      # iOS 시뮬레이터
npm run android  # Android 에뮬레이터
npm run web      # 웹 브라우저
```

### 4. Expo Go 앱으로 테스트
1. 모바일 기기에 [Expo Go](https://expo.dev/client) 앱 설치
2. `npm start` 실행 후 QR 코드 스캔
3. 앱이 자동으로 로드됨

## ⚙️ 환경 설정

### API 서버 주소 설정
`src/constants/config.ts`에서 백엔드 서버 주소를 설정할 수 있습니다:

```typescript
export const API_CONFIG: ApiConfig = {
  baseUrl: __DEV__ 
    ? 'http://localhost:8000/api'  // 개발 환경
    : 'https://your-production-domain.com/api',  // 프로덕션 환경
  timeout: 30000,
};
```

**주의**: iOS 시뮬레이터에서는 `localhost` 사용 가능하지만, 실제 기기에서는 컴퓨터의 IP 주소를 사용해야 합니다.

## 📁 프로젝트 구조

```
mobile-app/
├── App.tsx                 # 메인 앱 컴포넌트
├── src/
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   └── ProgressBar.tsx
│   ├── screens/           # 화면 컴포넌트
│   │   ├── HomeScreen.tsx
│   │   ├── UploadScreen.tsx
│   │   └── ResultScreen.tsx
│   ├── services/          # API 서비스
│   │   └── apiService.ts
│   ├── utils/             # 유틸리티 함수
│   │   └── fileUtils.ts
│   ├── types/             # TypeScript 타입 정의
│   │   └── index.ts
│   └── constants/         # 상수 및 설정
│       └── config.ts
├── assets/                # 이미지, 아이콘 등
├── package.json
└── app.json              # Expo 설정
```

## 🚀 빌드 및 배포

### 개발 빌드
```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

### 프로덕션 빌드
```bash
# iOS App Store
eas build --platform ios --profile production

# Android Play Store
eas build --platform android --profile production
```

### 업데이트 배포
```bash
eas update --branch production --message "업데이트 메시지"
```

## 📱 지원 플랫폼

- **iOS**: 13.0 이상
- **Android**: API 21 (Android 5.0) 이상
- **Web**: 모던 브라우저 (테스트용)

## 🔧 개발 참고사항

### 권한 설정
- **iOS**: 파일 접근을 위한 iCloud 권한
- **Android**: 외부 저장소 읽기/쓰기 권한

### API 통신
- 개발 환경에서는 `http://localhost:8000` 사용
- 프로덕션에서는 HTTPS 필수
- 타임아웃: 30초로 설정

### 파일 처리
- PDF 파일만 업로드 가능
- 최대 파일 크기 제한 (백엔드에서 설정)
- 변환된 Excel 파일은 앱 내 임시 저장

## 📋 구독 시스템

### 플랜별 제한사항
- **FREE 플랜**: 
  - 일일 PDF 업로드 3회 제한
  - AI 모드 사용 1회 제한
  - 매일 자정에 자동 초기화
- **PRO 플랜**: 
  - 무제한 PDF 업로드
  - 무제한 AI 모드 사용

### 구독 관리
- `AsyncStorage`를 통한 로컬 사용량 추적
- 날짜 기반 자동 초기화 시스템
- RevenueCat 연동 준비된 구조
- 외부 인증 시스템 연동 가능

### 개발/테스트
- 개발 모드에서 플랜 토글 버튼 제공
- 사용량 리셋 및 통계 확인 기능
- 구독 상태 시뮬레이션

## 🔮 향후 계획

- [ ] RevenueCat 결제 시스템 연동
- [ ] 프리미엄 기능 (대량 처리, 고급 분석)
- [ ] 다양한 문서 타입 지원 (인보이스, 영수증 등)
- [ ] 클라우드 저장소 연동 (Google Drive, Dropbox)
- [ ] 오프라인 모드 지원
- [ ] 다국어 지원

## 📄 라이선스

Private Project - All Rights Reserved

---

Made with ❤️ for easier PDF to Excel conversion