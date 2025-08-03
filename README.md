# PDFXcel - AI 기반 PDF to Excel 변환기

Flutter 모바일 앱과 FastAPI 백엔드가 통합된 PDF to Excel 변환 서비스입니다.

## 프로젝트 구조

```
pdfxcel_flutter/
├── lib/                    # Flutter 앱 소스
│   ├── main.dart          # 앱 진입점
│   ├── screens/           # 화면들
│   ├── services/          # 서비스 로직
│   ├── providers/         # 상태 관리
│   └── widgets/           # 재사용 위젯
├── backend/               # FastAPI 백엔드
│   ├── app_main.py        # FastAPI 앱
│   ├── main.py           # 서버 런처
│   ├── routers/          # API 라우터
│   ├── services/         # 비즈니스 로직
│   ├── models/           # 데이터 모델
│   └── utils/            # 유틸리티
├── android/              # Android 빌드 설정
├── ios/                  # iOS 빌드 설정
└── assets/               # 앱 리소스
```

## 🚀 빠른 시작

### 백엔드 서버 실행

1. **Python 환경 설정**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **환경변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일에서 ANTHROPIC_API_KEY 등 필요한 값 설정
   ```

3. **개발 서버 실행**
   ```bash
   python run_dev.py
   ```
   
   서버가 http://localhost:8000 에서 실행됩니다.
   - API 문서: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Flutter 앱 실행

1. **Flutter 환경 설정**
   ```bash
   flutter pub get
   ```

2. **앱 실행**
   ```bash
   # iOS 시뮬레이터
   flutter run -d ios
   
   # Android 에뮬레이터  
   flutter run -d android
   ```

## 🔧 개발 가이드

### 백엔드 API 테스트
```bash
# 서버 상태 확인
curl http://localhost:8000/health

# API 정보 확인  
curl http://localhost:8000/api
```

### Flutter 앱과 백엔드 연결
- `lib/services/api_service.dart`에서 API 기본 URL 확인
- 로컬 개발 시: `http://localhost:8000` 또는 `http://10.0.2.2:8000` (Android 에뮬레이터)

## 🎯 주요 기능

### 모바일 앱 (Flutter)
- PDF 파일 업로드
- AI 기반 변환 요청
- 실시간 변환 상태 확인
- Excel 파일 다운로드 및 미리보기
- PRO 구독 시스템 (무제한 변환)
- AdMob 광고 시스템

### 백엔드 API (FastAPI)
- PDF 파일 업로드 및 검증
- AI 기반 테이블 데이터 추출 (Claude API)
- Excel 파일 생성 및 다운로드
- 변환 작업 상태 관리
- 파일 히스토리 관리
- WebSocket 실시간 통신

## 🔑 필수 설정

### Anthropic API Key
Claude AI를 사용하기 위해 Anthropic API 키가 필요합니다:
1. https://console.anthropic.com 에서 계정 생성
2. API 키 발급
3. `backend/.env` 파일에 `ANTHROPIC_API_KEY` 설정

### 모바일 앱 설정
- **AdMob**: Google AdMob 계정 및 광고 단위 ID 설정
- **인앱 결제**: Apple App Store Connect / Google Play Console 설정
- **아이콘**: `assets/` 폴더의 앱 아이콘 리소스

## 📱 지원 플랫폼

- **iOS**: 13.0 이상
- **Android**: API 21 (Android 5.0) 이상
- **웹**: 크롬, 사파리, 파이어폭스 (베타)

## 🏗️ 배포

### 백엔드 배포 (Railway.app)
```bash
# Railway CLI 설치 후
railway login
railway link
railway deploy
```

### 모바일 앱 배포
```bash
# Android APK 빌드
flutter build apk --release

# iOS 빌드 (macOS에서만)
flutter build ios --release
```

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 지원

문제가 있으시면 GitHub Issues에 등록해주세요.
