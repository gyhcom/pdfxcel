import os
import aiofiles
from typing import Dict, Optional
import asyncio
from datetime import datetime, timedelta

class FileManager:
    """
    Utility class for managing temporary file storage and cleanup
    """
    
    # In-memory storage for file information
    # In production, this should be replaced with a database or Redis
    _file_registry: Dict[str, Dict] = {}
    
    # Base directory for temporary files
    TEMP_DIR = "temp_files"
    
    @classmethod
    async def save_temp_file(cls, content: bytes, file_id: str, extension: str) -> str:
        """
        Save content to a temporary file
        
        Args:
            content: File content as bytes
            file_id: Unique identifier for the file
            extension: File extension (without dot)
            
        Returns:
            Path to the saved file
        """
        try:
            # Ensure temp directory exists
            os.makedirs(cls.TEMP_DIR, exist_ok=True)
            
            # Generate file path
            filename = f"{file_id}.{extension}"
            file_path = os.path.join(cls.TEMP_DIR, filename)
            
            # Save file asynchronously
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            return file_path
            
        except Exception as e:
            raise Exception(f"Failed to save temporary file: {str(e)}")
    
    @classmethod
    async def get_temp_file_path(cls, file_id: str, extension: str) -> str:
        """
        Get the path for a temporary file
        
        Args:
            file_id: Unique identifier for the file
            extension: File extension (without dot)
            
        Returns:
            Path where the file should be saved
        """
        # Ensure temp directory exists
        os.makedirs(cls.TEMP_DIR, exist_ok=True)
        
        filename = f"{file_id}.{extension}"
        return os.path.join(cls.TEMP_DIR, filename)
    
    @classmethod
    async def register_file(cls, file_id: str, file_path: str) -> None:
        """
        Register a file in the file registry for download tracking
        
        Args:
            file_id: Unique identifier for the file
            file_path: Path to the file
        """
        cls._file_registry[file_id] = {
            "path": file_path,
            "created_at": datetime.now(),
            "filename": os.path.basename(file_path)
        }
    
    @classmethod
    async def get_file_info(cls, file_id: str) -> Optional[Dict]:
        """
        Get file information from registry
        
        Args:
            file_id: Unique identifier for the file
            
        Returns:
            File information dict or None if not found
        """
        return cls._file_registry.get(file_id)
    
    @classmethod
    async def delete_file(cls, file_id: str) -> bool:
        """
        Delete a file and remove it from registry
        
        Args:
            file_id: Unique identifier for the file
            
        Returns:
            True if file was deleted, False if not found
        """
        try:
            file_info = cls._file_registry.get(file_id)
            
            if not file_info:
                return False
            
            file_path = file_info["path"]
            
            # Delete physical file if it exists
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Remove from registry
            del cls._file_registry[file_id]
            
            return True
            
        except Exception:
            return False
    
    @classmethod
    async def cleanup_old_files(cls, hours: int = 24) -> int:
        """
        Clean up files older than specified hours
        
        Args:
            hours: Files older than this will be deleted
            
        Returns:
            Number of files deleted
        """
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            files_deleted = 0
            
            # Create a copy of the registry keys to avoid modification during iteration
            file_ids_to_check = list(cls._file_registry.keys())
            
            for file_id in file_ids_to_check:
                file_info = cls._file_registry.get(file_id)
                
                if file_info and file_info["created_at"] < cutoff_time:
                    if await cls.delete_file(file_id):
                        files_deleted += 1
            
            return files_deleted
            
        except Exception:
            return 0
    
    @classmethod
    async def get_registry_stats(cls) -> Dict:
        """
        Get statistics about the file registry
        
        Returns:
            Dictionary with registry statistics
        """
        total_files = len(cls._file_registry)
        
        # Calculate total size
        total_size = 0
        for file_info in cls._file_registry.values():
            try:
                if os.path.exists(file_info["path"]):
                    total_size += os.path.getsize(file_info["path"])
            except Exception:
                continue
        
        return {
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        }