"""
Authentication service for user management
"""
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
import string
from database import supabase_client
from config import settings
import logging

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.supabase = supabase_client.get_service_client()
        if not self.supabase:
            logger.warning("Supabase not configured, auth service will use mock responses")
    
    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, data: dict) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    
    def create_refresh_token(self, data: dict) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_refresh_secret, algorithm=settings.jwt_algorithm)
    
    def verify_token(self, token: str, secret: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
            return payload
        except JWTError:
            return None
    
    def generate_referral_code(self) -> str:
        """Generate unique referral code"""
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    
    def normalize_phone_number(self, phone: str) -> str:
        """Normalize phone number to +234 format"""
        if phone.startswith('+234'):
            return phone
        elif phone.startswith('234'):
            return f'+{phone}'
        elif phone.startswith('0'):
            return f'+234{phone[1:]}'
        return phone
    
    async def register_user(self, user_data: dict) -> Dict[str, Any]:
        """Register a new user"""
        try:
            # Normalize phone number
            phone_number = self.normalize_phone_number(user_data['phone_number'])
            
            # Check if user already exists
            existing_user = self.supabase.table('users').select('id').eq('phone_number', phone_number).execute()
            if existing_user.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'USER_EXISTS',
                        'message': 'Phone number already registered'
                    }
                }
            
            # Check email if provided
            if user_data.get('email'):
                existing_email = self.supabase.table('users').select('id').eq('email', user_data['email']).execute()
                if existing_email.data:
                    return {
                        'success': False,
                        'error': {
                            'code': 'EMAIL_EXISTS',
                            'message': 'Email address already registered'
                        }
                    }
            
            # Validate required role field
            if not user_data.get('role'):
                return {
                    'success': False,
                    'error': {
                        'code': 'MISSING_ROLE',
                        'message': 'User role is required'
                    }
                }
            
            # Validate role value
            valid_roles = ['attendee', 'organizer']
            if user_data['role'] not in valid_roles:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_ROLE',
                        'message': f'Role must be one of: {", ".join(valid_roles)}'
                    }
                }
            
            # Hash password
            hashed_password = self.hash_password(user_data['password'])
            
            # Generate referral code
            referral_code = self.generate_referral_code()
            
            # Create user record
            user_record = {
                'phone_number': phone_number,
                'password': hashed_password,
                'phone_verified': True,  # Auto-verify for now
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'email': user_data.get('email'),
                'state': user_data['state'],
                'preferred_language': user_data.get('preferred_language', 'en'),
                'role': user_data['role'],  # Use direct access since we validated it exists
                'organization_name': user_data.get('organization_name'),
                'organization_type': user_data.get('organization_type'),
                'referral_code': referral_code,
                'wallet_balance': 0.0,
                'is_verified': False,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Insert user
            result = self.supabase.table('users').insert(user_record).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'INTERNAL_ERROR',
                        'message': 'Failed to create user'
                    }
                }
            
            user = result.data[0]
            
            # Generate tokens
            token_data = {
                'user_id': user['id'],
                'phone_number': user['phone_number'],
                'role': user['role'],
                'state': user['state']
            }
            
            access_token = self.create_access_token(token_data)
            refresh_token = self.create_refresh_token({'user_id': user['id']})
            
            return {
                'success': True,
                'message': 'Registration successful',
                'data': {
                    'user': {
                        'id': user['id'],
                        'phone_number': user['phone_number'],
                        'first_name': user['first_name'],
                        'last_name': user['last_name'],
                        'email': user.get('email'),
                        'state': user['state'],
                        'role': user['role'],
                        'wallet_balance': user['wallet_balance'],
                        'referral_code': user['referral_code'],
                        'organization_name': user.get('organization_name'),
                        'organization_type': user.get('organization_type'),
                        'is_verified': user['is_verified'],
                        'created_at': user['created_at']
                    },
                    'access_token': access_token,
                    'refresh_token': refresh_token
                }
            }
            
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to register user'
                }
            }
    
    async def login_user(self, phone_number: str, password: str) -> Dict[str, Any]:
        """Login user with phone and password"""
        try:
            # Normalize phone number
            normalized_phone = self.normalize_phone_number(phone_number)
            
            # Find user
            result = self.supabase.table('users').select('*').eq('phone_number', normalized_phone).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_CREDENTIALS',
                        'message': 'Invalid phone number or password'
                    }
                }
            
            user = result.data[0]
            
            # Verify password
            if not user.get('password') or not self.verify_password(password, user['password']):
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_CREDENTIALS',
                        'message': 'Invalid phone number or password'
                    }
                }
            
            # Generate tokens
            token_data = {
                'user_id': user['id'],
                'phone_number': user['phone_number'],
                'role': user['role'],
                'state': user['state']
            }
            
            access_token = self.create_access_token(token_data)
            refresh_token = self.create_refresh_token({'user_id': user['id']})
            
            return {
                'success': True,
                'message': 'Login successful',
                'data': {
                    'user': {
                        'id': user['id'],
                        'phone_number': user['phone_number'],
                        'first_name': user['first_name'],
                        'last_name': user['last_name'],
                        'email': user.get('email'),
                        'state': user['state'],
                        'role': user['role'],
                        'wallet_balance': user.get('wallet_balance', 0.0),
                        'referral_code': user.get('referral_code', ''),
                        'organization_name': user.get('organization_name'),
                        'organization_type': user.get('organization_type'),
                        'is_verified': user.get('is_verified', False),
                        'created_at': user['created_at']
                    },
                    'access_token': access_token,
                    'refresh_token': refresh_token
                }
            }
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to login'
                }
            }
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Get user error: {e}")
            return None
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        try:
            # Verify refresh token
            payload = self.verify_token(refresh_token, settings.jwt_refresh_secret)
            if not payload:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid refresh token'
                    }
                }
            
            # Get user
            user = await self.get_user_by_id(payload['user_id'])
            if not user:
                return {
                    'success': False,
                    'error': {
                        'code': 'USER_NOT_FOUND',
                        'message': 'User not found'
                    }
                }
            
            # Generate new access token
            token_data = {
                'user_id': user['id'],
                'phone_number': user['phone_number'],
                'role': user['role'],
                'state': user['state']
            }
            
            access_token = self.create_access_token(token_data)
            
            return {
                'success': True,
                'message': 'Token refreshed successfully',
                'access_token': access_token
            }
            
        except Exception as e:
            logger.error(f"Refresh token error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to refresh token'
                }
            }

# Global auth service instance
auth_service = AuthService()