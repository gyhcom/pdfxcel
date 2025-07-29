"""
WebSocket 연결 관리자
실시간 변환 진행률 업데이트를 위한 WebSocket 관리
"""
from fastapi import WebSocket
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # 파일 ID별 WebSocket 연결 관리
        self.active_connections: Dict[str, WebSocket] = {}
        # 진행률 캐시 (WebSocket 연결 전에 발생한 이벤트 저장)
        self.progress_cache: Dict[str, dict] = {}
        
    async def connect(self, websocket: WebSocket, file_id: str):
        """WebSocket 연결 수락 및 등록"""
        try:
            await websocket.accept()
            self.active_connections[file_id] = websocket
            logger.info(f"✅ WebSocket connected for file_id: {file_id}")
            
            # 캐시된 진행률이 있으면 즉시 전송
            if file_id in self.progress_cache:
                cached_progress = self.progress_cache[file_id]
                await self.send_progress(file_id, cached_progress)
                
        except Exception as e:
            logger.error(f"WebSocket 연결 실패: {e}")
            raise
    
    def disconnect(self, file_id: str):
        """WebSocket 연결 해제"""
        if file_id in self.active_connections:
            del self.active_connections[file_id]
            logger.info(f"❌ WebSocket disconnected for file_id: {file_id}")
    
    async def send_progress(self, file_id: str, progress_data: dict):
        """특정 파일 ID에 진행률 데이터 전송"""
        # 캐시에 저장 (연결이 끊어졌다가 다시 연결될 때 사용)
        self.progress_cache[file_id] = progress_data
        
        if file_id in self.active_connections:
            try:
                websocket = self.active_connections[file_id]
                await websocket.send_text(json.dumps(progress_data, ensure_ascii=False))
                logger.debug(f"📤 Progress sent to {file_id}: {progress_data['status']} {progress_data['progress']}%")
            except Exception as e:
                logger.error(f"Progress 전송 실패 for {file_id}: {e}")
                self.disconnect(file_id)
        else:
            logger.debug(f"📦 Progress cached for {file_id}: {progress_data['status']} {progress_data['progress']}%")
    
    async def broadcast_status(
        self, 
        file_id: str, 
        status: str, 
        progress: int = 0, 
        message: str = "",
        data: Optional[dict] = None
    ):
        """상태 업데이트 브로드캐스트"""
        progress_data = {
            "file_id": file_id,
            "status": status,  # "uploading", "processing", "completed", "failed", "cancelled"
            "progress": min(100, max(0, progress)),  # 0-100 범위 보장
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data or {}
        }
        
        await self.send_progress(file_id, progress_data)
    
    def cleanup_file(self, file_id: str):
        """파일 관련 모든 데이터 정리"""
        self.disconnect(file_id)
        self.progress_cache.pop(file_id, None)
        logger.info(f"🧹 Cleaned up data for file_id: {file_id}")
    
    def get_active_connections(self) -> List[str]:
        """활성 연결 목록 반환"""
        return list(self.active_connections.keys())
    
    def get_connection_count(self) -> int:
        """활성 연결 수 반환"""
        return len(self.active_connections)

# 전역 WebSocket 매니저 인스턴스
manager = ConnectionManager()