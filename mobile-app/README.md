# PDFXcel Mobile App 📱

AI 기반 PDF 은행 명세서를 Excel로 변환하는 프리미엄 React Native 모바일 앱입니다.

## 🎯 주요 기능

### 🤖 AI 전용 변환 시스템
- **AI 지능형 분석**: Claude AI를 사용한 정확한 데이터 추출 (기본 파서 제거)
- **스마트 인식**: 복잡한 표 구조와 다양한 포맷 자동 인식
- **데이터 검증**: AI 기반 자동 데이터 정확성 검증
- **완벽한 Excel 변환**: 구조화된 Excel 파일로 즉시 변환

### 💎 프리미엄 구독 시스템
- **FREE 플랜**: 하루 1회 리워드 광고 시청 후 AI 변환 가능
- **PRO 플랜**: 무제한 AI 변환 + 2배 빠른 처리 + 광고 없음 + 클라우드 저장
- **스마트 유도**: 사용량 기반 자연스러운 구독 유도 시스템
- **할인 혜택**: 첫 달 50% 할인 (₩9,900 → ₩4,900)

### 🎨 모던 UI/UX
- **카드 기반 디자인**: 타일 그리드, 플레이트 카드, 가로 카드 레이아웃
- **클릭 애니메이션**: 터치 피드백과 스케일 애니메이션
- **다크모드 지원**: 시스템 설정에 따른 자동 테마 변경
- **미니멀 디자인**: 깔끔하고 직관적인 사용자 인터페이스

### 📊 실시간 사용량 관리
- **AI 변환 상태**: 실시간 사용 가능 여부 표시
- **타이머 시스템**: 다음 무료 변환까지 남은 시간 표시
- **진행률 표시**: 변환 과정 실시간 모니터링
- **사용량 통계**: 간결한 사용량 정보 카드

## 📱 화면 구성

### 1. 홈 화면 (HomeScreen)
- **헤더**: 앱 타이틀과 간단한 설명
- **주요 기능 카드**: AI PDF 변환, 변환 기록, 프리미엄 변환, Excel 내보내기
- **빠른 액션**: 빠른 변환, 광고 제거, 도움말
- **사용량 카드**: AI 변환 상태와 처리 속도 정보
- **개발자 도구**: 플랜 토글, AI 상태 리셋 (개발 모드)

### 2. 업로드 화면 (UploadScreen)
- **파일 선택**: PDF 파일 선택 (Document Picker)
- **AI 변환 설정**: AI 분석 옵션 (항상 활성화)
- **업로드 진행률**: 실시간 파일 업로드 상태
- **실시간 처리**: WebSocket 기반 변환 진행률
- **에러 처리**: 파일 크기 제한 및 네트워크 오류 처리

### 3. 미리보기 화면 (PreviewScreen)
- **데이터 검증**: 변환된 데이터 미리보기
- **테이블 형태**: 구조화된 데이터 표시
- **수정 가능**: 필요시 데이터 편집 기능
- **Excel 내보내기**: 최종 파일 생성

### 4. 결과 화면 (ResultScreen)
- **변환 완료**: 성공/실패 상태 표시
- **파일 다운로드**: Excel 파일 다운로드
- **파일 관리**: 공유, 저장, 삭제 기능
- **새 변환**: 추가 변환 시작

### 5. 기록 화면 (HistoryScreen)
- **변환 기록**: 이전 변환 파일들 목록
- **파일 관리**: 재다운로드, 공유, 삭제
- **검색 기능**: 파일명 기반 검색
- **날짜별 정렬**: 최신순 정렬

## 🛠️ 기술 스택

### 📱 프론트엔드
- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Navigation**: React Navigation v6 (Stack Navigator)
- **Language**: TypeScript 5.1.3
- **Styling**: StyleSheet (Native) + LinearGradient
- **Icons**: Expo Vector Icons (Ionicons)
- **Animation**: React Native Animated API
- **State Management**: React Hooks + Context API

### 🔧 핵심 라이브러리
- **File Handling**: expo-document-picker, expo-file-system
- **Sharing**: expo-sharing, expo-media-library
- **Storage**: @react-native-async-storage/async-storage
- **Network**: fetch API with timeout handling
- **UI Components**: Custom components with TouchableOpacity
- **Gradients**: expo-linear-gradient
- **Safe Area**: react-native-safe-area-context

### 🏗️ 아키텍처
- **서비스 레이어**: API 통신, AI 상태 관리
- **컴포넌트 구조**: 재사용 가능한 모던 카드 시스템
- **상태 관리**: Local Storage + React State
- **에러 처리**: Try-catch + 사용자 친화적 알림
- **성능 최적화**: React.memo, useMemo, useCallback

## 💰 수익화 시스템

### 🎯 리워드 광고 시스템
- **Google AdMob 연동 준비**: 하루 1회 리워드 광고
- **광고 시청 플로우**: 매력적인 광고 프롬프트 + AI 혜택 미리보기
- **광고 시뮬레이션**: 개발용 2초 로딩 시뮬레이션
- **광고 남용 방지**: 하루 1회 제한으로 남용 방지

### 💎 PRO 구독 유도
- **컨텍스트 기반 유도**: 사용량 한계, 기능 잠금, 속도 부스트, 광고 제거
- **매력적인 프롬프트**: 상황별 맞춤 메시지 + 시각적 혜택 표시
- **할인 마케팅**: 첫 달 50% 할인 + HOT 배지 + 스트라이크 가격
- **부드러운 거절**: "나중에 하기" 옵션으로 부담 최소화

### 📊 사용량 관리
- **일일 제한 시스템**: FREE 사용자 하루 1회 AI 변환
- **실시간 타이머**: 다음 무료 변환까지 카운트다운
- **자동 초기화**: 매일 자정 사용량 자동 리셋
- **PRO 무제한**: PRO 사용자 모든 제한 해제

### 🎨 구독 프롬프트 종류
1. **사용량 한계**: "오늘의 변환 횟수를 모두 사용했어요"
2. **기능 잠금**: "AI 분석은 PRO 전용 기능이에요"
3. **속도 부스트**: "더 빠른 변환이 필요하신가요?"
4. **광고 제거**: "광고 없이 깔끔하게 사용하세요"

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
cd mobile-app
npm install
```

### 2. iOS 추가 설정
```bash
cd ios
pod install
cd ..
```

### 3. 백엔드 서버 실행
```bash
cd ..  # 루트 디렉토리로
python run.py
```

### 4. 모바일 앱 실행
```bash
# 개발 서버 시작
npm start

# iOS 시뮬레이터 (권장)
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저 (테스트용)
npm run web
```

## ⚙️ 환경 설정

### API 서버 주소 설정
`src/constants/config.ts`:
```typescript
export const API_CONFIG: ApiConfig = {
  baseUrl: __DEV__ 
    ? 'https://pdfxcel.railway.app/api'  // 개발 환경 - Railway
    : 'https://pdfxcel.railway.app/api',  // 프로덕션 환경
  timeout: 30000,
};
```

### iOS 배포 설정
- **최소 버전**: iOS 15.1+ (React Native 0.79.5 요구사항)
- **AppDelegate**: 표준 RN 패턴으로 구현
- **Podfile**: 배포 대상 15.1로 설정
- **Hermes**: JavaScript 엔진 최적화 활성화

## 📁 프로젝트 구조

```
mobile-app/
├── App.tsx                     # 메인 앱 + 네비게이션
├── src/
│   ├── components/             # 재사용 컴포넌트
│   │   ├── ModernCard.tsx      # 모던 카드 시스템
│   │   ├── UsageCard.tsx       # 사용량 표시 카드
│   │   ├── SubscriptionPrompt.tsx    # 구독 유도 모달
│   │   ├── RewardedAdPrompt.tsx      # 리워드 광고 모달
│   │   └── DailyLimitReached.tsx     # 일일 한계 모달
│   ├── screens/               # 화면 컴포넌트
│   │   ├── HomeScreen.tsx     # 홈 화면 (AI 전용 플로우)
│   │   ├── UploadScreen.tsx   # 업로드 화면
│   │   ├── PreviewScreen.tsx  # 미리보기 화면
│   │   ├── ResultScreen.tsx   # 결과 화면
│   │   └── HistoryScreen.tsx  # 기록 화면
│   ├── services/              # 서비스 레이어
│   │   ├── apiService.ts      # API 통신
│   │   ├── userPlanService.ts # 구독 관리
│   │   └── aiOnlyService.ts   # AI 전용 상태 관리
│   ├── types/                 # TypeScript 타입
│   │   └── index.ts
│   └── constants/             # 설정 상수
│       └── config.ts          # API, 색상, 스타일
├── ios/                       # iOS 네이티브 코드
│   ├── PDFXcel/
│   │   └── AppDelegate.swift  # iOS 앱 초기화
│   └── Podfile               # CocoaPods 의존성
├── assets/                   # 이미지, 아이콘
├── package.json             # NPM 의존성
└── app.json                # Expo 설정
```

## 🎨 UI/UX 디자인 시스템

### 색상 팔레트
```typescript
export const COLORS = {
  primary: '#4CAF50',      // 메인 그린
  primaryDark: '#45a049',  // 다크 그린
  secondary: '#2196F3',    // 블루
  background: '#f5f5f5',   // 배경 그레이
  surface: '#ffffff',      // 카드 배경
  text: '#333333',         // 메인 텍스트
  textSecondary: '#666666', // 보조 텍스트
  border: '#e0e0e0',       // 보더
  error: '#f44336',        // 에러 레드
  warning: '#ff9800',      // 경고 오렌지
  success: '#4caf50',      // 성공 그린
};
```

### 카드 시스템
- **타일 카드**: 2x2 그리드 메인 기능
- **플레이트 카드**: 3열 작은 빠른 액션
- **가로 카드**: 전체 너비 리스트 아이템
- **사용량 카드**: 미니멀 통계 표시

### 애니메이션
- **터치 피드백**: 스케일 0.95로 축소
- **스프링 애니메이션**: friction 3으로 자연스러운 반동
- **모달 전환**: slide 애니메이션
- **로딩 상태**: ActivityIndicator + 텍스트

## 🚀 배포 및 출시

### iOS App Store 준비
- ✅ **앱 기능**: AI PDF 변환 완료
- ✅ **구독 시스템**: 리워드 광고 + PRO 구독
- ✅ **UI/UX**: 모던 디자인 완료
- 🔄 **메타데이터**: 앱 설명, 키워드, 스크린샷 준비 중
- 🔄 **아이콘**: 앱 아이콘 디자인 및 적용
- 🔄 **인앱 결제**: Apple/Google 결제 시스템 연동

### 성능 최적화
- **메모리 관리**: 이미지 LazyLoading + 메모리 정리
- **API 캐싱**: 중복 요청 방지 + 응답 캐싱
- **컴포넌트 최적화**: React.memo + useMemo + useCallback
- **번들 최적화**: Hermes 엔진 + 트리 쉐이킹

### 에러 모니터링
- **크래시 리포팅**: try-catch + 사용자 알림
- **네트워크 오류**: 타임아웃 + 재시도 로직
- **파일 처리**: 크기 제한 + 형식 검증
- **사용자 피드백**: 인앱 피드백 모달

## 📊 개발 현황

### ✅ 완료된 기능
- [x] AI 전용 PDF 변환 플로우
- [x] 리워드 광고 시스템
- [x] PRO 구독 유도 시스템
- [x] 모던 카드 기반 UI
- [x] 사용량 관리 시스템
- [x] iOS 빌드 및 실행 완료
- [x] 실시간 변환 진행률 표시
- [x] 파일 공유 및 저장 기능
- [x] 사용자 피드백 시스템

### 🔄 진행 중
- [ ] iOS App Store 출시 준비
- [ ] 인앱 결제 시스템 연동
- [ ] 앱 아이콘 및 스크린샷 제작
- [ ] App Store 메타데이터 작성

### 📋 예정 사항
- [ ] 오프라인 지원
- [ ] 사용자 온보딩 튜토리얼
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 클라우드 저장소 연동
- [ ] 대량 처리 기능 (PRO)

## 🔧 개발자 도구

### 개발 모드 기능
- **플랜 토글**: FREE ↔ PRO 플랜 전환
- **AI 상태 리셋**: 일일 사용량 초기화
- **로그 모니터링**: 상세한 개발 로그
- **API 테스트**: 백엔드 서버 연결 테스트

### 디버깅 도구
```bash
# React Native Debugger
npm install -g react-native-debugger

# Flipper (권장)
npm install -g flipper

# Metro 번들러 리셋
npm start --reset-cache
```

## 📄 라이선스 및 저작권

**Private Project - All Rights Reserved**

본 프로젝트는 PDF 파일을 Excel로 변환하는 상용 모바일 애플리케이션입니다.

### 사용된 주요 기술
- **AI 엔진**: Claude AI (Anthropic)
- **프레임워크**: React Native with Expo
- **백엔드**: FastAPI + Railway 배포
- **결제**: Apple App Store + Google Play 인앱 결제

---

## 📞 연락처

개발 관련 문의나 버그 리포트는 GitHub Issues를 통해 제출해 주세요.

**Made with ❤️ for efficient PDF to Excel conversion**

🚀 **현재 상태**: iOS 출시 준비 완료, 구독 시스템 구현 완료
💎 **수익화**: 리워드 광고 + PRO 구독 (첫 달 50% 할인)
🎯 **목표**: 2024년 Q1 iOS App Store 출시