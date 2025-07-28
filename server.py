#!/usr/bin/env python3
"""
Simple Railway.app entry point for FastAPI
"""
import os
import sys
import uvicorn

# 디버깅 정보 출력
print("🚀 Railway deployment starting...")
print(f"📁 Working directory: {os.getcwd()}")
print(f"🐍 Python executable: {sys.executable}")
print(f"📦 Python path: {sys.path[:3]}")

# 현재 디렉토리를 Python path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("✅ server.py 시작됨")
    port = int(os.environ.get("PORT", 8000))
    print(f"🌐 Starting server on 0.0.0.0:{port}")
    
    try:
        # FastAPI 앱이 제대로 import되는지 확인
        from app.main import app
        print("✅ FastAPI app import 성공")
        
        uvicorn.run(
            app,  # 직접 app 객체 전달
            host="0.0.0.0",
            port=port,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"❌ 서버 시작 실패: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    )