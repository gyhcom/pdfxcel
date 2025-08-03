"""
파일 검증 유틸리티
"""
import os
import magic
from typing import Optional
import logging

from exceptions.file_exceptions import FileSizeExceedException, InvalidFileTypeException, FileValidationError

logger = logging.getLogger(__name__)

class FileValidator:
    """파일 검증 클래스"""
    
    # 파일 크기 제한 (바이트)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # 허용된 파일 확장자
    ALLOWED_EXTENSIONS = ['.pdf']
    
    # 허용된 MIME 타입
    ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/x-pdf',
        'application/acrobat',
        'applications/vnd.pdf',
        'text/pdf',
        'text/x-pdf'
    ]
    
    @classmethod
    def validate_file_size(cls, file_content: bytes, filename: str = "") -> None:
        """파일 크기 검증"""
        file_size = len(file_content)
        
        logger.info(f"📏 Validating file size: {filename} ({file_size / (1024 * 1024):.1f}MB)")
        
        if file_size > cls.MAX_FILE_SIZE:
            raise FileSizeExceedException(
                file_size=file_size,
                max_size=cls.MAX_FILE_SIZE,
                filename=filename
            )
        
        if file_size == 0:
            raise FileValidationError("파일이 비어있습니다.", filename)
            
        logger.info(f"✅ File size validation passed: {filename}")
    
    @classmethod
    def validate_file_extension(cls, filename: str) -> None:
        """파일 확장자 검증"""
        if not filename:
            raise FileValidationError("파일명이 제공되지 않았습니다.")
        
        file_ext = os.path.splitext(filename.lower())[1]
        
        logger.info(f"📄 Validating file extension: {filename} ({file_ext})")
        
        if file_ext not in cls.ALLOWED_EXTENSIONS:
            raise InvalidFileTypeException(filename, cls.ALLOWED_EXTENSIONS)
            
        logger.info(f"✅ File extension validation passed: {filename}")
    
    @classmethod  
    def validate_file_content(cls, file_content: bytes, filename: str = "") -> None:
        """파일 내용 검증 (MIME 타입 체크)"""
        try:
            # libmagic을 사용하여 실제 파일 타입 확인
            mime = magic.from_buffer(file_content, mime=True)
            
            logger.info(f"🔍 Detected MIME type: {filename} -> {mime}")
            
            if mime not in cls.ALLOWED_MIME_TYPES:
                raise FileValidationError(
                    f"실제 파일 형식이 PDF가 아닙니다. (감지된 형식: {mime})",
                    filename
                )
                
            logger.info(f"✅ File content validation passed: {filename}")
            
        except magic.MagicException as e:
            logger.warning(f"⚠️ Could not detect MIME type for {filename}: {e}")
            # MIME 타입 검증 실패 시 기본적인 PDF 헤더 체크
            cls._validate_pdf_header(file_content, filename)
    
    @classmethod
    def _validate_pdf_header(cls, file_content: bytes, filename: str = "") -> None:
        """PDF 파일 헤더 검증"""
        if not file_content.startswith(b'%PDF-'):
            raise FileValidationError(
                "올바른 PDF 파일이 아닙니다. (PDF 헤더가 없음)",
                filename
            )
        logger.info(f"✅ PDF header validation passed: {filename}")
    
    @classmethod
    def validate_file(cls, file_content: bytes, filename: str = "") -> None:
        """전체 파일 검증 (크기, 확장자, 내용)"""
        logger.info(f"🔍 Starting file validation: {filename}")
        
        # 1. 파일 크기 검증
        cls.validate_file_size(file_content, filename)
        
        # 2. 파일 확장자 검증
        if filename:
            cls.validate_file_extension(filename)
        
        # 3. 파일 내용 검증
        cls.validate_file_content(file_content, filename)
        
        logger.info(f"✅ Complete file validation passed: {filename}")
    
    @classmethod
    def get_file_info(cls, file_content: bytes, filename: str = "") -> dict:
        """파일 정보 반환"""
        file_size = len(file_content)
        
        return {
            "filename": filename,
            "size_bytes": file_size,
            "size_mb": round(file_size / (1024 * 1024), 2),
            "max_size_mb": cls.MAX_FILE_SIZE // (1024 * 1024),
            "extension": os.path.splitext(filename.lower())[1] if filename else "",
            "is_valid_size": file_size <= cls.MAX_FILE_SIZE,
            "is_valid_extension": os.path.splitext(filename.lower())[1] in cls.ALLOWED_EXTENSIONS if filename else False
        }