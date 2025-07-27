from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from app.utils.file_manager import FileManager

router = APIRouter()

@router.get("/download/{file_id}")
async def download_file(file_id: str):
    try:
        # Get file path from file manager
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