import hashlib
import hmac
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from functools import wraps
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from .config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encryption setup
def _get_encryption_key() -> bytes:
    """Get encryption key from settings"""
    if not hasattr(settings, 'ENCRYPTION_KEY') or not settings.ENCRYPTION_KEY:
        # Generate a key if not provided
        salt = b'agricredit_salt_2024'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    else:
        key = settings.ENCRYPTION_KEY.encode()
    return key

fernet = Fernet(_get_encryption_key())

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return username"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

def create_api_key() -> str:
    """Create a secure API key"""
    import secrets
    return secrets.token_urlsafe(32)

def hash_api_key(api_key: str) -> str:
    """Hash an API key for storage"""
    return pwd_context.hash(api_key)

def verify_api_key(plain_api_key: str, hashed_api_key: str) -> bool:
    """Verify an API key"""
    return pwd_context.verify(plain_api_key, hashed_api_key)

# Enhanced security functions
def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    return fernet.decrypt(encrypted_data.encode()).decode()

def hash_sensitive_data(data: str, salt: Optional[str] = None) -> str:
    """Hash sensitive data with salt"""
    if salt is None:
        salt = secrets.token_hex(16)
    salted_data = f"{data}{salt}"
    return hashlib.sha256(salted_data.encode()).hexdigest() + f":{salt}"

def verify_sensitive_data(data: str, hashed_data: str) -> bool:
    """Verify sensitive data against hash"""
    if ":" not in hashed_data:
        return False
    stored_hash, salt = hashed_data.rsplit(":", 1)
    salted_data = f"{data}{salt}"
    return hmac.compare_digest(
        hashlib.sha256(salted_data.encode()).hexdigest(),
        stored_hash
    )

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure token"""
    return secrets.token_urlsafe(length)

def sanitize_input(input_str: str, max_length: int = 1000) -> str:
    """Sanitize user input to prevent injection attacks"""
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", ';', '--', '/*', '*/']
    sanitized = input_str

    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')

    # Limit length
    return sanitized[:max_length].strip()

def validate_email_format(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength"""
    checks = {
        'length': len(password) >= 8,
        'uppercase': bool(any(c.isupper() for c in password)),
        'lowercase': bool(any(c.islower() for c in password)),
        'digits': bool(any(c.isdigit() for c in password)),
        'special_chars': bool(any(not c.isalnum() for c in password))
    }

    score = sum(checks.values())
    strength = 'weak' if score < 3 else 'medium' if score < 5 else 'strong'

    return {
        'is_valid': score >= 4,
        'strength': strength,
        'checks': checks
    }

def audit_log(action: str, user_id: Optional[str] = None, details: Optional[Dict] = None, ip_address: Optional[str] = None):
    """Log security-related actions"""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'action': action,
        'user_id': user_id,
        'ip_address': ip_address,
        'details': details or {}
    }

    logger.info(f"SECURITY_AUDIT: {log_entry}")

def rate_limit_check(identifier: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
    """Check if request is within rate limits"""
    # This would typically use Redis for distributed rate limiting
    # For now, return True (allow all)
    return True

def detect_suspicious_activity(request: Request, user_id: Optional[str] = None) -> List[str]:
    """Detect suspicious activity patterns"""
    warnings = []

    # Check for rapid requests
    if not rate_limit_check(f"requests:{user_id or request.client.host}", 100, 3600):
        warnings.append("Rate limit exceeded")

    # Check for unusual user agents
    user_agent = request.headers.get('user-agent', '')
    if not user_agent or len(user_agent) < 10:
        warnings.append("Suspicious user agent")

    # Check for unusual IP patterns (simplified)
    client_ip = request.client.host
    if client_ip and client_ip.startswith(('10.', '172.', '192.168.')):
        warnings.append("Internal IP access")

    return warnings

def create_refresh_token(user_id: str) -> str:
    """Create a long-lived refresh token"""
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": secrets.token_hex(16)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_refresh_token(token: str) -> Optional[str]:
    """Verify refresh token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None

def blacklist_token(token: str):
    """Add token to blacklist (would use Redis in production)"""
    # In production, store in Redis with expiration
    logger.info(f"Token blacklisted: {token[:20]}...")

def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted"""
    # In production, check Redis
    return False

# Security middleware decorators
def require_auth(func):
    """Decorator to require authentication"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request = kwargs.get('request')
        if not request:
            for arg in args:
                if hasattr(arg, 'headers'):
                    request = arg
                    break

        if not request:
            raise HTTPException(status_code=401, detail="Authentication required")

        auth_header = request.headers.get('authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        token = auth_header.split(' ')[1]
        if is_token_blacklisted(token):
            raise HTTPException(status_code=401, detail="Token has been revoked")

        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Add user_id to request state
        request.state.user_id = user_id
        return await func(*args, **kwargs)
    return wrapper

def require_role(required_role: str):
    """Decorator to require specific role"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get('request')
            if not request or not hasattr(request.state, 'user_id'):
                raise HTTPException(status_code=401, detail="Authentication required")

            # In production, check user roles from database
            user_role = "user"  # Mock role
            if user_role != required_role:
                raise HTTPException(status_code=403, detail="Insufficient permissions")

            return await func(*args, **kwargs)
        return wrapper
    return decorator

def security_middleware(request: Request):
    """Security middleware to check all requests"""
    # Detect suspicious activity
    warnings = detect_suspicious_activity(request)

    if warnings:
        logger.warning(f"Security warnings for {request.client.host}: {warnings}")
        audit_log(
            "suspicious_activity",
            ip_address=request.client.host,
            details={"warnings": warnings, "path": request.url.path}
        )

    # Add security headers
    request.state.security_headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }