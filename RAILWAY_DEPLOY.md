# Railway 배포 가이드

Railway에 PDFXcel FastAPI 백엔드를 배포하는 방법입니다.

## 🚀 배포 단계

### 1. Railway CLI 설치 및 설정

```bash
# Railway CLI 설치 (Node.js 필요)
npm install -g @railway/cli

# 또는 Homebrew로 설치 (macOS)
brew install railway

# Railway 계정 로그인
railway login
```

### 2. 프로젝트 초기화

```bash
# 백엔드 디렉토리로 이동
cd backend

# Railway 프로젝트 생성
railway init

# 기존 프로젝트와 연결하려면
railway link [PROJECT_ID]
```

### 3. 환경변수 설정

Railway 대시보드 또는 CLI로 다음 환경변수들을 설정하세요:

#### 필수 환경변수:
```bash
# Anthropic Claude AI API 키 (필수!)
railway variables set ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# 애플리케이션 설정
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set DEBUG=false

# 파일 업로드 설정
railway variables set MAX_FILE_SIZE=10485760
railway variables set ALLOWED_EXTENSIONS=pdf

# 정리 작업 설정  
railway variables set CLEANUP_INTERVAL_HOURS=24
railway variables set CLEANUP_AGE_HOURS=48
```

#### 선택적 환경변수:
```bash
# CORS 설정 (필요시)
railway variables set ALLOWED_ORIGINS="https://your-flutter-app-domain.com,https://another-domain.com"

# Redis URL (성능 향상을 위해 나중에 추가 가능)
railway variables set REDIS_URL="redis://redis-service-url"
```

### 4. 배포 실행

```bash
# 현재 코드 배포
railway up

# 또는 자동 배포 설정 (GitHub 연결 시)
railway connect [GITHUB_REPO_URL]
```

### 5. 배포 확인

```bash
# 배포 상태 확인
railway status

# 로그 확인
railway logs

# 서비스 URL 확인
railway domain
```

## 🔧 배포 후 설정

### 1. 도메인 설정

```bash
# Railway에서 제공하는 도메인 확인
railway domain

# 커스텀 도메인 추가 (선택사항)
railway domain add your-domain.com
```

### 2. Flutter 앱에서 API URL 변경

`lib/services/api_service.dart`에서 API 기본 URL을 Railway 도메인으로 변경:

```dart
// 예시: Railway에서 제공하는 URL
static const String _baseUrl = 'https://your-project-name-production.up.railway.app/api';
```

### 3. API 테스트

```bash
# Health check
curl https://your-project-name-production.up.railway.app/health

# API 정보 확인
curl https://your-project-name-production.up.railway.app/api

# API 문서 확인
open https://your-project-name-production.up.railway.app/docs
```

## 📊 모니터링

### Railway 대시보드에서 확인할 수 있는 정보:

- **메트릭스**: CPU, 메모리, 네트워크 사용량
- **로그**: 실시간 애플리케이션 로그
- **배포 히스토리**: 이전 배포 버전들
- **환경변수**: 설정된 모든 환경변수
- **도메인**: 연결된 도메인 정보

### CLI로 모니터링:

```bash
# 실시간 로그 보기
railway logs --follow

# 서비스 상태 확인
railway status

# 환경변수 확인
railway variables
```

## 🛠️ 문제해결

### 1. 일반적인 오류들

#### "Module not found" 에러:
```bash
# requirements.txt 확인
railway logs | grep "ModuleNotFoundError"

# 의존성 재설치
railway redeploy
```

#### "Port already in use" 에러:
- Railway는 자동으로 PORT 환경변수를 설정합니다
- main.py에서 `os.environ.get("PORT", 8000)`를 사용하고 있는지 확인

#### API 키 관련 에러:
```bash
# 환경변수 확인
railway variables get ANTHROPIC_API_KEY

# 키가 없다면 설정
railway variables set ANTHROPIC_API_KEY=your-actual-key
```

### 2. 성능 최적화

```bash
# 더 높은 플랜으로 업그레이드 (필요시)
# Railway 대시보드에서 플랜 변경

# 로그 레벨 조정
railway variables set LOG_LEVEL=WARNING
```

### 3. 백업 및 복구

```bash
# 환경변수 백업
railway variables > railway_vars_backup.txt

# 롤백 (이전 버전으로 복구)
railway rollback
```

## 📝 배포 체크리스트

- [ ] Railway CLI 설치 및 로그인
- [ ] 프로젝트 초기화 (`railway init`)
- [ ] **ANTHROPIC_API_KEY 환경변수 설정** (가장 중요!)
- [ ] 기타 필수 환경변수 설정
- [ ] 코드 배포 (`railway up`)
- [ ] Health check API 테스트
- [ ] API 문서 확인 (/docs)
- [ ] Flutter 앱에서 API URL 업데이트
- [ ] 전체 기능 테스트 (PDF 업로드 → 변환 → 다운로드)

## 🎯 추가 팁

1. **개발/프로덕션 분리**: 별도의 Railway 프로젝트로 staging 환경 구축
2. **모니터링 설정**: Railway의 알림 기능 활용
3. **비용 관리**: 사용량 모니터링 및 한도 설정
4. **보안**: 환경변수로 민감한 정보 관리, CORS 설정

Railway 배포에 문제가 있으면 `railway logs`를 확인하거나 Railway 지원팀에 문의하세요!