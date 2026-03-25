"""
Secure Configuration Management
Handles environment variables and secrets securely
"""

import os
import secrets
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class SecureConfig:
    """Secure configuration management with validation"""
    
    def __init__(self):
        self.environment = self.get_environment()
        self.validate_production_config()
    
    def get_environment(self) -> str:
        """Get current environment with validation"""
        env = os.getenv("ENVIRONMENT", "production").lower()
        if env not in ["development", "staging", "production"]:
            logger.warning(f"Invalid environment '{env}', defaulting to production")
            return "production"
        return env
    
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"
    
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"
    
    def get_required_env(self, key: str, description: str = "") -> str:
        """Get required environment variable with validation"""
        value = os.getenv(key)
        if not value:
            error_msg = f"Required environment variable '{key}' is not set"
            if description:
                error_msg += f" ({description})"
            logger.error(error_msg)
            raise ValueError(error_msg)
        return value
    
    def get_optional_env(self, key: str, default: str = "", mask_in_logs: bool = False) -> str:
        """Get optional environment variable"""
        value = os.getenv(key, default)
        if mask_in_logs and value:
            logger.info(f"Loaded {key}: {'*' * min(len(value), 8)}")
        else:
            logger.info(f"Loaded {key}: {value}")
        return value
    
    def validate_production_config(self):
        """Validate configuration for production environment"""
        if not self.is_production():
            return
        
        # Production security checks
        security_issues = []
        
        # Check for development flags in production
        if os.getenv("ENABLE_MOCK_TOKENS", "false").lower() == "true":
            security_issues.append("Mock tokens are enabled in production")
        
        if os.getenv("ENABLE_TEST_USERS", "false").lower() == "true":
            security_issues.append("Test users are enabled in production")
        
        if os.getenv("DEBUG", "false").lower() == "true":
            security_issues.append("Debug mode is enabled in production")
        
        # Check for placeholder secrets
        jwt_secret = os.getenv("JWT_SECRET", "")
        if "change-in-production" in jwt_secret.lower():
            security_issues.append("JWT secret contains placeholder text")
        
        # Check for missing required production variables
        required_prod_vars = [
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY", 
            "SUPABASE_SERVICE_KEY",
            "JWT_SECRET",
            "DATABASE_URL"
        ]
        
        for var in required_prod_vars:
            if not os.getenv(var):
                security_issues.append(f"Required production variable '{var}' is not set")
        
        if security_issues:
            error_msg = "PRODUCTION SECURITY ISSUES DETECTED:\n" + "\n".join(f"- {issue}" for issue in security_issues)
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        logger.info("✅ Production configuration validation passed")
    
    def generate_secure_secret(self, length: int = 32) -> str:
        """Generate cryptographically secure secret"""
        return secrets.token_urlsafe(length)
    
    def mask_sensitive_value(self, value: str, show_chars: int = 4) -> str:
        """Mask sensitive values for logging"""
        if len(value) <= show_chars * 2:
            return "*" * len(value)
        return value[:show_chars] + "*" * (len(value) - show_chars * 2) + value[-show_chars:]

# Global secure config instance
secure_config = SecureConfig()