#!/bin/bash

# Railway 백엔드 배포 스크립트
echo "🚀 Railway 백엔드 배포 시작..."

# backend 디렉토리로 이동
cd backend || exit 1

# Railway CLI 설치 확인
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI가 설치되지 않았습니다."
    echo "설치 명령어: npm install -g @railway/cli"
    exit 1
fi

# Railway 로그인 확인
if ! railway whoami &> /dev/null; then
    echo "⚠️  Railway 로그인이 필요합니다."
    railway login
fi

# 기존 프로젝트 연결 또는 새로 생성
echo "📋 Railway 프로젝트 설정..."
if [ ! -f ".railway/config.json" ]; then
    echo "🔗 기존 프로젝트와 연결하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eS]|[yY])$ ]]; then
        railway projects
        echo "프로젝트 ID를 입력하세요:"
        read -r project_id
        railway link "$project_id"
    else
        railway init
    fi
fi

# 환경변수 설정 확인
echo "🔑 환경변수 확인 중..."
if ! railway variables get ANTHROPIC_API_KEY > /dev/null 2>&1; then
    echo "⚠️  ANTHROPIC_API_KEY가 설정되지 않았습니다."
    echo "API 키를 입력하세요:"
    read -r -s api_key
    railway variables set ANTHROPIC_API_KEY="$api_key"
fi

# 배포 실행
echo "🚀 배포 시작..."
railway up

# 배포 상태 확인
echo "📊 배포 상태 확인..."
railway status

echo "✅ 배포 완료!"
echo "🌐 도메인: $(railway domain)"
echo "📝 로그: railway logs"