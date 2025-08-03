#!/bin/bash

echo "🚀 PDFXcel 백엔드 서버 시작"

# 백엔드 디렉토리로 이동
cd backend

# 가상환경이 있는지 확인
if [ ! -d "venv" ]; then
    echo "📦 Python 가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
echo "🔧 가상환경 활성화..."
source venv/bin/activate

# 의존성 설치
echo "📋 의존성 설치 중..."
pip install -r requirements.txt

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 참고하여 .env 파일을 생성해주세요."
    echo "📋 특히 ANTHROPIC_API_KEY를 설정해야 합니다."
fi

# 서버 시작
echo "🌟 개발 서버 시작..."
echo "📍 서버 주소: http://localhost:8000"
echo "📖 API 문서: http://localhost:8000/docs"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

python3 run_dev.py