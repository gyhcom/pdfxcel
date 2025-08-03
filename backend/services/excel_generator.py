import xlsxwriter
import os
from typing import List, Any
from models.schemas import TableData
from utils.file_manager import FileManager

class ExcelGenerator:
    """
    Service for generating Excel files from table data using xlsxwriter
    """
    
    async def create_excel(self, table_data: TableData, file_id: str) -> str:
        """
        Create Excel file from table data
        
        Args:
            table_data: TableData object with headers and rows
            file_id: Unique identifier for the file
            
        Returns:
            Path to the generated Excel file
        """
        try:
            excel_path = await FileManager.get_temp_file_path(file_id, "xlsx")
            
            # Create workbook and worksheet
            workbook = xlsxwriter.Workbook(excel_path)
            worksheet = workbook.add_worksheet('Bank Statement')
            
            # Define formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4CAF50',
                'font_color': 'white',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })
            
            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })
            
            number_format = workbook.add_format({
                'border': 1,
                'align': 'right',
                'valign': 'vcenter',
                'num_format': '#,##0.00'
            })
            
            # Write headers
            for col, header in enumerate(table_data.headers):
                worksheet.write(0, col, header, header_format)
                
                # Auto-adjust column width based on header length
                worksheet.set_column(col, col, max(len(header) + 2, 12))
            
            # Write data rows
            for row_idx, row in enumerate(table_data.rows, start=1):
                for col_idx, cell_value in enumerate(row):
                    # Try to detect if the cell contains a number (amount)
                    if self._is_numeric_value(cell_value):
                        try:
                            numeric_value = self._parse_numeric_value(cell_value)
                            worksheet.write(row_idx, col_idx, numeric_value, number_format)
                        except ValueError:
                            worksheet.write(row_idx, col_idx, cell_value, cell_format)
                    else:
                        worksheet.write(row_idx, col_idx, cell_value, cell_format)
            
            # Add auto-filter to the data
            if table_data.headers and table_data.rows:
                last_row = len(table_data.rows)
                last_col = len(table_data.headers) - 1
                worksheet.autofilter(0, 0, last_row, last_col)
            
            # Freeze the header row
            worksheet.freeze_panes(1, 0)
            
            # Add summary information
            if table_data.rows:
                self._add_summary_sheet(workbook, table_data)
            
            workbook.close()
            
            return excel_path
            
        except Exception as e:
            raise Exception(f"Failed to create Excel file: {str(e)}")
    
    def _is_numeric_value(self, value: str) -> bool:
        """
        Check if a string value represents a numeric amount
        """
        if not isinstance(value, str):
            return False
        
        # Clean the value
        cleaned = value.strip().replace(',', '').replace('$', '').replace('₩', '')
        
        # Check for negative values in parentheses (100.00) or with minus sign
        if cleaned.startswith('(') and cleaned.endswith(')'):
            cleaned = cleaned[1:-1]
        
        try:
            float(cleaned)
            return True
        except ValueError:
            return False
    
    def _parse_numeric_value(self, value: str) -> float:
        """
        Parse string value to numeric value
        """
        if not isinstance(value, str):
            return float(value)
        
        cleaned = value.strip().replace(',', '').replace('$', '').replace('₩', '')
        
        # Handle negative values in parentheses
        is_negative = False
        if cleaned.startswith('(') and cleaned.endswith(')'):
            cleaned = cleaned[1:-1]
            is_negative = True
        elif cleaned.startswith('-'):
            is_negative = True
            cleaned = cleaned[1:]
        
        numeric_value = float(cleaned)
        return -numeric_value if is_negative else numeric_value
    
    def _add_summary_sheet(self, workbook: xlsxwriter.Workbook, table_data: TableData):
        """
        Add a summary sheet with basic statistics
        """
        try:
            summary_sheet = workbook.add_worksheet('Summary')
            
            # Define formats
            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'bg_color': '#2196F3',
                'font_color': 'white',
                'border': 1,
                'align': 'center'
            })
            
            label_format = workbook.add_format({
                'bold': True,
                'border': 1,
                'bg_color': '#E3F2FD'
            })
            
            value_format = workbook.add_format({
                'border': 1,
                'num_format': '#,##0.00'
            })
            
            # Add title
            summary_sheet.merge_range(0, 0, 0, 1, 'Bank Statement Summary', title_format)
            
            # Add basic statistics
            row = 2
            summary_sheet.write(row, 0, 'Total Records:', label_format)
            summary_sheet.write(row, 1, len(table_data.rows), value_format)
            
            row += 1
            summary_sheet.write(row, 0, 'Columns:', label_format)
            summary_sheet.write(row, 1, len(table_data.headers), value_format)
            
            # Set column widths
            summary_sheet.set_column(0, 0, 20)
            summary_sheet.set_column(1, 1, 15)
            
        except Exception:
            # If summary creation fails, continue without it
            pass