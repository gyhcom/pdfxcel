from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header
from fastapi.responses import JSONResponse
import base64
import uuid
import os
from typing import Optional
import logging

from models.schemas import UploadResponse, ProcessingType
from services.enhanced_conversion_service import enhanced_conversion_service
from services.task_manager import task_manager
from services.websocket_manager import manager as ws_manager
from services.history_service import history_service
from utils.file_manager import FileManager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/test-real-conversion")
async def test_real_conversion():
    """실제 변환 서비스 테스트"""
    try:
        from services.enhanced_conversion_service import enhanced_conversion_service
        from services.task_manager import task_manager
        import os
        
        logger.info("🧪 Testing real conversion service...")
        
        # 테스트 파일 생성
        test_file_id = "real-test-456"
        test_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\nxref\n0 3\ntrailer<</Size 3/Root 1 0 R>>\n%%EOF"
        
        # 임시 파일 저장
        from utils.file_manager import FileManager
        temp_path = await FileManager.save_temp_file(test_content, test_file_id, "pdf")
        logger.info(f"🧪 Test file created at: {temp_path}")
        
        # 실제 변환 서비스 호출 시도
        logger.info("🧪 Calling convert_pdf_to_excel...")
        
        conversion_coro = enhanced_conversion_service.convert_pdf_to_excel(
            file_id=test_file_id,
            file_path=temp_path,
            original_filename="test.pdf",
            use_ai=False,  # 일단 AI 없이 테스트
            session_id="test-session"
        )
        
        logger.info("🧪 Conversion coroutine created successfully")
        
        # 태스크 매니저에 등록
        task = task_manager.start_task(
            file_id=test_file_id,
            coro=conversion_coro,
            task_name="real_test_conversion"
        )
        
        logger.info(f"🧪 Real conversion task started: {task}")
        
        return {
            "status": "success",
            "message": "Real conversion task started",
            "file_id": test_file_id,
            "temp_path": temp_path
        }
        
    except Exception as e:
        import traceback
        logger.error(f"🧪 Real conversion test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/test-conversion")
async def test_conversion():
    """변환 서비스 테스트용 엔드포인트"""
    try:
        from services.enhanced_conversion_service import enhanced_conversion_service
        logger.info("🧪 Testing conversion service import...")
        
        # Task manager 테스트
        from services.task_manager import task_manager
        logger.info("🧪 Testing task manager...")
        
        # 실제 변환 함수 테스트 (더미 데이터로)
        test_file_id = "test-123"
        logger.info(f"🧪 Creating test conversion task for file_id: {test_file_id}")
        
        # 테스트용 간단한 코루틴 생성
        async def dummy_conversion():
            logger.info("🧪 Dummy conversion started")
            await asyncio.sleep(1)
            logger.info("🧪 Dummy conversion completed")
            return "test_result"
        
        # 테스트 태스크 시작
        import asyncio
        task = task_manager.start_task(
            file_id=test_file_id,
            coro=dummy_conversion(),
            task_name="test_conversion"
        )
        
        logger.info(f"🧪 Test task created: {task}")
        
        return {
            "status": "success",
            "message": "Services imported and test task started",
            "test_result": "Conversion service working",
            "task_manager_status": "test task started",
            "task_id": test_file_id
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
    original_filename: Optional[str] = Form(None),
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
        # 파라미터로 전달된 파일명을 우선 사용, 없으면 기본값
        if original_filename:
            logger.info(f"📝 Original filename from parameter: {original_filename}")
        elif file and file.filename:
            original_filename = file.filename
            logger.info(f"📝 Original filename from file: {original_filename}")
        else:
            original_filename = "document.pdf"
            logger.info(f"📝 Using default filename: {original_filename}")
        
        if file:
            if not original_filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다")
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
            
            # 작업이 실제로 시작되었는지 확인
            if not task:
                raise Exception("Failed to start background conversion task")
            
        except Exception as task_error:
            logger.error(f"❌ Failed to start conversion task for file_id {file_id}: {task_error}")
            import traceback
            logger.error(f"Conversion task error traceback: {traceback.format_exc()}")
            
            # 에러 발생 시 히스토리 상태를 실패로 업데이트
            if session_id:
                await history_service.update_file_status(
                    session_id=session_id,
                    file_id=file_id,
                    status="failed"
                )
            
            # WebSocket으로 실패 알림
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="failed",
                progress=0,
                message=f"변환 작업 시작 실패: {str(task_error)}"
            )
            
            # 실제 에러가 발생했으므로 에러 응답 반환
            raise HTTPException(
                status_code=500,
                detail=f"변환 작업을 시작할 수 없습니다: {str(task_error)}"
            )
        
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