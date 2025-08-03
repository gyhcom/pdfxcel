import asyncio
import os
import time
import logging
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


async def cleanup_temp_files() -> None:
    """
    임시 파일들을 주기적으로 정리하는 백그라운드 작업
    
    - 대상 디렉토리: ./generated/, ./tmp/, ./temp_files/
    - 30분 이상 지난 파일들을 삭제
    - 1시간마다 실행
    """
    cleanup_directories = [
        "./generated",
        "./tmp", 
        "./temp_files"
    ]
    
    # 30분 = 1800초
    max_age_seconds = 30 * 60
    
    logger.info("Starting background cleanup task for temporary files")
    
    while True:
        try:
            current_time = time.time()
            total_deleted = 0
            deleted_files: List[str] = []
            
            for directory in cleanup_directories:
                directory_path = Path(directory)
                
                # 디렉토리가 존재하지 않으면 건너뛰기
                if not directory_path.exists():
                    logger.debug(f"Directory {directory} does not exist, skipping")
                    continue
                
                # 디렉토리 내 모든 파일 검사
                try:
                    for file_path in directory_path.rglob("*"):
                        # 파일인지 확인 (디렉토리 제외)
                        if not file_path.is_file():
                            continue
                        
                        try:
                            # 파일 수정 시간 확인
                            file_mtime = file_path.stat().st_mtime
                            age_seconds = current_time - file_mtime
                            
                            # 30분 이상 지난 파일 삭제
                            if age_seconds > max_age_seconds:
                                file_path.unlink()  # 파일 삭제
                                deleted_files.append(str(file_path))
                                total_deleted += 1
                                logger.debug(f"Deleted expired file: {file_path}")
                                
                        except OSError as e:
                            logger.warning(f"Failed to delete file {file_path}: {e}")
                            continue
                            
                except PermissionError as e:
                    logger.warning(f"Permission denied accessing directory {directory}: {e}")
                    continue
                except OSError as e:
                    logger.warning(f"Error accessing directory {directory}: {e}")
                    continue
            
            # 정리 결과 로깅
            if total_deleted > 0:
                logger.info(f"Cleanup completed: {total_deleted} files deleted")
                for deleted_file in deleted_files:
                    logger.info(f"  - Deleted: {deleted_file}")
            else:
                logger.info("Cleanup completed: No files to delete")
                
        except Exception as e:
            logger.error(f"Unexpected error during cleanup task: {e}")
        
        # 1시간 대기 (3600초)
        logger.debug("Cleanup task sleeping for 1 hour")
        await asyncio.sleep(3600)


async def cleanup_specific_file(file_path: str) -> bool:
    """
    특정 파일을 즉시 삭제하는 함수
    
    Args:
        file_path: 삭제할 파일 경로
        
    Returns:
        bool: 삭제 성공 여부
    """
    try:
        path = Path(file_path)
        if path.exists() and path.is_file():
            path.unlink()
            logger.info(f"Successfully deleted file: {file_path}")
            return True
        else:
            logger.warning(f"File not found or not a file: {file_path}")
            return False
            
    except OSError as e:
        logger.error(f"Failed to delete file {file_path}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error deleting file {file_path}: {e}")
        return False


def ensure_cleanup_directories():
    """
    정리 대상 디렉토리들이 존재하는지 확인하고, 없으면 생성
    """
    cleanup_directories = [
        "./generated",
        "./tmp", 
        "./temp_files"
    ]
    
    for directory in cleanup_directories:
        directory_path = Path(directory)
        try:
            directory_path.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Ensured directory exists: {directory}")
        except OSError as e:
            logger.warning(f"Failed to create directory {directory}: {e}")