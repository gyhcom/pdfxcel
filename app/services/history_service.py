"""
파일 히스토리 서비스
사용자별 변환 기록 관리 (세션 기반)
"""
import json
import os
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class FileHistoryItem(BaseModel):
    file_id: str
    original_filename: str
    converted_filename: str
    upload_time: datetime
    status: str  # "completed", "processing", "failed", "cancelled"
    file_size: Optional[int] = None
    processing_type: str = "basic"  # "ai" or "basic"
    excel_path: Optional[str] = None

class UserSession(BaseModel):
    session_id: str
    files: List[FileHistoryItem] = []
    created_at: datetime
    last_accessed: datetime

class HistoryService:
    def __init__(self):
        # 인메모리 저장소 (Redis 대신 개발용)
        self.sessions: Dict[str, UserSession] = {}
        self.session_ttl = timedelta(days=7)  # 7일간 유지
        self.max_files_per_session = 50  # 세션당 최대 50개 파일
        
        # 주기적으로 만료된 세션 정리
        asyncio.create_task(self._cleanup_expired_sessions())
    
    async def create_session(self, session_id: str) -> UserSession:
        """새 세션 생성"""
        session = UserSession(
            session_id=session_id,
            files=[],
            created_at=datetime.now(),
            last_accessed=datetime.now()
        )
        
        self.sessions[session_id] = session
        logger.info(f"📝 New session created: {session_id}")
        return session
    
    async def get_session(self, session_id: str) -> Optional[UserSession]:
        """세션 조회"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        # 만료 확인
        if datetime.now() - session.last_accessed > self.session_ttl:
            await self._cleanup_session(session_id)
            return None
        
        # 마지막 접근 시간 업데이트
        session.last_accessed = datetime.now()
        return session
    
    async def add_file_to_history(
        self,
        session_id: str,
        file_id: str,
        original_filename: str,
        processing_type: str = "basic",
        status: str = "processing"
    ) -> bool:
        """파일을 히스토리에 추가"""
        try:
            # 세션 조회 또는 생성
            session = await self.get_session(session_id)
            if not session:
                session = await self.create_session(session_id)
            
            # 파일 정보 생성
            converted_filename = f"{original_filename.replace('.pdf', '')}_converted.xlsx"
            
            file_item = FileHistoryItem(
                file_id=file_id,
                original_filename=original_filename,
                converted_filename=converted_filename,
                upload_time=datetime.now(),
                status=status,
                processing_type=processing_type
            )
            
            # 중복 파일 확인 (같은 file_id가 있으면 업데이트)
            existing_index = None
            for i, existing_file in enumerate(session.files):
                if existing_file.file_id == file_id:
                    existing_index = i
                    break
            
            if existing_index is not None:
                # 기존 파일 정보 업데이트
                session.files[existing_index] = file_item
                logger.info(f"📝 Updated file in history: {file_id}")
            else:
                # 새 파일 추가 (최신 파일이 앞에 오도록)
                session.files.insert(0, file_item)
                
                # 최대 개수 초과 시 오래된 파일 제거
                if len(session.files) > self.max_files_per_session:
                    removed_files = session.files[self.max_files_per_session:]
                    session.files = session.files[:self.max_files_per_session]
                    
                    # 제거된 파일들의 물리적 파일도 정리
                    for removed_file in removed_files:
                        await self._cleanup_file_data(removed_file)
                
                logger.info(f"📝 Added file to history: {file_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding file to history: {e}")
            return False
    
    async def update_file_status(
        self,
        session_id: str,
        file_id: str,
        status: str,
        excel_path: Optional[str] = None,
        file_size: Optional[int] = None
    ) -> bool:
        """파일 상태 업데이트"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # 파일 찾기 및 업데이트
            for file_item in session.files:
                if file_item.file_id == file_id:
                    file_item.status = status
                    if excel_path:
                        file_item.excel_path = excel_path
                    if file_size:
                        file_item.file_size = file_size
                    
                    logger.info(f"📝 Updated file status: {file_id} -> {status}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating file status: {e}")
            return False
    
    async def get_user_history(self, session_id: str) -> List[FileHistoryItem]:
        """사용자 히스토리 조회"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return []
            
            # 완료된 파일만 반환 (처리 중인 파일은 제외)
            completed_files = [
                file_item for file_item in session.files
                if file_item.status in ["completed", "failed"]
            ]
            
            logger.info(f"📝 Retrieved history for session {session_id}: {len(completed_files)} files")
            return completed_files
            
        except Exception as e:
            logger.error(f"Error getting user history: {e}")
            return []
    
    async def get_file_info(self, session_id: str, file_id: str) -> Optional[FileHistoryItem]:
        """특정 파일 정보 조회"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return None
            
            for file_item in session.files:
                if file_item.file_id == file_id:
                    return file_item
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting file info: {e}")
            return None
    
    async def delete_file_from_history(self, session_id: str, file_id: str) -> bool:
        """히스토리에서 파일 삭제"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # 파일 찾기 및 삭제
            for i, file_item in enumerate(session.files):
                if file_item.file_id == file_id:
                    removed_file = session.files.pop(i)
                    
                    # 물리적 파일도 정리
                    await self._cleanup_file_data(removed_file)
                    
                    logger.info(f"📝 Deleted file from history: {file_id}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting file from history: {e}")
            return False
    
    async def get_session_stats(self, session_id: str) -> Dict:
        """세션 통계 조회"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return {
                    "total_files": 0,
                    "completed_files": 0,
                    "failed_files": 0,
                    "ai_conversions": 0,
                    "basic_conversions": 0
                }
            
            stats = {
                "total_files": len(session.files),
                "completed_files": sum(1 for f in session.files if f.status == "completed"),
                "failed_files": sum(1 for f in session.files if f.status == "failed"),
                "ai_conversions": sum(1 for f in session.files if f.processing_type == "ai"),
                "basic_conversions": sum(1 for f in session.files if f.processing_type == "basic"),
                "session_created": session.created_at,
                "last_accessed": session.last_accessed
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting session stats: {e}")
            return {}
    
    async def _cleanup_file_data(self, file_item: FileHistoryItem):
        """파일 데이터 정리"""
        try:
            # Excel 파일 삭제
            if file_item.excel_path and os.path.exists(file_item.excel_path):
                os.remove(file_item.excel_path)
                logger.info(f"🧹 Cleaned up Excel file: {file_item.excel_path}")
            
        except Exception as e:
            logger.error(f"Error cleaning up file data: {e}")
    
    async def _cleanup_session(self, session_id: str):
        """세션 정리"""
        try:
            if session_id in self.sessions:
                session = self.sessions[session_id]
                
                # 모든 파일 데이터 정리
                for file_item in session.files:
                    await self._cleanup_file_data(file_item)
                
                # 세션 삭제
                del self.sessions[session_id]
                logger.info(f"🧹 Cleaned up session: {session_id}")
            
        except Exception as e:
            logger.error(f"Error cleaning up session: {e}")
    
    async def _cleanup_expired_sessions(self):
        """만료된 세션 주기적 정리"""
        while True:
            try:
                current_time = datetime.now()
                expired_sessions = []
                
                for session_id, session in self.sessions.items():
                    if current_time - session.last_accessed > self.session_ttl:
                        expired_sessions.append(session_id)
                
                # 만료된 세션들 정리
                for session_id in expired_sessions:
                    await self._cleanup_session(session_id)
                
                if expired_sessions:
                    logger.info(f"🧹 Cleaned up {len(expired_sessions)} expired sessions")
                
                # 1시간마다 정리
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in session cleanup task: {e}")
                await asyncio.sleep(3600)  # 오류 시에도 계속 실행
    
    def get_all_sessions_count(self) -> int:
        """전체 세션 수 반환"""
        return len(self.sessions)
    
    def get_total_files_count(self) -> int:
        """전체 파일 수 반환"""
        total = 0
        for session in self.sessions.values():
            total += len(session.files)
        return total

# 전역 히스토리 서비스 인스턴스
history_service = HistoryService()