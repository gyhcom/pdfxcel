#!/usr/bin/env python3
"""
Railway.app 배포용 메인 진입점
"""
import uvicorn
import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Railway에서 자동으로 PORT 환경변수를 제공
PORT = int(os.environ.get("PORT", 8000))

print(f"🚀 Starting PDFxcel server on 0.0.0.0:{PORT}")
print(f"📊 Environment PORT: {os.environ.get('PORT', 'Not set')}")
print(f"📁 Working directory: {os.getcwd()}")
print(f"🐍 Python path: {sys.path[:3]}")

try:
    from app.main import app
    print("✅ Successfully imported FastAPI app")
    
    if __name__ == "__main__":
        uvicorn.run(
            app,  # Use the app directly instead of string import
            host="0.0.0.0", 
            port=PORT,
            log_level="info",
            access_log=True
        )
except Exception as e:
    print(f"❌ Error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)