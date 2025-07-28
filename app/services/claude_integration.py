import os
import json
import httpx
import asyncio
from typing import Dict, Any, List
import logging
from dotenv import load_dotenv
from app.models.schemas import ProcessingResult, TableData

# .env 파일 로드
load_dotenv()

# 로깅 설정
logger = logging.getLogger(__name__)

class ClaudeIntegration:
    """
    Claude 3 Haiku API를 사용한 한국어 은행 명세서 처리 서비스
    """
    
    def __init__(self):
        self.api_key = os.getenv("CLAUDE_API_KEY")
        if not self.api_key:
            logger.error("CLAUDE_API_KEY not found in environment variables")
            raise ValueError("Claude API key is required. Please set CLAUDE_API_KEY in .env file")
        
        # API 키 형식 검증
        if not self.api_key.startswith('sk-ant-'):
            logger.error("Invalid Claude API key format")
            raise ValueError("Invalid Claude API key format. Key should start with 'sk-ant-'")
        
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-3-haiku-20240307"
        self.max_retries = 3
        self.retry_delay = 1.0
        
        logger.info("Claude integration initialized successfully")
    
    async def process_bank_statement(self, text_content: str) -> ProcessingResult:
        """
        한국어 은행 명세서 텍스트를 구조화된 데이터로 변환
        
        Args:
            text_content: PDF에서 추출된 텍스트
            
        Returns:
            ProcessingResult with structured table data
        """
        try:
            if not self.api_key:
                return ProcessingResult(
                    success=False,
                    error="Claude API key not configured. Please set CLAUDE_API_KEY environment variable."
                )
            
            # Claude API 호출
            parsed_data = await self.parse_with_claude(text_content)
            
            if not parsed_data:
                return ProcessingResult(
                    success=False,
                    error="No transaction data found in the bank statement"
                )
            
            # TableData 형식으로 변환
            headers = ["Date", "Description", "Amount"]
            rows = []
            
            for item in parsed_data:
                row = [
                    item.get("Date", ""),
                    item.get("Description", ""),
                    item.get("Amount", 0)
                ]
                rows.append(row)
            
            table_data = TableData(headers=headers, rows=rows)
            
            return ProcessingResult(
                success=True,
                data=table_data
            )
            
        except Exception as e:
            logger.error(f"Bank statement processing failed: {str(e)}")
            return ProcessingResult(
                success=False,
                error=f"Claude integration error: {str(e)}"
            )
    
    async def parse_with_claude(self, text: str) -> List[Dict]:
        """
        Claude API를 사용하여 은행 명세서 텍스트를 구조화된 데이터로 파싱
        
        Args:
            text: 은행 명세서에서 추출된 텍스트
            
        Returns:
            파싱된 거래 내역 리스트
        """
        prompt = self._create_parsing_prompt(text)
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    headers = {
                        "x-api-key": self.api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    }
                    
                    payload = {
                        "model": self.model,
                        "max_tokens": 4000,
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    }
                    
                    response = await client.post(
                        self.api_url,
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        try:
                            response_data = response.json()
                            
                            # Claude API 응답 구조 검증
                            if "content" not in response_data or not response_data["content"]:
                                raise ValueError("Invalid response structure: missing content")
                            
                            content = response_data["content"][0]["text"]
                            logger.info(f"Claude API 응답 수신 성공 (길이: {len(content)} 문자)")
                            
                            # JSON 응답 파싱
                            parsed_data = self._parse_claude_response(content)
                            return parsed_data
                            
                        except (KeyError, IndexError, json.JSONDecodeError) as e:
                            raise ValueError(f"Invalid API response format: {str(e)}")
                    
                    elif response.status_code == 401:
                        raise Exception("Invalid API key. Please check your CLAUDE_API_KEY")
                    
                    elif response.status_code == 429:  # Rate limit
                        if attempt < self.max_retries - 1:
                            retry_after = response.headers.get("retry-after", self.retry_delay * (2 ** attempt))
                            logger.warning(f"Rate limit hit, retrying after {retry_after} seconds")
                            await asyncio.sleep(float(retry_after))
                            continue
                        else:
                            raise Exception("Rate limit exceeded after retries")
                    
                    elif response.status_code >= 500:
                        if attempt < self.max_retries - 1:
                            logger.warning(f"Server error {response.status_code}, retrying...")
                            await asyncio.sleep(self.retry_delay * (2 ** attempt))
                            continue
                        else:
                            raise Exception(f"Server error: {response.status_code} - {response.text}")
                    
                    else:
                        error_msg = f"API call failed with status {response.status_code}: {response.text}"
                        logger.error(error_msg)
                        raise Exception(error_msg)
                        
            except httpx.TimeoutException:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Timeout on attempt {attempt + 1}, retrying...")
                    await asyncio.sleep(self.retry_delay)
                    continue
                else:
                    raise Exception("Request timeout after retries")
                    
            except Exception as e:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Error on attempt {attempt + 1}: {str(e)}, retrying...")
                    await asyncio.sleep(self.retry_delay)
                    continue
                else:
                    raise e
        
        raise Exception("Failed to parse text after all retries")
    
    def _create_parsing_prompt(self, text: str) -> str:
        """
        한국어 은행 명세서 파싱을 위한 프롬프트 생성
        """
        return f"""
다음은 한국 은행 명세서에서 추출된 텍스트입니다. 이 텍스트에서 거래 내역을 추출하여 JSON 형태로 변환해주세요.

텍스트:
{text}

요구사항:
1. 각 거래를 Date, Description, Amount 필드를 가진 JSON 객체로 변환
2. Date는 YYYY-MM-DD 형식으로 표준화 (예: 2024.05.01 → 2024-05-01)
3. Description은 거래 내용/상호명만 추출 (불필요한 정보 제거)
4. Amount는 순수 숫자로 변환 (₩, 원, 쉼표 제거, 출금은 음수로)
5. 입금은 양수, 출금/결제는 음수로 처리

출력 형식 (JSON 배열):
[
  {{"Date": "2024-05-01", "Description": "스타벅스", "Amount": -5800}},
  {{"Date": "2024-05-02", "Description": "카카오페이 입금", "Amount": 100000}}
]

중요: 반드시 유효한 JSON 형식으로만 응답하고, 다른 설명이나 텍스트는 포함하지 마세요.
"""
    
    def _parse_claude_response(self, content: str) -> List[Dict]:
        """
        Claude 응답에서 JSON 데이터 추출 및 파싱
        """
        try:
            # JSON 부분만 추출 (```json ... ``` 블록 처리)
            content = content.strip()
            
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                json_str = content[start:end].strip()
            elif content.startswith('[') and content.endswith(']'):
                json_str = content
            else:
                # JSON 배열 부분 찾기
                start = content.find('[')
                end = content.rfind(']') + 1
                if start != -1 and end != 0:
                    json_str = content[start:end]
                else:
                    raise ValueError("No valid JSON array found in response")
            
            # JSON 파싱
            parsed_data = json.loads(json_str)
            
            # 데이터 검증 및 정제
            validated_data = []
            for item in parsed_data:
                if isinstance(item, dict) and all(key in item for key in ["Date", "Description", "Amount"]):
                    # 한국 통화 표기법 처리
                    amount = self._parse_korean_amount(item["Amount"])
                    
                    validated_item = {
                        "Date": str(item["Date"]),
                        "Description": str(item["Description"]),
                        "Amount": amount
                    }
                    validated_data.append(validated_item)
            
            return validated_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {str(e)}")
            logger.error(f"Content: {content}")
            raise ValueError(f"Invalid JSON response from Claude: {str(e)}")
        
        except Exception as e:
            logger.error(f"Response parsing failed: {str(e)}")
            raise ValueError(f"Failed to parse Claude response: {str(e)}")
    
    def _parse_korean_amount(self, amount_str) -> float:
        """
        한국 통화 표기법을 숫자로 변환
        """
        if isinstance(amount_str, (int, float)):
            return float(amount_str)
        
        if not isinstance(amount_str, str):
            return 0.0
        
        # 한국어 통화 기호 및 텍스트 제거
        cleaned = str(amount_str).strip()
        cleaned = cleaned.replace('₩', '').replace('원', '').replace(',', '').replace(' ', '')
        
        # 괄호로 둘러싸인 음수 처리 (예: (5,000))
        is_negative = False
        if cleaned.startswith('(') and cleaned.endswith(')'):
            cleaned = cleaned[1:-1]
            is_negative = True
        elif cleaned.startswith('-'):
            is_negative = True
            cleaned = cleaned[1:]
        elif cleaned.startswith('+'):
            cleaned = cleaned[1:]
        
        try:
            amount = float(cleaned)
            return -amount if is_negative else amount
        except ValueError:
            logger.warning(f"Could not parse amount: {amount_str}")
            return 0.0

    async def _format_ai_response(self, ai_response: Dict[str, Any]) -> TableData:
        """
        Format AI response into TableData structure
        
        Args:
            ai_response: Response from Claude AI service
            
        Returns:
            TableData object with headers and rows
        """
        try:
            # Expected AI response format:
            # {
            #     "headers": ["Date", "Description", "Amount", "Balance"],
            #     "rows": [
            #         ["2024-01-01", "Opening Balance", "", "1000.00"],
            #         ["2024-01-02", "ATM Withdrawal", "-50.00", "950.00"],
            #         ...
            #     ]
            # }
            
            headers = ai_response.get("headers", [])
            rows = ai_response.get("rows", [])
            
            # Validate data
            if not headers:
                raise ValueError("No headers provided in AI response")
            
            if not rows:
                raise ValueError("No data rows provided in AI response")
            
            return TableData(headers=headers, rows=rows)
            
        except Exception as e:
            raise ValueError(f"Failed to format AI response: {str(e)}")