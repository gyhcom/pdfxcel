import pdfplumber
from typing import List, Dict, Any
from app.models.schemas import ProcessingResult, TableData
from app.services.claude_integration import ClaudeIntegration

class PDFProcessor:
    def __init__(self):
        self.claude_integration = ClaudeIntegration()
    
    async def process_basic(self, pdf_path: str) -> ProcessingResult:
        """
        Basic PDF processing using pdfplumber to extract tables
        """
        try:
            tables_data = []
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Extract tables from the page
                    tables = page.extract_tables()
                    
                    for table in tables:
                        if table and len(table) > 1:  # Ensure table has data
                            # Clean and filter empty rows
                            cleaned_table = []
                            for row in table:
                                if any(cell and str(cell).strip() for cell in row):
                                    cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                                    cleaned_table.append(cleaned_row)
                            
                            if cleaned_table:
                                tables_data.extend(cleaned_table)
            
            if not tables_data:
                return ProcessingResult(
                    success=False,
                    error="No tables found in PDF"
                )
            
            # Use first row as headers, rest as data
            headers = tables_data[0] if tables_data else []
            rows = tables_data[1:] if len(tables_data) > 1 else []
            
            # Clean headers
            headers = [str(h).strip() for h in headers if h]
            if not headers:
                headers = [f"Column {i+1}" for i in range(len(rows[0]) if rows else 0)]
            
            table_data = TableData(headers=headers, rows=rows)
            
            return ProcessingResult(
                success=True,
                data=table_data
            )
            
        except Exception as e:
            return ProcessingResult(
                success=False,
                error=f"Basic processing failed: {str(e)}"
            )
    
    async def process_with_ai(self, pdf_path: str) -> ProcessingResult:
        """
        AI-powered PDF processing using Claude integration
        """
        try:
            # Extract text from PDF
            text_content = self._extract_text(pdf_path)
            
            if not text_content.strip():
                return ProcessingResult(
                    success=False,
                    error="No text content found in PDF"
                )
            
            # Send to Claude integration for structured processing
            ai_result = await self.claude_integration.process_bank_statement(text_content)
            
            return ai_result
            
        except Exception as e:
            return ProcessingResult(
                success=False,
                error=f"AI processing failed: {str(e)}"
            )
    
    def _extract_text(self, pdf_path: str) -> str:
        """
        Extract all text content from PDF
        """
        text_content = ""
        
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        return text_content