"""
비동기 작업 관리자
취소 가능한 변환 작업 관리를 위한 TaskManager
"""
import asyncio
from typing import Dict, Optional, Callable, Any
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)

class TaskManager:
    def __init__(self):
        # 실행 중인 작업들
        self.running_tasks: Dict[str, asyncio.Task] = {}
        # 취소 토큰들
        self.cancellation_tokens: Dict[str, bool] = {}
        # 작업 메타데이터
        self.task_metadata: Dict[str, dict] = {}
    
    def start_task(self, file_id: str, coro, task_name: str = "conversion") -> asyncio.Task:
        """새로운 비동기 작업 시작"""
        # 기존 작업이 있으면 취소
        if file_id in self.running_tasks:
            logger.info(f"🛑 Cancelling existing task for file_id: {file_id}")
            self.cancel_task(file_id)
        
        # 취소 토큰 초기화
        self.cancellation_tokens[file_id] = False
        
        # 작업 생성 및 시작
        task = asyncio.create_task(coro)
        self.running_tasks[file_id] = task
        
        # 메타데이터 저장
        self.task_metadata[file_id] = {
            "task_name": task_name,
            "started_at": datetime.now(),
            "status": "running"
        }
        
        # 작업 완료 시 자동 정리를 위한 콜백 추가
        task.add_done_callback(lambda t: self._task_done_callback(file_id, t))
        
        logger.info(f"🚀 Task started for file_id: {file_id}, task: {task_name}")
        return task
    
    def cancel_task(self, file_id: str) -> bool:
        """작업 취소"""
        try:
            # 취소 토큰 설정
            if file_id in self.cancellation_tokens:
                self.cancellation_tokens[file_id] = True
            
            # 실행 중인 작업 취소
            if file_id in self.running_tasks:
                task = self.running_tasks[file_id]
                if not task.done():
                    task.cancel()
                    logger.info(f"🛑 Task cancelled for file_id: {file_id}")
                    
                    # 메타데이터 업데이트
                    if file_id in self.task_metadata:
                        self.task_metadata[file_id]["status"] = "cancelled"
                        self.task_metadata[file_id]["cancelled_at"] = datetime.now()
                    
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Task cancellation error for {file_id}: {e}")
            return False
    
    def is_cancelled(self, file_id: str) -> bool:
        """취소 여부 확인"""
        return self.cancellation_tokens.get(file_id, False)
    
    def is_running(self, file_id: str) -> bool:
        """작업 실행 여부 확인"""
        if file_id not in self.running_tasks:
            return False
        
        task = self.running_tasks[file_id]
        return not task.done()
    
    def get_task_status(self, file_id: str) -> Optional[dict]:
        """작업 상태 조회"""
        if file_id not in self.task_metadata:
            return None
        
        metadata = self.task_metadata[file_id].copy()
        
        if file_id in self.running_tasks:
            task = self.running_tasks[file_id]
            if task.done():
                if task.cancelled():
                    metadata["status"] = "cancelled"
                elif task.exception():
                    metadata["status"] = "failed"
                    metadata["error"] = str(task.exception())
                else:
                    metadata["status"] = "completed"
            else:
                metadata["status"] = "running"
        
        return metadata
    
    def cleanup_task(self, file_id: str):
        """작업 정리"""
        self.running_tasks.pop(file_id, None)
        self.cancellation_tokens.pop(file_id, None)
        self.task_metadata.pop(file_id, None)
        logger.info(f"🧹 Task cleaned up for file_id: {file_id}")
    
    def _task_done_callback(self, file_id: str, task: asyncio.Task):
        """작업 완료 시 콜백"""
        try:
            if file_id in self.task_metadata:
                self.task_metadata[file_id]["finished_at"] = datetime.now()
                
                if task.cancelled():
                    self.task_metadata[file_id]["status"] = "cancelled"
                elif task.exception():
                    self.task_metadata[file_id]["status"] = "failed"
                    self.task_metadata[file_id]["error"] = str(task.exception())
                else:
                    self.task_metadata[file_id]["status"] = "completed"
            
            logger.info(f"✅ Task finished for file_id: {file_id}")
            
        except Exception as e:
            logger.error(f"Task done callback error for {file_id}: {e}")
    
    def get_all_tasks(self) -> Dict[str, dict]:
        """모든 작업 상태 조회"""
        result = {}
        for file_id in self.task_metadata:
            result[file_id] = self.get_task_status(file_id)
        return result
    
    def get_running_task_count(self) -> int:
        """실행 중인 작업 수 반환"""
        count = 0
        for file_id, task in self.running_tasks.items():
            if not task.done():
                count += 1
        return count
    
    async def wait_for_task(self, file_id: str, timeout: Optional[float] = None) -> bool:
        """작업 완료 대기"""
        if file_id not in self.running_tasks:
            return False
        
        task = self.running_tasks[file_id]
        try:
            await asyncio.wait_for(task, timeout=timeout)
            return True
        except asyncio.TimeoutError:
            logger.warning(f"Task timeout for file_id: {file_id}")
            return False
        except Exception as e:
            logger.error(f"Task wait error for {file_id}: {e}")
            return False

# 전역 태스크 매니저 인스턴스
task_manager = TaskManager()