# PDFxcel

## 📄 소개
PDFxcel은 한국어 은행 명세서와 다양한 PDF 문서를 Excel 형식으로 변환해주는 AI 기반 도구입니다.  
FastAPI 백엔드와 React Native (Expo) 프론트엔드로 구성되어 있으며, Claude API를 활용한 지능형 파싱 기능을 포함합니다.

---

## 🔧 기술 스택

### 📦 Backend
- FastAPI
- Claude 3 API (Haiku)
- pdfplumber (기본 PDF 파싱)
- xlsxwriter (Excel 생성)
- httpx / python-multipart
- uvicorn

### 📱 Frontend
- React Native (Expo)
- TypeScript
- React Navigation v6
- AsyncStorage
- File Picker, Toast, Progress Bar

---

## 🎯 주요 기능

### ✅ PDF 변환
- 기본 파서 또는 Claude AI 선택 가능
- Excel 다운로드 및 공유 기능

### ✅ 구독 기반 업로드 제한
- FREE: 일일 3회 업로드, AI 1회 사용
- PRO: 무제한 사용
- 날짜 기준 제한 초기화
- 홈 화면에서 남은 횟수 실시간 표시

### ✅ 결과 미리보기 (예정)
- 변환 결과 Excel 내용을 앱 내 미리보기 가능

### ✅ 서버 파일 정리 (예정)
- 일정 시간 지난 파일 자동 삭제

---

## 🚀 실행 방법

### 백엔드
```bash
# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
export CLAUDE_API_KEY="your_api_key"

# 서버 실행
python run.py
```
서버는 http://localhost:8000 에서 실행됩니다.

### 프론트엔드
```bash
cd mobile-app

# 의존성 설치
npm install

# 앱 실행
npm start
```

---

## 📁 프로젝트 구조

```
PDFxcel/
├── 🖥️ app/                     # FastAPI 백엔드
│   ├── main.py                 # 메인 애플리케이션
│   ├── routers/                # API 라우터
│   │   ├── upload.py          # 파일 업로드
│   │   └── download.py        # 파일 다운로드
│   ├── services/              # 비즈니스 로직
│   │   ├── pdf_processor.py   # PDF 처리
│   │   ├── claude_integration.py # Claude API 연동
│   │   └── excel_generator.py # Excel 생성
│   ├── models/                # 데이터 모델
│   └── utils/                 # 유틸리티
├── 📱 mobile-app/             # React Native 앱
│   ├── src/
│   │   ├── screens/           # 화면 컴포넌트
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── UploadScreen.tsx
│   │   │   └── ResultScreen.tsx
│   │   ├── components/        # 재사용 컴포넌트
│   │   │   ├── UsageCard.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── services/          # API 서비스
│   │   │   ├── apiService.ts
│   │   │   └── userPlanService.ts
│   │   └── utils/             # 유틸리티
│   └── package.json
├── requirements.txt           # Python 의존성
├── run.py                    # 서버 실행 스크립트
└── README.md                 # 프로젝트 문서
```

---

## 🎨 주요 화면

### 1. 📱 홈 화면
- 앱 소개 및 기능 설명
- 사용량 카드 (플랜별 남은 업로드 횟수)
- 변환 시작 버튼

### 2. 📤 업로드 화면
- PDF 파일 선택 (Document Picker)
- AI 모드 토글 (Claude vs 기본 파서)
- 업로드 진행률 및 상태 표시
- 제한 초과 시 업그레이드 안내

### 3. 📊 결과 화면
- 변환 완료 알림
- Excel 파일 다운로드
- 파일 공유 및 저장 기능

---

## 🔑 API 엔드포인트

### 📤 파일 업로드
```http
POST /api/upload
Content-Type: multipart/form-data

# Parameters
file: PDF 파일
use_ai: boolean (Claude AI 사용 여부)
```

### 📥 파일 다운로드
```http
GET /api/download/{file_id}
```

### 🗑️ 파일 삭제
```http
DELETE /api/download/{file_id}
```

---

## 💳 구독 시스템

### 플랜별 제한사항
- **FREE 플랜**: 
  - 일일 PDF 업로드 3회 제한
  - AI 모드 사용 1회 제한
  - 매일 자정에 자동 초기화
- **PRO 플랜**: 
  - 무제한 PDF 업로드
  - 무제한 AI 모드 사용

### 기술적 구현
- AsyncStorage를 통한 로컬 사용량 추적
- 날짜 기반 자동 초기화 시스템
- RevenueCat 연동 준비된 구조
- 외부 인증 시스템 연동 가능

---

## 🔮 향후 계획

- [ ] **RevenueCat 결제 연동**: 실제 구독 결제 시스템
- [ ] **다양한 문서 지원**: 인보이스, 영수증, 수강이력표 등
- [ ] **결과 미리보기**: 앱 내에서 Excel 내용 확인
- [ ] **클라우드 연동**: Google Drive, Dropbox 저장
- [ ] **대량 처리**: 여러 파일 동시 변환
- [ ] **오프라인 모드**: 기본 파싱 기능 오프라인 지원

---

## 🛠️ 개발 환경

- **Backend**: Python 3.8+, FastAPI
- **Mobile**: React Native (Expo), TypeScript
- **AI**: Claude 3 Haiku API
- **Database**: AsyncStorage (로컬), 향후 PostgreSQL/MongoDB
- **플랫폼**: iOS 13+, Android 5.0+

---

## 📄 라이선스

Private Project - All Rights Reserved

---

## 🤝 기여

이 프로젝트는 현재 비공개 프로젝트입니다. 문의사항이 있으시면 이슈를 생성해 주세요.

---

**Made with ❤️ for easier document processing**