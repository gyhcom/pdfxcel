import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, download
from app.utils.logging_config import setup_logging
from app.services.cleanup import cleanup_temp_files, ensure_cleanup_directories

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

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(download.router, prefix="/api", tags=["download"])

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
    # 정리 대상 디렉토리 생성
    ensure_cleanup_directories()
    
    # 백그라운드 정리 작업 시작
    asyncio.create_task(cleanup_temp_files())