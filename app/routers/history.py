"""
파일 히스토리 라우터
변환 기록 조회 및 관리 API
"""
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional, List
import logging
import os

from app.services.history_service import history_service, FileHistoryItem
from app.models.schemas import HistoryResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/history", response_model=HistoryResponse)
async def get_file_history(
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    사용자 파일 히스토리 조회
    
    Headers:
        X-Session-ID: 세션 ID (필수)
    """
    try:
        if not session_id:
            raise HTTPException(
                status_code=400, 
                detail="세션 ID가 필요합니다. X-Session-ID 헤더를 포함해주세요."
            )
        
        # 히스토리 조회
        files = await history_service.get_user_history(session_id)
        
        # 세션 통계 조회
        stats = await history_service.get_session_stats(session_id)
        
        logger.info(f"📝 History requested for session {session_id}: {len(files)} files")
        
        return HistoryResponse(
            success=True,
            files=files,
            total_count=len(files),
            session_stats=stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"히스토리 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/history/{file_id}")
async def get_file_info(
    file_id: str,
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    특정 파일 정보 조회
    
    Args:
        file_id: 파일 ID
    
    Headers:
        X-Session-ID: 세션 ID (필수)
    """
    try:
        if not session_id:
            raise HTTPException(
                status_code=400,
                detail="세션 ID가 필요합니다."
            )
        
        file_info = await history_service.get_file_info(session_id, file_id)
        
        if not file_info:
            raise HTTPException(
                status_code=404,
                detail="파일을 찾을 수 없습니다."
            )
        
        return {
            "success": True,
            "file": file_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"파일 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.delete("/history/{file_id}")
async def delete_file_from_history(
    file_id: str,
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    히스토리에서 파일 삭제
    
    Args:
        file_id: 삭제할 파일 ID
    
    Headers:
        X-Session-ID: 세션 ID (필수)
    """
    try:
        if not session_id:
            raise HTTPException(
                status_code=400,
                detail="세션 ID가 필요합니다."
            )
        
        success = await history_service.delete_file_from_history(session_id, file_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="삭제할 파일을 찾을 수 없습니다."
            )
        
        return {
            "success": True,
            "message": "파일이 히스토리에서 삭제되었습니다.",
            "file_id": file_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file from history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"파일 삭제 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/history/stats")
async def get_session_stats(
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    세션 통계 조회
    
    Headers:
        X-Session-ID: 세션 ID (필수)
    """
    try:
        if not session_id:
            raise HTTPException(
                status_code=400,
                detail="세션 ID가 필요합니다."
            )
        
        stats = await history_service.get_session_stats(session_id)
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting session stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"통계 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/history/{file_id}/redownload")
async def redownload_file(
    file_id: str,
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    히스토리에서 파일 재다운로드
    
    Args:
        file_id: 재다운로드할 파일 ID
    
    Headers:
        X-Session-ID: 세션 ID (필수)
    """
    try:
        if not session_id:
            raise HTTPException(
                status_code=400,
                detail="세션 ID가 필요합니다."
            )
        
        # 파일 정보 조회
        file_info = await history_service.get_file_info(session_id, file_id)
        
        if not file_info:
            raise HTTPException(
                status_code=404,
                detail="파일을 찾을 수 없습니다."
            )
        
        if file_info.status != "completed":
            raise HTTPException(
                status_code=400,
                detail="완료된 파일만 재다운로드할 수 있습니다."
            )
        
        if not file_info.excel_path or not os.path.exists(file_info.excel_path):
            raise HTTPException(
                status_code=404,
                detail="Excel 파일을 찾을 수 없습니다. 파일이 만료되었을 수 있습니다."
            )
        
        return {
            "success": True,
            "message": "재다운로드 준비 완료",
            "file_id": file_id,
            "download_url": f"/api/download/{file_id}",
            "file_info": file_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error preparing redownload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"재다운로드 준비 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/admin/stats")
async def get_admin_stats():
    """
    관리자 통계 (전체 시스템)
    """
    try:
        total_sessions = history_service.get_all_sessions_count()
        total_files = history_service.get_total_files_count()
        
        return {
            "success": True,
            "system_stats": {
                "total_sessions": total_sessions,
                "total_files": total_files,
                "active_sessions": total_sessions,  # 현재는 모든 세션이 active
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"시스템 통계 조회 중 오류가 발생했습니다: {str(e)}"
        )