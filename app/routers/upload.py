from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import base64
import uuid
from typing import Optional
from app.models.schemas import UploadResponse, ProcessingType
from app.services.pdf_processor import PDFProcessor
from app.services.excel_generator import ExcelGenerator
from app.utils.file_manager import FileManager

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: Optional[UploadFile] = File(None),
    file_data: Optional[str] = Form(None),
    use_ai: bool = Form(False)
):
    try:
        file_id = str(uuid.uuid4())
        
        # Handle file input (multipart or base64)
        if file:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files are allowed")
            
            # Save uploaded file temporarily
            file_content = await file.read()
            temp_pdf_path = await FileManager.save_temp_file(file_content, file_id, "pdf")
            
        elif file_data:
            try:
                # Decode base64 data
                file_content = base64.b64decode(file_data)
                temp_pdf_path = await FileManager.save_temp_file(file_content, file_id, "pdf")
            except Exception as e:
                raise HTTPException(status_code=400, detail="Invalid base64 data")
        else:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Process PDF based on AI preference
        processor = PDFProcessor()
        
        if use_ai:
            processing_result = await processor.process_with_ai(temp_pdf_path)
            processing_type = ProcessingType.AI
        else:
            processing_result = await processor.process_basic(temp_pdf_path)
            processing_type = ProcessingType.BASIC
        
        if not processing_result.success:
            raise HTTPException(status_code=500, detail=f"Processing failed: {processing_result.error}")
        
        # Generate Excel file
        excel_generator = ExcelGenerator()
        excel_path = await excel_generator.create_excel(processing_result.data, file_id)
        
        # Store file info for download
        await FileManager.register_file(file_id, excel_path)
        
        return UploadResponse(
            file_id=file_id,
            message="File processed successfully",
            processing_type=processing_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")