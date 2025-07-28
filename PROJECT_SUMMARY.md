# 🚀 PDFxcel - 프로젝트 요약 및 개발 가이드

> **CLI 재시작 시 컨텍스트 복구용 종합 문서**  
> 위치: `~/Workspace/dev/pdfxcel`

---

## 📋 프로젝트 개요

**PDFxcel**은 한국어 은행 명세서와 다양한 PDF 문서를 Excel로 변환하는 **AI 기반 모바일 앱**입니다.

### 🔧 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React Native (Expo SDK 53), TypeScript, React Navigation v6 |
| **Backend** | FastAPI, Python 3.8+, uvicorn |
| **AI** | Claude 3 Haiku API (Anthropic) |
| **PDF 처리** | pdfplumber (기본), Claude API (AI 모드) |
| **Excel 생성** | xlsxwriter |
| **Storage** | AsyncStorage (로컬), temp_files (서버) |
| **Network** | Cloudflare Tunnel (개발), httpx, CORS |

---

## 🏗️ 전체 아키텍처

```
📱 React Native App (Expo)
    ↓ HTTP/HTTPS
🌐 Cloudflare Tunnel (개발 환경)
    ↓
🖥️ FastAPI Server (localhost:8000)
    ↓
🤖 Claude API (AI 처리) + 📄 pdfplumber (기본 처리)
    ↓
📊 Excel 생성 (xlsxwriter)
    ↓
💾 임시 파일 저장 (자동 정리)
```

### 데이터 흐름
1. **업로드**: PDF 파일 선택 → Multipart Upload → 임시 저장
2. **처리**: AI/기본 모드 선택 → PDF 파싱 → 구조화된 데이터 추출
3. **변환**: JSON 데이터 → Excel 생성 → 파일 ID 반환
4. **다운로드**: 파일 ID → Excel 다운로드 → 공유/저장

---

## 📁 상세 프로젝트 구조

```
~/Workspace/dev/pdfxcel/
├── 🖥️ app/                          # FastAPI 백엔드
│   ├── main.py                       # 메인 애플리케이션 + CORS + 라우터
│   ├── routers/                      # API 엔드포인트
│   │   ├── upload.py                 # POST /api/upload (PDF 업로드)
│   │   └── download.py               # GET/DELETE /api/download/{file_id}
│   ├── services/                     # 핵심 비즈니스 로직
│   │   ├── pdf_processor.py          # PDF 파싱 (기본/AI 모드)
│   │   ├── claude_integration.py     # Claude API 연동 + 에러 핸들링
│   │   ├── excel_generator.py        # Excel 파일 생성
│   │   └── cleanup.py                # 백그라운드 파일 정리
│   ├── models/schemas.py             # Pydantic 데이터 모델
│   └── utils/                        # 유틸리티
│       ├── file_manager.py           # 임시 파일 관리
│       └── logging_config.py         # 로깅 설정
├── 📱 mobile-app/                   # React Native (Expo) 앱
│   ├── App.tsx                       # 메인 앱 + Navigation 설정
│   ├── app.config.js                 # Expo 설정 (SDK 53, 보안 설정)
│   ├── metro.config.js               # Metro 번들러 설정
│   └── src/
│       ├── screens/                  # 화면 컴포넌트
│       │   ├── HomeScreen.tsx        # 홈 + 사용량 표시
│       │   ├── UploadScreen.tsx      # 파일 선택 + AI 토글
│       │   ├── ResultScreen.tsx      # 변환 완료 + 다운로드
│       │   └── PreviewScreen.tsx     # Excel 미리보기 (테이블)
│       ├── components/               # 재사용 컴포넌트
│       │   ├── UsageCard.tsx         # 플랜별 사용량 카드
│       │   ├── ProgressBar.tsx       # 업로드 진행률
│       │   └── DataTable.tsx         # 데이터 테이블 표시
│       ├── services/                 # API 통신
│       │   ├── apiService.ts         # FastAPI 통신 + 헬스체크
│       │   └── userPlanService.ts    # 구독 관리 (FREE/PRO)
│       ├── constants/config.ts       # API URL + 디자인 토큰
│       ├── types/index.ts            # TypeScript 타입 정의
│       └── utils/                    # 헬퍼 함수
│           ├── fileUtils.ts          # 파일 처리
│           └── subscriptionManager.ts # 구독 로직
├── temp_files/                       # 서버 임시 파일 저장소
├── requirements.txt                   # Python 의존성
├── run.py                            # 서버 실행 스크립트
└── .gitignore                        # Git 제외 파일
```

---

## 🎨 화면 흐름 및 주요 기능

### 1. 📱 HomeScreen
- **역할**: 앱 진입점, 사용량 현황 표시
- **기능**: 
  - FREE/PRO 플랜 구분 표시
  - 일일 업로드 횟수 (3회 제한)
  - AI 사용 횟수 (1회 제한)
  - 변환 시작 버튼

### 2. 📤 UploadScreen  
- **역할**: PDF 파일 업로드 및 처리 옵션 선택
- **기능**:
  - Document Picker로 PDF 선택
  - AI 모드 토글 (Claude vs 기본 파서)
  - 업로드 진행률 표시
  - 사용량 제한 검증

