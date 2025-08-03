import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from utils.logging_config import setup_logging

# 안전한 import - Railway 환경에서 실패할 수 있는 모듈들
try:
    from routers import upload, download, websocket, history
    from services.cleanup import cleanup_temp_files, ensure_cleanup_directories
    ROUTERS_AVAILABLE = True
    print("✅ 모든 라우터 import 성공")
except Exception as e:
    import traceback
    print(f"⚠️ 라우터 import 실패: {e}")
    print(f"상세 에러: {traceback.format_exc()}")
    ROUTERS_AVAILABLE = False

# 로깅 설정
setup_logging(level="INFO")

app = FastAPI(
    title="PDF to Excel Converter",
    description="API for converting PDF bank statements to Excel files",
    version="1.0.0",
    docs_url="/docs",  # 명시적으로 활성화
    redoc_url="/redoc"  # 명시적으로 활성화
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록 - import가 성공한 경우만
if ROUTERS_AVAILABLE:
    app.include_router(upload.router, prefix="/api", tags=["upload"])
    app.include_router(download.router, prefix="/api", tags=["download"])
    app.include_router(websocket.router, prefix="/api", tags=["websocket"])
    app.include_router(history.router, prefix="/api", tags=["history"])
    print("✅ 라우터 등록 완료")
else:
    print("⚠️ 라우터를 사용할 수 없음")

@app.get("/")
async def root():
    return {"message": "PDF to Excel Converter API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api")
async def api_info():
    return {
        "message": "PDFxcel API Server",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/upload",
            "download": "/api/download/{file_id}",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행되는 이벤트"""
    print("🚀 FastAPI 애플리케이션 시작")
    
    if ROUTERS_AVAILABLE:
        try:
            # 정리 대상 디렉토리 생성
            ensure_cleanup_directories()
            
            # 백그라운드 정리 작업 시작
            asyncio.create_task(cleanup_temp_files())
            
            # 히스토리 서비스 정리 작업 시작
            from services.history_service import history_service
            await history_service.start_cleanup_task()
            
            print("✅ 백그라운드 서비스 시작 완료")
        except Exception as e:
            print(f"⚠️ 백그라운드 서비스 시작 실패: {e}")
    else:
        print("⚠️ 백그라운드 서비스를 사용할 수 없음")