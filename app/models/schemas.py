from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum

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