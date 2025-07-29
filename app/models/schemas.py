from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class ProcessingType(str, Enum):
    BASIC = "basic"
    AI = "ai"

class UploadRequest(BaseModel):
    use_ai: bool = False
    file_data: Optional[str] = None  # base64 encoded file

class UploadResponse(BaseModel):
    file_id: str
    message: str
    processing_type: ProcessingType

class DownloadResponse(BaseModel):
    file_id: str
    download_url: str
    filename: str

class TableData(BaseModel):
    headers: List[str]
    rows: List[List[Any]]

class ProcessingResult(BaseModel):
    success: bool
    data: Optional[TableData] = None
    error: Optional[str] = None

# 히스토리 관련 모델들
class FileHistoryItem(BaseModel):
    file_id: str
    original_filename: str
    converted_filename: str
    upload_time: datetime
    status: str  # "completed", "processing", "failed", "cancelled"
    file_size: Optional[int] = None
    processing_type: str = "basic"  # "ai" or "basic"
    excel_path: Optional[str] = None
    converted_data: Optional[List[Dict]] = None  # 변환된 데이터 저장

class HistoryResponse(BaseModel):
    success: bool
    files: List[FileHistoryItem]
    total_count: int
    session_stats: Optional[Dict[str, Any]] = None