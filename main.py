"""
Railway.app 배포용 메인 진입점
"""
import uvicorn
import os
from app.main import app

# Railway에서 자동으로 PORT 환경변수를 제공
PORT = int(os.environ.get("PORT", 8000))

print(f"🚀 Starting server on 0.0.0.0:{PORT}")
print(f"📊 Environment PORT: {os.environ.get('PORT', 'Not set')}")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0", 
        port=PORT,
        log_level="info",
        access_log=True
    )