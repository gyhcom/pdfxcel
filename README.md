# PDFXcel - AI 기반 PDF to Excel 변환기

🚀 **프로덕션 준비 완료** - Flutter 모바일 앱과 FastAPI 백엔드가 통합된 PDF to Excel 변환 서비스입니다.

## 📱 현재 상태
- ✅ **iOS App Store 배포 준비 완료** (IPA 빌드 성공)
- ✅ **프로덕션 AdMob 광고 연동** 완료
- ✅ **Apple 인앱 결제** 시스템 구축
- ✅ **현대적이고 심플한 UI/UX** 디자인 적용
- ✅ **백엔드 API** Railway.app 배포 완료

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

### 📱 모바일 앱 (Flutter)
**핵심 기능**
- 🤖 **AI 기반 PDF → Excel 변환** (Claude AI 활용)
- 📄 **파일 선택 및 업로드** (파일 탐색기, 카메라 지원)
- ⚡ **실시간 변환 진행률** 표시 (WebSocket)
- 📊 **Excel 파일 미리보기** 및 다운로드
- 📋 **변환 히스토리** 관리
- 🔍 **사용 가이드** 및 도움말

**수익화 시스템**
- 💎 **PRO 구독 시스템** (월간/연간/평생 이용권)
- 🎯 **AdMob 광고 연동** (배너, 전면, 리워드 광고)
- 💰 **Apple 인앱 결제** (App Store Connect 연동)
- 🎁 **무료 사용자**: 일일 AI 변환 제한 + 광고 표시
- ⭐ **PRO 사용자**: 무제한 변환 + 광고 제거

**UI/UX 디자인**
- 🎨 **현대적이고 심플한 디자인** (클린 카드 레이아웃)
- 🌟 **Material 3 디자인 시스템** 적용
- 📱 **직관적인 사용자 인터페이스**
- 🎯 **효과적인 수익화 UI** (PRO 배너, 구독 유도)

### 🖥️ 백엔드 API (FastAPI)
**AI 처리 엔진**
- 🧠 **Claude 3.5 Sonnet** AI 모델 활용
- 📊 **고품질 테이블 데이터 추출**
- 🎯 **향상된 변환 정확도**
- ⚡ **비동기 처리** 및 작업 큐 시스템

**API 서비스**
- 📤 **파일 업로드 및 검증** (크기, 형식 제한)
- 🔄 **실시간 진행률 업데이트** (WebSocket)
- 📁 **Excel 파일 생성 및 다운로드**
- 📈 **변환 히스토리 관리**
- 🗂️ **임시 파일 자동 정리**

## 🔑 프로덕션 설정 현황

### ✅ 완료된 설정
**백엔드 API**
- 🤖 **Anthropic Claude API** 연동 완료
- 🚀 **Railway.app** 배포 완료
- 🔐 **환경변수** 및 보안 설정 완료

**iOS 앱 (프로덕션 준비 완료)**
- 📱 **Bundle ID**: `com.pdfxcel.pdfxcelFlutter`
- 👥 **Development Team**: `3TMD76L95Z`
- 🎯 **AdMob App ID**: `ca-app-pub-4940948867704473~4634542637`
- 💰 **인앱 결제 Product IDs**:
  - `com.pdfxcel.mobile.Monthly` (월간 구독)
  - `com.pdfxcel.mobile.Annual` (연간 구독)
  - `com.pdfxcel.mobile.Lifetime` (평생 이용권)
  - `com.pdfxcel.mobile.OneTimeAI` (AI 변환 10회)

**AdMob 광고 단위 ID (프로덕션)**
- 🎯 **리워드 광고**: `ca-app-pub-4940948867704473/9569500075`
- 📺 **전면 광고**: `ca-app-pub-4940948867704473/3804175689`
- 🏷️ **배너 광고**: `ca-app-pub-4940948867704473/5085467763`

