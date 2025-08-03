"""
향상된 변환 서비스
WebSocket 진행률 업데이트와 취소 가능한 변환 작업을 지원
"""
import asyncio
import aiofiles
import os
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime

from .websocket_manager import manager as ws_manager
from .task_manager import task_manager
from .claude_integration import ClaudeIntegration
from .pdf_processor import PDFProcessor
from .excel_generator import ExcelGenerator
from .history_service import history_service
from utils.file_manager import FileManager

logger = logging.getLogger(__name__)

class EnhancedConversionService:
    def __init__(self):
        self.claude_service = ClaudeIntegration()
        self.pdf_processor = PDFProcessor()
        self.excel_generator = ExcelGenerator()
        self.file_manager = FileManager()
    
    async def convert_pdf_to_excel(
        self,
        file_id: str,
        file_path: str,
        original_filename: str,
        use_ai: bool = True,
        session_id: Optional[str] = None
    ) -> Optional[str]:
        """
        PDF를 Excel로 변환하는 메인 함수 (WebSocket 진행률 업데이트 포함)
        
        Args:
            file_id: 고유 파일 ID
            file_path: PDF 파일 경로
            original_filename: 원본 파일명
            use_ai: AI 사용 여부
            session_id: 세션 ID (히스토리 업데이트용)
        
        Returns:
            변환된 Excel 파일 경로 또는 None (실패 시)
        """
        try:
            logger.info(f"🚀 Starting conversion for file_id: {file_id}")
            
            # 1. 시작 알림
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="starting",
                progress=0,
                message="변환을 시작합니다..."
            )
            
            # 취소 확인
            if task_manager.is_cancelled(file_id):
                raise asyncio.CancelledError("변환이 취소되었습니다.")
            
            # 2. 파일 검증
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="validating",
                progress=5,
                message="파일을 검증하는 중..."
            )
            
            await self._validate_file(file_path)
            
            # 취소 확인
            if task_manager.is_cancelled(file_id):
                raise asyncio.CancelledError("변환이 취소되었습니다.")
            
            # 3. PDF 텍스트 추출
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="extracting",
                progress=20,
                message="PDF에서 텍스트를 추출하는 중..."
            )
            
            extracted_text = await self._extract_pdf_text(file_path)
            
            # 취소 확인
            if task_manager.is_cancelled(file_id):
                raise asyncio.CancelledError("변환이 취소되었습니다.")
            
            # 4. AI 분석 (선택적)
            if use_ai:
                await ws_manager.broadcast_status(
                    file_id=file_id,
                    status="processing",
                    progress=40,
                    message="AI로 데이터를 분석하는 중..."
                )
                
                structured_data = await self._process_with_ai(extracted_text)
                
                # 취소 확인
                if task_manager.is_cancelled(file_id):
                    raise asyncio.CancelledError("변환이 취소되었습니다.")
                
                await ws_manager.broadcast_status(
                    file_id=file_id,
                    status="processing",
                    progress=70,
                    message="AI 분석이 완료되었습니다."
                )
            else:
                # 간단한 텍스트 파싱
                await ws_manager.broadcast_status(
                    file_id=file_id,
                    status="processing",
                    progress=50,
                    message="텍스트를 분석하는 중..."
                )
                
                structured_data = await self._simple_text_parsing(extracted_text)
            
            # 취소 확인
            if task_manager.is_cancelled(file_id):
                raise asyncio.CancelledError("변환이 취소되었습니다.")
            
            # 5. Excel 파일 생성
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="generating",
                progress=85,
                message="Excel 파일을 생성하는 중..."
            )
            
            excel_path = await self._generate_excel_file(file_id, structured_data, original_filename)
            
            # 취소 확인
            if task_manager.is_cancelled(file_id):
                raise asyncio.CancelledError("변환이 취소되었습니다.")
            
            # 6. 완료
            file_size = await self._get_file_size(excel_path)
            
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="completed",
                progress=100,
                message="변환이 완료되었습니다!",
                data={
                    "excel_path": excel_path,
                    "original_filename": original_filename,
                    "file_size": file_size
                }
            )
            
            # 히스토리 업데이트 (변환된 데이터 포함)
            if session_id:
                # 변환된 데이터를 미리보기용으로 포맷팅
                preview_data = self._format_data_for_preview(structured_data)
                
                await history_service.update_file_status(
                    session_id=session_id,
                    file_id=file_id,
                    status="completed",
                    excel_path=excel_path,
                    file_size=file_size,
                    converted_data=preview_data
                )
            
            logger.info(f"✅ Conversion completed for file_id: {file_id}")
            return excel_path
            
        except asyncio.CancelledError:
            logger.info(f"🛑 Conversion cancelled for file_id: {file_id}")
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="cancelled",
                progress=0,
                message="변환이 취소되었습니다."
            )
            
            # 히스토리 업데이트
            if session_id:
                await history_service.update_file_status(
                    session_id=session_id,
                    file_id=file_id,
                    status="cancelled"
                )
            
            # 임시 파일 정리
            await self._cleanup_temp_files(file_id)
            raise
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"❌ Conversion failed for file_id {file_id}: {str(e)}")
            logger.error(f"❌ Full traceback: {error_trace}")
            
            await ws_manager.broadcast_status(
                file_id=file_id,
                status="failed",
                progress=0,
                message=f"변환 실패: {str(e)}"
            )
            
            # 히스토리 업데이트
            if session_id:
                await history_service.update_file_status(
                    session_id=session_id,
                    file_id=file_id,
                    status="failed"
                )
            
            # 임시 파일 정리
            await self._cleanup_temp_files(file_id)
            raise
            
        finally:
            # 작업 정리
            task_manager.cleanup_task(file_id)
    
    async def _validate_file(self, file_path: str):
        """파일 유효성 검증"""
        if not os.path.exists(file_path):
            raise FileNotFoundError("업로드된 파일을 찾을 수 없습니다.")
        
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise ValueError("파일이 비어있습니다.")
        
        if file_size > 10 * 1024 * 1024:  # 10MB 제한
            raise ValueError("파일 크기가 너무 큽니다. (최대 10MB)")
        
        # PDF 파일 헤더 확인
        async with aiofiles.open(file_path, 'rb') as f:
            header = await f.read(4)
            if header != b'%PDF':
                raise ValueError("유효하지 않은 PDF 파일입니다.")
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """PDF에서 텍스트 추출"""
        # 시뮬레이션을 위한 약간의 지연
        await asyncio.sleep(0.5)
        
        try:
            # extract_text는 단순히 문자열을 반환
            extracted_text = await self.pdf_processor.extract_text(file_path)
            
            if not extracted_text or not extracted_text.strip():
                raise ValueError("PDF에서 추출된 텍스트가 없습니다.")
            
            return extracted_text
            
        except Exception as e:
            raise ValueError(f"PDF 처리 중 오류 발생: {str(e)}")
    
    async def _process_with_ai(self, text_content: str) -> Dict[str, Any]:
        """AI를 사용한 텍스트 처리"""
        # 여러 단계로 나누어 진행률 업데이트
        try:
            result = await self.claude_service.process_bank_statement(text_content)
            
            if not result.success:
                raise ValueError(f"AI 처리 실패: {result.error}")
            
            # TableData를 딕셔너리로 변환
            table_data = result.data
            return {
                "headers": table_data.headers,
                "rows": table_data.rows
            }
            
        except Exception as e:
            raise ValueError(f"AI 분석 중 오류 발생: {str(e)}")
    
    async def _simple_text_parsing(self, text_content: str) -> Dict[str, Any]:
        """간단한 텍스트 파싱 (AI 미사용)"""
        # 시뮬레이션을 위한 지연
        await asyncio.sleep(1.0)
        
        # 기본 파싱 로직 (실제 구현은 더 복잡해야 함)
        lines = text_content.split('\n')
        
        # 더미 데이터 반환 (실제로는 텍스트 파싱 로직 구현)
        return {
            "headers": ["날짜", "내용", "금액"],
            "rows": [
                ["2024-01-01", "기본 파싱된 내용", "0"],
                ["2024-01-02", f"총 {len(lines)}줄 처리됨", "0"]
            ]
        }
    
    async def _generate_excel_file(
        self, 
        file_id: str, 
        data: Dict[str, Any], 
        original_filename: str
    ) -> str:
        """Excel 파일 생성"""
        # 시뮬레이션을 위한 지연
        await asyncio.sleep(0.3)
        
        try:
            # 데이터를 TableData 형식으로 변환
            from models.schemas import TableData
            table_data = TableData(
                headers=data.get("headers", []),
                rows=data.get("rows", [])
            )
            
            # Excel 생성
            excel_path = await self.excel_generator.create_excel(table_data, file_id)
            
            # 파일 매니저에 등록
            await self.file_manager.register_file(file_id, excel_path)
            
            return excel_path
            
        except Exception as e:
            raise ValueError(f"Excel 생성 중 오류 발생: {str(e)}")
    
    async def _get_file_size(self, file_path: str) -> int:
        """파일 크기 조회"""
        try:
            return os.path.getsize(file_path) if os.path.exists(file_path) else 0
        except:
            return 0
    
    def _format_data_for_preview(self, structured_data: Dict[str, Any]) -> List[Dict]:
        """변환된 데이터를 미리보기용으로 포맷팅"""
        try:
            headers = structured_data.get("headers", [])
            rows = structured_data.get("rows", [])
            
            preview_data = []
            for row in rows:
                if len(row) >= len(headers):
                    row_dict = {}
                    for i, header in enumerate(headers):
                        row_dict[header] = row[i] if i < len(row) else ""
                    preview_data.append(row_dict)
            
            return preview_data
            
        except Exception as e:
            logger.error(f"Error formatting data for preview: {e}")
            return []
    
    async def _cleanup_temp_files(self, file_id: str):
        """임시 파일 정리"""
        try:
            # 파일 매니저를 통한 정리
            await self.file_manager.cleanup_file(file_id)
            logger.info(f"🧹 Temp files cleaned up for file_id: {file_id}")
        except Exception as e:
            logger.error(f"Temp file cleanup error for {file_id}: {e}")

# 전역 인스턴스
enhanced_conversion_service = EnhancedConversionService()