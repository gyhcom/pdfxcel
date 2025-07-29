from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header
from fastapi.responses import JSONResponse
import base64
import uuid
import os
from typing import Optional
import logging

from app.models.schemas import UploadResponse, ProcessingType
from app.services.enhanced_conversion_service import enhanced_conversion_service
from app.services.task_manager import task_manager
from app.services.websocket_manager import manager as ws_manager
from app.services.history_service import history_service
from app.utils.file_manager import FileManager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/test-conversion")
async def test_conversion():
    """변환 서비스 테스트용 엔드포인트"""
    try:
        from app.services.enhanced_conversion_service import enhanced_conversion_service
        logger.info("🧪 Testing conversion service import...")
        
        # 간단한 테스트 실행
        test_result = "Conversion service imported successfully"
        
        # Task manager 테스트
        from app.services.task_manager import task_manager
        logger.info("🧪 Testing task manager...")
        
        return {
            "status": "success",
            "message": "Services imported successfully",
            "test_result": test_result,
            "task_manager_status": "imported"
        }
    except Exception as e:
        import traceback
        logger.error(f"🧪 Service test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }

@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: Optional[UploadFile] = File(None),
    file_data: Optional[str] = Form(None),
    use_ai: bool = Form(False),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    PDF 파일 업로드 및 백그라운드 변환 시작
    WebSocket을 통한 실시간 진행률 업데이트 지원
    """
    file_id = str(uuid.uuid4())
    
    try:
        logger.info(f"📤 Upload request received - file_id: {file_id}, use_ai: {use_ai}")
        
        # 1. 파일 입력 처리 (multipart 또는 base64)
        original_filename = "document.pdf"
        
        if file:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다")
            
            original_filename = file.filename
            file_content = await file.read()
            
            # 파일 크기 검증
            if len(file_content) > 10 * 1024 * 1024:  # 10MB
                raise HTTPException(status_code=413, detail="파일 크기가 너무 큽니다 (최대 10MB)")
            
            temp_pdf_path = await FileManager.save_temp_file(file_content, file_id, "pdf")
            
        elif file_data:
            try:
                file_content = base64.b64decode(file_data)
                if len(file_content) > 10 * 1024 * 1024:  # 10MB
                    raise HTTPException(status_code=413, detail="파일 크기가 너무 큽니다 (최대 10MB)")
                
                temp_pdf_path = await FileManager.save_temp_file(file_content, file_id, "pdf")
            except Exception as e:
                raise HTTPException(status_code=400, detail="잘못된 base64 데이터입니다")
        else:
            raise HTTPException(status_code=400, detail="파일이 제공되지 않았습니다")
        
        # 히스토리에 파일 추가 (세션 ID가 있는 경우)
        if session_id:
            await history_service.add_file_to_history(
                session_id=session_id,
                file_id=file_id,
                original_filename=original_filename,
                processing_type="ai" if use_ai else "basic",
                status="processing"
            )
        
        # 2. 백그라운드에서 변환 작업 시작
        logger.info(f"🔄 Starting conversion task for file_id: {file_id}")
        
        try:
            conversion_task = enhanced_conversion_service.convert_pdf_to_excel(
                file_id=file_id,
                file_path=temp_pdf_path,
                original_filename=original_filename,
                use_ai=use_ai,
                session_id=session_id
            )
            logger.info(f"🔄 Conversion task created successfully for file_id: {file_id}")
            
            # 3. 태스크 매니저에 작업 등록
            task = task_manager.start_task(
                file_id=file_id,
                coro=conversion_task,
                task_name=f"pdf_to_excel_{original_filename}"
            )
            logger.info(f"🔄 Task registered in task_manager for file_id: {file_id}, task: {task}")
            
        except Exception as task_error:
            logger.error(f"❌ Failed to start conversion task for file_id {file_id}: {task_error}")
            # 에러가 발생해도 업로드 응답은 반환하되, 로그에 기록
            import traceback
            logger.error(f"Conversion task error traceback: {traceback.format_exc()}")
        
        # 4. 즉시 응답 반환 (변환은 백그라운드에서 진행)
        processing_type = ProcessingType.AI if use_ai else ProcessingType.BASIC
        
        logger.info(f"✅ Upload processed - file_id: {file_id}, background conversion started")
        
        return UploadResponse(
            file_id=file_id,
            message="파일 업로드 완료. 변환이 백그라운드에서 진행됩니다.",
            processing_type=processing_type
        )
        
    except HTTPException:
        # 실패 시 WebSocket으로 알림
        await ws_manager.broadcast_status(
            file_id=file_id,
            status="failed",
            progress=0,
            message="업로드 실패"
        )
        raise
        
    except Exception as e:
        logger.error(f"Upload error for file_id {file_id}: {str(e)}")
        
        # 실패 시 WebSocket으로 알림
        await ws_manager.broadcast_status(
            file_id=file_id,
            status="failed",
            progress=0,
            message=f"업로드 실패: {str(e)}"
        )
        
        raise HTTPException(
            status_code=500, 
            detail=f"서버 오류가 발생했습니다: {str(e)}"
        )