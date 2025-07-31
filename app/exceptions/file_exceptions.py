"""
파일 관련 예외 처리 모듈
"""
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class FileException(HTTPException):
    """파일 처리 관련 기본 예외"""
    pass

class FileSizeExceedException(FileException):
    """파일 크기 초과 예외"""
    def __init__(self, file_size: int, max_size: int, filename: str = ""):
        self.file_size = file_size
        self.max_size = max_size
        self.filename = filename
        
        # 파일 크기를 읽기 쉬운 형태로 변환
        file_size_mb = file_size / (1024 * 1024)
        max_size_mb = max_size / (1024 * 1024)
        
        message = f"파일 크기가 제한을 초과했습니다. (업로드: {file_size_mb:.1f}MB, 최대: {max_size_mb:.0f}MB)"
        if filename:
            message = f"'{filename}' " + message
            
        logger.warning(f"🚫 File size exceeded: {filename} - {file_size_mb:.1f}MB > {max_size_mb:.0f}MB")
        
        super().__init__(
            status_code=413,
            detail={
                "error": "FILE_SIZE_EXCEEDED",
                "message": message,
                "file_size_bytes": file_size,
                "max_size_bytes": max_size,
                "file_size_mb": round(file_size_mb, 1),
                "max_size_mb": int(max_size_mb),
                "filename": filename
            }
        )

class InvalidFileTypeException(FileException):
    """잘못된 파일 형식 예외"""
    def __init__(self, filename: str, allowed_types: list = None):
        self.filename = filename
        self.allowed_types = allowed_types or [".pdf"]
        
        message = f"지원하지 않는 파일 형식입니다. PDF 파일만 업로드 가능합니다."
        if filename:
            message = f"'{filename}' 파일: " + message
            
        logger.warning(f"🚫 Invalid file type: {filename}")
        
        super().__init__(
            status_code=400,
            detail={
                "error": "INVALID_FILE_TYPE",
                "message": message,
                "filename": filename,
                "allowed_types": self.allowed_types
            }
        )

class FileValidationError(FileException):
    """파일 검증 오류"""
    def __init__(self, message: str, filename: str = ""):
        self.filename = filename
        
        if filename:
            message = f"'{filename}' 파일: " + message
            
        logger.warning(f"🚫 File validation error: {filename} - {message}")
        
        super().__init__(
            status_code=400,
            detail={
                "error": "FILE_VALIDATION_ERROR", 
                "message": message,
                "filename": filename
            }
        )

def format_file_size(size_bytes: int) -> str:
    """파일 크기를 읽기 쉬운 형태로 변환"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"