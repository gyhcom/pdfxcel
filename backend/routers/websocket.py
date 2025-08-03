"""
WebSocket 라우터
실시간 변환 진행률 업데이트를 위한 WebSocket 엔드포인트
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict
import logging
import json

from services.websocket_manager import manager as ws_manager
from services.task_manager import task_manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/{file_id}")
async def websocket_endpoint(websocket: WebSocket, file_id: str):
    """
    WebSocket 엔드포인트 - 특정 파일의 변환 진행률 실시간 업데이트
    
    Args:
        websocket: WebSocket 연결
        file_id: 추적할 파일 ID
    """
    try:
        logger.info(f"🔌 WebSocket connection attempt for file_id: {file_id}")
        
        # WebSocket 연결 수락 및 등록
        await ws_manager.connect(websocket, file_id)
        
        # 현재 작업 상태가 있으면 즉시 전송
        task_status = task_manager.get_task_status(file_id)
        if task_status:
            await ws_manager.broadcast_status(
                file_id=file_id,
                status=task_status.get("status", "unknown"),
                progress=0,
                message=f"작업 상태: {task_status.get('status', 'unknown')}"
            )
        
        # 연결 유지 및 클라이언트 메시지 처리
        while True:
            try:
                # 클라이언트로부터 메시지 대기 (keepalive 또는 명령)
                message = await websocket.receive_text()
                
                # 메시지 파싱 및 처리
                try:
                    data = json.loads(message)
                    await handle_client_message(file_id, data)
                except json.JSONDecodeError:
                    # 단순 keepalive 메시지
                    logger.debug(f"📟 Keepalive from {file_id}: {message}")
                
            except WebSocketDisconnect:
                logger.info(f"🔌 Client disconnected: {file_id}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket error for {file_id}: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass
    finally:
        # 연결 정리
        ws_manager.disconnect(file_id)

async def handle_client_message(file_id: str, message: Dict):
    """
    클라이언트로부터 받은 메시지 처리
    
    Args:
        file_id: 파일 ID
        message: 클라이언트 메시지
    """
    try:
        action = message.get("action")
        
        if action == "ping":
            # Ping-Pong for keepalive
            await ws_manager.send_progress(file_id, {
                "action": "pong",
                "timestamp": message.get("timestamp")
            })
            
        elif action == "status_request":
            # 현재 상태 요청
            task_status = task_manager.get_task_status(file_id)
            if task_status:
                await ws_manager.broadcast_status(
                    file_id=file_id,
                    status=task_status.get("status", "unknown"),
                    message="현재 상태를 조회했습니다.",
                    data=task_status
                )
            else:
                await ws_manager.broadcast_status(
                    file_id=file_id,
                    status="not_found",
                    message="작업을 찾을 수 없습니다."
                )
        
        elif action == "cancel_request":
            # 취소 요청
            success = task_manager.cancel_task(file_id)
            if success:
                await ws_manager.broadcast_status(
                    file_id=file_id,
                    status="cancelling",
                    message="변환 취소를 요청했습니다..."
                )
            else:
                await ws_manager.broadcast_status(
                    file_id=file_id,
                    status="cancel_failed",
                    message="취소할 작업이 없습니다."
                )
        
        else:
            logger.warning(f"Unknown action from {file_id}: {action}")
            
    except Exception as e:
        logger.error(f"Error handling client message for {file_id}: {e}")

@router.get("/ws/status")
async def get_websocket_status():
    """WebSocket 매니저 상태 조회"""
    return {
        "active_connections": ws_manager.get_connection_count(),
        "connected_files": ws_manager.get_active_connections(),
        "running_tasks": task_manager.get_running_task_count(),
        "all_tasks": task_manager.get_all_tasks()
    }

@router.post("/cancel/{file_id}")
async def cancel_conversion(file_id: str):
    """
    변환 작업 취소 (REST API)
    WebSocket이 연결되지 않은 경우의 폴백용
    """
    try:
        success = task_manager.cancel_task(file_id)
        
        if success:
            # WebSocket으로도 알림
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="cancelled",
                message="변환이 취소되었습니다."
            )
            
            return {
                "success": True,
                "message": "변환이 취소되었습니다.",
                "file_id": file_id
            }
        else:
            return {
                "success": False,
                "message": "취소할 작업이 없습니다.",
                "file_id": file_id
            }
            
    except Exception as e:
        logger.error(f"Cancel request error for {file_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"취소 요청 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/status/{file_id}")
async def get_conversion_status(file_id: str):
    """
    변환 상태 조회 (REST API)
    WebSocket 대신 폴링을 원하는 경우 사용
    """
    try:
        task_status = task_manager.get_task_status(file_id)
        
        if task_status:
            return {
                "success": True,
                "file_id": file_id,
                "status": task_status
            }
        else:
            return {
                "success": False,
                "file_id": file_id,
                "message": "작업을 찾을 수 없습니다."
            }
            
    except Exception as e:
        logger.error(f"Status request error for {file_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"상태 조회 중 오류가 발생했습니다: {str(e)}"
        )