### 📋 App Store 제출 준비사항
- ✅ **Release IPA** 빌드 완료 (`build/ios/ipa/*.ipa`)
- ✅ **코드 서명** 및 프로비저닝 완료
- ✅ **광고 및 결제** 시스템 연동 완료
- ⚠️ **앱 아이콘** 교체 필요 (현재 기본 플레이스홀더)
- 📝 **App Store Connect** 메타데이터 입력 필요

## 📱 지원 플랫폼

- **iOS**: 12.0 이상 (현재 프로덕션 준비 완료)
- **Android**: API 21 (Android 5.0) 이상 (개발 중)
- **웹**: 크롬, 사파리, 파이어폭스 (향후 지원 예정)

## 🏗️ 배포 현황

### ✅ 백엔드 배포 (Railway.app)
```bash
# 이미 배포 완료, API 엔드포인트 활성화 상태
# 프로덕션 URL: https://your-railway-app.railway.app
```

### ✅ iOS 앱 배포 준비 완료
```bash
# Release IPA 빌드 완료
flutter build ipa --release
# 결과: build/ios/ipa/*.ipa (57.2MB)

# App Store 업로드 준비
# 1. Apple Transporter 앱 사용
# 2. 또는 xcrun altool 명령어 사용
```

### 📋 App Store 업로드 방법
**방법 1: Apple Transporter 앱**
1. Mac App Store에서 "Transporter" 설치
2. `build/ios/ipa/*.ipa` 파일을 드래그 앤 드롭
3. App Store Connect에서 TestFlight 또는 리뷰 제출

**방법 2: 명령줄 도구**
```bash
xcrun altool --upload-app --type ios \
  -f build/ios/ipa/*.ipa \
  --apiKey [YOUR_API_KEY] \
  --apiIssuer [YOUR_ISSUER_ID]
```

### 🚀 다음 단계
1. **앱 아이콘 교체** (`ios/Runner/Assets.xcassets/AppIcon.appiconset/`)
2. **App Store Connect 설정**:
   - 앱 메타데이터 (설명, 스크린샷, 키워드)
   - 가격 및 가용성 설정
   - 인앱 구매 상품 승인 요청
3. **TestFlight 베타 테스트**
4. **App Store 리뷰 제출**

## 🔧 기술 스택

### Frontend (Flutter)
- **Framework**: Flutter 3.8.1+
- **언어**: Dart
- **상태관리**: Provider
- **UI**: Material 3 Design
- **광고**: Google Mobile Ads SDK
- **결제**: Apple In-App Purchase
- **파일처리**: file_picker, permission_handler

### Backend (FastAPI)
- **Framework**: FastAPI + Python 3.11
- **AI**: Anthropic Claude 3.5 Sonnet
- **파일처리**: pdfplumber, openpyxl
- **통신**: WebSocket (실시간 진행률)
- **배포**: Railway.app
- **보안**: 환경변수 기반 API 키 관리

### 개발도구
- **IDE**: VS Code, Xcode
- **버전관리**: Git
- **배포**: Flutter CLI, Railway CLI
- **테스트**: Flutter Test Framework

## 💰 수익화 모델

### 프리미엄 구독 (PRO)
- 🆓 **무료**: 일일 AI 변환 제한 + 광고 표시
- 💎 **월간 구독**: 무제한 변환 + 광고 제거
- 🏆 **연간 구독**: 무제한 변환 + 광고 제거 + 할인 혜택
- ⭐ **평생 이용권**: 한번 구매로 평생 무제한 이용

### 광고 수익
- 📱 **배너 광고**: 하단 고정 배너
- 📺 **전면 광고**: AI 변환 전 표시
- 🎁 **리워드 광고**: 추가 무료 변환 제공

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 지원

- 🐛 **버그 리포트**: GitHub Issues
- 💡 **기능 제안**: GitHub Discussions
- 📧 **비즈니스 문의**: [연락처 추가 필요]

---

**🎉 PDFXcel은 App Store 출시를 위한 모든 준비가 완료되었습니다!**
