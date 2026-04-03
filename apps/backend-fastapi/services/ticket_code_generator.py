"""
Ticket Code Generator
Generates unique 11-character ticket codes: XXXX-1234567 (4 letters - 7 numbers)
"""
import random
import string
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class TicketCodeGenerator:
    """Generate unique ticket codes in format: XXXX-1234567"""
    
    @staticmethod
    def generate_code() -> str:
        """
        Generate ticket code: 4 uppercase letters + 7 digits
        Format: XXXX-1234567
        Example: ABCD-1234567
        """
        letters = ''.join(random.choices(string.ascii_uppercase, k=4))
        numbers = ''.join(random.choices(string.digits, k=7))
        return f"{letters}-{numbers}"
    
    @staticmethod
    def validate_code_format(code: str) -> bool:
        """Validate ticket code format"""
        if not code or len(code) != 12:  # 4 letters + 1 dash + 7 numbers
            return False
        
        parts = code.split('-')
        if len(parts) != 2:
            return False
        
        letters, numbers = parts
        
        # Check format: 4 uppercase letters, 7 digits
        if len(letters) != 4 or not letters.isupper() or not letters.isalpha():
            return False
        
        if len(numbers) != 7 or not numbers.isdigit():
            return False
        
        return True
    
    @staticmethod
    async def generate_unique_code(supabase_client, max_attempts: int = 10) -> Optional[str]:
        """
        Generate a unique ticket code that doesn't exist in database
        
        Args:
            supabase_client: Supabase client instance
            max_attempts: Maximum attempts to generate unique code
            
        Returns:
            Unique ticket code or None if failed
        """
        for attempt in range(max_attempts):
            code = TicketCodeGenerator.generate_code()
            
            try:
                # Check if code already exists
                result = supabase_client.table('tickets').select('id').eq('ticket_code', code).execute()
                
                if not result.data or len(result.data) == 0:
                    # Code is unique
                    logger.info(f"Generated unique ticket code: {code}")
                    return code
                else:
                    logger.warning(f"Ticket code collision: {code} (attempt {attempt + 1}/{max_attempts})")
                    
            except Exception as e:
                logger.error(f"Error checking ticket code uniqueness: {e}")
                return None
        
        logger.error(f"Failed to generate unique ticket code after {max_attempts} attempts")
        return None

# Global instance
ticket_code_generator = TicketCodeGenerator()
