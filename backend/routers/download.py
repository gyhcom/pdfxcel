from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import FileResponse
import os
from typing import Optional
from utils.file_manager import FileManager
from services.history_service import history_service

router = APIRouter()

@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    try:
        # 히스토리에서 파일 정보 조회
        if session_id:
            file_info = await history_service.get_file_info(session_id, file_id)
            if file_info and file_info.excel_path and os.path.exists(file_info.excel_path):
                return FileResponse(
                    path=file_info.excel_path,
                    filename=file_info.converted_filename,
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
        
        # 기존 방식으로 폴백
        file_info = await FileManager.get_file_info(file_id)
        
        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = file_info["path"]
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        # Return file for download
        filename = f"bank_statement_{file_id}.xlsx"
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.delete("/download/{file_id}")
async def delete_file(file_id: str):
    try:
        success = await FileManager.delete_file(file_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="File not found")
        
        return {"message": "File deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@router.get("/data/{file_id}")
async def get_converted_data(
    file_id: str,
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    변환된 데이터 조회 (미리보기용)
    """
    try:
        # 히스토리에서 파일 정보 조회
        if session_id:
            file_info = await history_service.get_file_info(session_id, file_id)
            if file_info and file_info.status == "completed":
                # 저장된 변환 데이터 반환
                if file_info.converted_data:
                    return file_info.converted_data
                else:
                    # 데이터가 없으면 빈 배열 반환
                    return []
        
        # 파일을 찾을 수 없는 경우
        raise HTTPException(status_code=404, detail="Converted data not found")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data retrieval failed: {str(e)}")