"""
Wallet Input Validation and Sanitization Module
Comprehensive input validation, sanitization, and security checks
"""
import re
import html
import urllib.parse
import math
from typing import Any, Dict, List, Optional, Union
from decimal import Decimal, InvalidOperation

class WalletValidationModule:
    """Comprehensive input validation and sanitization"""
    
    def __init__(self):
        # Allowed HTML tags (none for security)
        self.allowed_tags = []
        self.allowed_attributes = {}
        
        # Regex patterns for validation
        self.patterns = {
            'user_id': re.compile(r'^[a-zA-Z0-9_-]{1,50}$'),
            'transaction_id': re.compile(r'^[a-zA-Z0-9_-]{1,100}$'),
            'description': re.compile(r'^[a-zA-Z0-9\s\-_.,!?()]{1,500}$'),
            'reference': re.compile(r'^[a-zA-Z0-9_-]{1,50}$'),
            'pin': re.compile(r'^\d{4,6}$'),
            'otp': re.compile(r'^\d{6}$'),
            'phone': re.compile(r'^\+?[1-9]\d{1,14}$'),
            'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        }
        
        # SQL injection patterns
        self.sql_patterns = [
            re.compile(r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)", re.IGNORECASE),
            re.compile(r"(--|#|/\*|\*/)", re.IGNORECASE),
            re.compile(r"(\b(OR|AND)\s+\d+\s*=\s*\d+)", re.IGNORECASE),
            re.compile(r"('|\"|`|;)", re.IGNORECASE)
        ]
        
        # XSS patterns
        self.xss_patterns = [
            re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL),
            re.compile(r"javascript:", re.IGNORECASE),
            re.compile(r"on\w+\s*=", re.IGNORECASE),
            re.compile(r"<iframe[^>]*>.*?</iframe>", re.IGNORECASE | re.DOTALL),
            re.compile(r"<object[^>]*>.*?</object>", re.IGNORECASE | re.DOTALL),
            re.compile(r"<embed[^>]*>", re.IGNORECASE),
            re.compile(r"<link[^>]*>", re.IGNORECASE),
            re.compile(r"<meta[^>]*>", re.IGNORECASE)
        ]
        
        # Path traversal patterns
        self.path_traversal_patterns = [
            re.compile(r"\.\.[\\/]", re.IGNORECASE),
            re.compile(r"[\\/]\.\.[\\/]", re.IGNORECASE),
            re.compile(r"%2e%2e[\\/]", re.IGNORECASE),
            re.compile(r"\.\.%2f", re.IGNORECASE),
            re.compile(r"%2e%2e%2f", re.IGNORECASE)
        ]
    
    def validate_user_id(self, user_id: Any) -> Dict[str, Any]:
        """Validate user ID"""
        if not isinstance(user_id, str):
            return {"valid": False, "error": "User ID must be a string"}
        
        if not user_id or len(user_id.strip()) == 0:
            return {"valid": False, "error": "User ID cannot be empty"}
        
        if not self.patterns['user_id'].match(user_id):
            return {"valid": False, "error": "Invalid user ID format"}
        
        # Check for SQL injection
        if self._contains_sql_injection(user_id):
            return {"valid": False, "error": "Invalid characters in user ID"}
        
        return {"valid": True, "sanitized": user_id.strip()}
    
    def validate_amount(self, amount: Any) -> Dict[str, Any]:
        """Validate monetary amount"""
        # Type validation
        if not isinstance(amount, (int, float, str, Decimal)):
            return {"valid": False, "error": "Amount must be a number"}
        
        try:
            # Convert to Decimal for precise handling
            if isinstance(amount, str):
                # Remove any non-numeric characters except decimal point and minus
                cleaned = re.sub(r'[^\d.-]', '', amount)
                decimal_amount = Decimal(cleaned)
            else:
                decimal_amount = Decimal(str(amount))
        except (InvalidOperation, ValueError):
            return {"valid": False, "error": "Invalid amount format"}
        
        # Check for special values
        if math.isnan(float(decimal_amount)) or math.isinf(float(decimal_amount)):
            return {"valid": False, "error": "Amount cannot be NaN or infinity"}
        
        # Range validation
        if decimal_amount < Decimal('-1000000000'):  # -1 billion
            return {"valid": False, "error": "Amount too small"}
        
        if decimal_amount > Decimal('1000000000'):  # 1 billion
            return {"valid": False, "error": "Amount too large"}
        
        # Precision validation (max 2 decimal places for currency)
        if decimal_amount.as_tuple().exponent < -2:
            return {"valid": False, "error": "Amount cannot have more than 2 decimal places"}
        
        return {"valid": True, "sanitized": float(decimal_amount)}
    
    def validate_description(self, description: Any) -> Dict[str, Any]:
        """Validate and sanitize description"""
        if not isinstance(description, str):
            return {"valid": False, "error": "Description must be a string"}
        
        if len(description) > 500:
            return {"valid": False, "error": "Description too long (max 500 characters)"}
        
        # Check for malicious content
        if self._contains_sql_injection(description):
            return {"valid": False, "error": "Invalid characters in description"}
        
        if self._contains_xss(description):
            return {"valid": False, "error": "Invalid content in description"}
        
        if self._contains_path_traversal(description):
            return {"valid": False, "error": "Invalid path characters in description"}
        
        # Sanitize the description
        sanitized = self._sanitize_text(description)
        
        return {"valid": True, "sanitized": sanitized}
    
    def validate_pin(self, pin: Any) -> Dict[str, Any]:
        """Validate PIN"""
        if not isinstance(pin, str):
            return {"valid": False, "error": "PIN must be a string"}
        
        if not self.patterns['pin'].match(pin):
            return {"valid": False, "error": "PIN must be 4-6 digits"}
        
        # Check for weak PINs
        if self._is_weak_pin(pin):
            return {"valid": False, "error": "PIN is too weak", "warning": True}
        
        return {"valid": True, "sanitized": pin}
    
    def validate_otp(self, otp: Any) -> Dict[str, Any]:
        """Validate OTP"""
        if not isinstance(otp, str):
            return {"valid": False, "error": "OTP must be a string"}
        
        if not self.patterns['otp'].match(otp):
            return {"valid": False, "error": "OTP must be 6 digits"}
        
        return {"valid": True, "sanitized": otp}
    
    def validate_transaction_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate complete transaction data"""
        errors = []
        sanitized_data = {}
        
        # Validate required fields
        required_fields = ['user_id', 'type', 'amount', 'description']
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        if errors:
            return {"valid": False, "errors": errors}
        
        # Validate each field
        user_id_result = self.validate_user_id(data['user_id'])
        if not user_id_result['valid']:
            errors.append(f"user_id: {user_id_result['error']}")
        else:
            sanitized_data['user_id'] = user_id_result['sanitized']
        
        amount_result = self.validate_amount(data['amount'])
        if not amount_result['valid']:
            errors.append(f"amount: {amount_result['error']}")
        else:
            sanitized_data['amount'] = amount_result['sanitized']
        
        description_result = self.validate_description(data['description'])
        if not description_result['valid']:
            errors.append(f"description: {description_result['error']}")
        else:
            sanitized_data['description'] = description_result['sanitized']
        
        # Validate transaction type
        valid_types = ['deposit', 'withdrawal', 'transfer', 'spray_money', 'interest', 'fee', 'topup', 'refund']
        if data['type'] not in valid_types:
            errors.append(f"Invalid transaction type: {data['type']}")
        else:
            sanitized_data['type'] = data['type']
        
        # Validate optional fields
        if 'reference' in data:
            if not self.patterns['reference'].match(str(data['reference'])):
                errors.append("Invalid reference format")
            else:
                sanitized_data['reference'] = str(data['reference'])
        
        if errors:
            return {"valid": False, "errors": errors}
        
        return {"valid": True, "sanitized_data": sanitized_data}
    
    def validate_wallet_type(self, wallet_type: Any) -> Dict[str, Any]:
        """Validate wallet type"""
        valid_types = ['main', 'savings', 'business', 'escrow']
        
        if not isinstance(wallet_type, str):
            return {"valid": False, "error": "Wallet type must be a string"}
        
        if wallet_type not in valid_types:
            return {"valid": False, "error": f"Invalid wallet type. Must be one of: {', '.join(valid_types)}"}
        
        return {"valid": True, "sanitized": wallet_type}
    
    def _contains_sql_injection(self, text: str) -> bool:
        """Check for SQL injection patterns"""
        for pattern in self.sql_patterns:
            if pattern.search(text):
                return True
        return False
    
    def _contains_xss(self, text: str) -> bool:
        """Check for XSS patterns"""
        for pattern in self.xss_patterns:
            if pattern.search(text):
                return True
        return False
    
    def _contains_path_traversal(self, text: str) -> bool:
        """Check for path traversal patterns"""
        for pattern in self.path_traversal_patterns:
            if pattern.search(text):
                return True
        return False
    
    def _sanitize_text(self, text: str) -> str:
        """Sanitize text content"""
        # HTML escape
        sanitized = html.escape(text)
        
        # URL decode to prevent double encoding attacks
        sanitized = urllib.parse.unquote(sanitized)
        
        # Remove any remaining dangerous characters
        sanitized = re.sub(r'[<>"\']', '', sanitized)
        
        # Remove script tags and other dangerous HTML
        sanitized = re.sub(r'<script[^>]*>.*?</script>', '', sanitized, flags=re.IGNORECASE | re.DOTALL)
        sanitized = re.sub(r'<iframe[^>]*>.*?</iframe>', '', sanitized, flags=re.IGNORECASE | re.DOTALL)
        sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r'on\w+\s*=', '', sanitized, flags=re.IGNORECASE)
        
        return sanitized.strip()
    
    def _is_weak_pin(self, pin: str) -> bool:
        """Check if PIN is weak"""
        weak_pins = [
            '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
            '1234', '4321', '0123', '3210', '1122', '2211', '1212', '2121',
            '0000', '1234', '4321', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'
        ]
        
        # Check for common weak patterns
        if pin in weak_pins:
            return True
        
        # Check for sequential numbers
        if len(set(pin)) == 1:  # All same digits
            return True
        
        # Check for ascending/descending sequences
        ascending = all(int(pin[i]) == int(pin[i-1]) + 1 for i in range(1, len(pin)))
        descending = all(int(pin[i]) == int(pin[i-1]) - 1 for i in range(1, len(pin)))
        
        if ascending or descending:
            return True
        
        return False
    
    def sanitize_for_logging(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize data for safe logging"""
        sanitized = {}
        sensitive_fields = ['pin', 'otp', 'password', 'token', 'secret']
        
        for key, value in data.items():
            if any(field in key.lower() for field in sensitive_fields):
                sanitized[key] = "***REDACTED***"
            elif isinstance(value, str) and len(value) > 100:
                sanitized[key] = value[:100] + "..."
            else:
                sanitized[key] = value
        
        return sanitized
    
    def validate_batch_operations(self, operations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate a batch of operations"""
        if not isinstance(operations, list):
            return {"valid": False, "error": "Operations must be a list"}
        
        if len(operations) > 100:  # Limit batch size
            return {"valid": False, "error": "Batch size too large (max 100 operations)"}
        
        errors = []
        sanitized_operations = []
        
        for i, operation in enumerate(operations):
            if not isinstance(operation, dict):
                errors.append(f"Operation {i}: Must be a dictionary")
                continue
            
            validation_result = self.validate_transaction_data(operation)
            if not validation_result['valid']:
                errors.append(f"Operation {i}: {', '.join(validation_result['errors'])}")
            else:
                sanitized_operations.append(validation_result['sanitized_data'])
        
        if errors:
            return {"valid": False, "errors": errors}
        
        return {"valid": True, "sanitized_operations": sanitized_operations}