### 3. 📊 ResultScreen
- **역할**: 변환 완료 후 결과 처리
- **기능**:
  - 변환 성공/실패 알림
  - Excel 파일 다운로드
  - 파일 공유 (메신저, 이메일 등)
  - 미리보기 화면 이동

### 4. 🔍 PreviewScreen  
- **역할**: 변환된 Excel 내용 미리보기
- **기능**:
  - JSON 데이터를 테이블로 렌더링
  - 스크롤 가능한 데이터 뷰
  - 다운로드 버튼

---

## 🔗 FastAPI 주요 엔드포인트

### 📤 **POST /api/upload**
```typescript
// 요청
Content-Type: multipart/form-data
{
  file: PDF 파일 (UploadFile)
  use_ai: boolean (Claude AI 사용 여부)
}

// 응답  
{
  file_id: string,
  message: string,
  processing_type: "AI" | "BASIC"
}
```

### 📥 **GET /api/download/{file_id}**
```typescript
// 응답: Excel 파일 스트림
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### 🗑️ **DELETE /api/download/{file_id}**
```typescript
// 응답
{ message: "File deleted successfully" }
```

### 💊 **GET /health**
```typescript
// 응답
{ status: "healthy" }
```

---

## ⚙️ 로컬 개발 환경 설정

### 1. 백엔드 실행
```bash
cd ~/Workspace/dev/pdfxcel

# 가상환경 활성화 (선택사항)
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
export CLAUDE_API_KEY="your_claude_api_key"

# 서버 실행 (방법 1)
python run.py

# 또는 직접 실행 (방법 2)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Cloudflare 터널 실행 (테더링 환경)
```bash
# 터널 생성 (백그라운드)
cloudflared tunnel --url http://localhost:8000 &

# 생성된 URL을 mobile-app/src/constants/config.ts에 업데이트
```

### 3. 모바일 앱 실행
```bash
cd mobile-app

# 의존성 설치
npm install

# Expo 개발 서버 시작
expo start --tunnel

# 실기기에서 Expo Go 앱으로 QR 코드 스캔
```

---

## 💳 구독 시스템 구현

### 플랜별 제한사항
| 플랜 | 일일 업로드 | AI 사용 | 초기화 |
|------|-------------|---------|--------|
| **FREE** | 3회 | 1회 | 매일 자정 |
| **PRO** | 무제한 | 무제한 | - |

### 기술적 구현
- **저장소**: AsyncStorage (로컬)
- **키 구조**: 
  ```typescript
  'user_plan': 'FREE' | 'PRO'
  'usage_stats': {
    date: string,           // YYYY-MM-DD
    uploads: number,        // 오늘 업로드 횟수  
    ai_usage: number       // 오늘 AI 사용 횟수
  }
  ```
- **자동 초기화**: 날짜 변경 시 카운터 리셋

---

## 🔧 주요 개발 특이사항

### 1. **네트워크 설정**
- **iOS ATS 우회**: HTTP 연결 허용 설정
- **Android Cleartext**: HTTP 트래픽 허용
- **Cloudflare 터널**: 테더링 환경 대응

### 2. **파일 관리**
- **임시 저장**: `temp_files/` 디렉토리
- **자동 정리**: 백그라운드 클린업 태스크
- **파일 ID**: UUID 기반 고유 식별자

### 3. **에러 처리**  
- **Claude API**: 재시도 로직, Rate limiting 대응
- **네트워크**: 헬스체크, 상세 로깅
- **파일**: 용량 제한, 형식 검증

---

## 🧪 실제 사용 시나리오

**"은행 명세서 PDF → Excel 변환 후 가계부 정리"**

1. 앱 실행 → 홈화면에서 사용량 확인 (2/3회 남음)
2. "변환 시작" → PDF 파일 선택 (은행 앱에서 다운로드한 명세서)
3. "AI 모드" 켜기 → 업로드 시작 (진행률 표시)
4. 변환 완료 → "다운로드" 버튼 클릭
5. Excel 파일 저장 → 가계부 앱으로 공유

---

## 🚨 문제 해결 가이드

### 자주 발생하는 이슈

1. **Network request failed**
   - Cloudflare 터널 상태 확인
   - config.ts의 baseUrl 업데이트
   - 헬스체크 로그 확인

2. **Claude API 오류**
   - CLAUDE_API_KEY 환경변수 확인
   - API 키 형식 검증 (sk-ant- 시작)
   - Rate limiting 대기

3. **파일 업로드 실패**
   - PDF 파일 형식 확인
   - 파일 크기 제한 검토
   - temp_files 디렉토리 권한 확인

---

## 📈 향후 개발 계획

- [ ] **RevenueCat 결제 연동**: 실제 구독 시스템
- [ ] **Splash Screen 복구**: 앱 로딩 화면 
- [ ] **다양한 문서 지원**: 인보이스, 영수증 등
- [ ] **클라우드 저장**: Google Drive, Dropbox 연동
- [ ] **오프라인 모드**: 기본 파싱 기능

---

**💡 이 문서로 CLI 재시작 시 전체 컨텍스트를 빠르게 복구할 수 있습니다!**