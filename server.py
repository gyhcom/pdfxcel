#!/usr/bin/env python3
"""
Simple Railway.app entry point for FastAPI
"""
import os
import uvicorn

if __name__ == "__main__":
    print("✅ server.py 시작됨")
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )