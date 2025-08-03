#!/usr/bin/env python3
"""
개발용 서버 실행 스크립트
"""
import uvicorn
import os
import sys
from pathlib import Path

# 현재 디렉토리를 Python path에 추가
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# 환경변수 로드
from dotenv import load_dotenv
load_dotenv()

PORT = int(os.environ.get("PORT", 8000))
DEBUG = os.environ.get("DEBUG", "True").lower() == "true"

print(f"🚀 Starting PDFXcel development server")
print(f"📍 Server: http://localhost:{PORT}")
print(f"📖 API Docs: http://localhost:{PORT}/docs")
print(f"🔧 Debug mode: {DEBUG}")

if __name__ == "__main__":
    try:
        uvicorn.run(
            "app_main:app",
            host="0.0.0.0",
            port=PORT,
            reload=DEBUG,
            log_level="debug" if DEBUG else "info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n👋 서버를 종료합니다.")
    except Exception as e:
        print(f"❌ 서버 시작 실패: {e}")
        sys.exit(1)