from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
import hmac
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

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

# Multi-Factor Authentication (MFA) Functions
def generate_mfa_secret() -> str:
    """Generate a new MFA secret"""
    return pyotp.random_base32()

def generate_mfa_uri(username: str, secret: str, issuer: str = "AgriCredit") -> str:
    """Generate MFA URI for QR code"""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer)

def generate_qr_code(uri: str) -> str:
    """Generate QR code as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()

def verify_mfa_code(secret: str, code: str) -> bool:
    """Verify MFA code"""
    totp = pyotp.TOTP(secret)
    return totp.verify(code)

def generate_backup_codes() -> list:
    """Generate backup codes for MFA"""
    codes = []
    for _ in range(10):
        code = secrets.token_hex(4).upper()
        codes.append(code)
    return codes

def hash_backup_code(code: str) -> str:
    """Hash backup code for storage"""
    return hashlib.sha256(code.encode()).hexdigest()

def verify_backup_code(hashed_codes: list, code: str) -> tuple:
    """Verify backup code and return updated list"""
    code_hash = hash_backup_code(code)
    if code_hash in hashed_codes:
        hashed_codes.remove(code_hash)
        return True, hashed_codes
    return False, hashed_codes

# Advanced Security Functions
def generate_api_key() -> str:
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)

def hash_api_key(api_key: str) -> str:
    """Hash API key for storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()

def verify_api_key(hashed_key: str, provided_key: str) -> bool:
    """Verify API key using constant-time comparison"""
    return hmac.compare_digest(hashed_key, hash_api_key(provided_key))

def generate_device_fingerprint(request) -> str:
    """Generate device fingerprint from request"""
    fingerprint_data = [
        request.headers.get('User-Agent', ''),
        request.client.host if request.client else '',
        request.headers.get('Accept-Language', ''),
        request.headers.get('Accept-Encoding', ''),
    ]

    fingerprint_string = '|'.join(fingerprint_data)
    return hashlib.sha256(fingerprint_string.encode()).hexdigest()

def check_suspicious_activity(user_id: str, device_fingerprint: str,
                            recent_activities: list) -> Dict[str, Any]:
    """Check for suspicious user activity"""
    suspicious_flags = []

    # Check for multiple device fingerprints
    fingerprints = set(activity.get('device_fingerprint') for activity in recent_activities)
    if len(fingerprints) > 3:
        suspicious_flags.append("multiple_devices")

    # Check for unusual login times
    current_hour = datetime.now().hour
    unusual_hours = [activity for activity in recent_activities
                    if abs(activity.get('hour', 12) - current_hour) > 8]
    if len(unusual_hours) > len(recent_activities) * 0.3:
        suspicious_flags.append("unusual_timing")

    # Check for rapid successive logins
    if len(recent_activities) >= 3:
        timestamps = sorted([activity.get('timestamp') for activity in recent_activities])
        time_diffs = [(timestamps[i+1] - timestamps[i]).total_seconds()
                     for i in range(len(timestamps)-1)]
        rapid_logins = sum(1 for diff in time_diffs if diff < 60)  # Less than 1 minute apart
        if rapid_logins >= 2:
            suspicious_flags.append("rapid_logins")

    risk_level = "low"
    if len(suspicious_flags) >= 2:
        risk_level = "high"
    elif len(suspicious_flags) == 1:
        risk_level = "medium"

    return {
        "is_suspicious": len(suspicious_flags) > 0,
        "risk_level": risk_level,
        "flags": suspicious_flags,
        "recommendations": _generate_security_recommendations(risk_level)
    }

def _generate_security_recommendations(risk_level: str) -> list:
    """Generate security recommendations based on risk level"""
    recommendations = []

    if risk_level == "high":
        recommendations.extend([
            "Enable two-factor authentication immediately",
            "Review recent account activity",
            "Change password and revoke suspicious sessions",
            "Contact support if unauthorized activity suspected"
        ])
    elif risk_level == "medium":
        recommendations.extend([
            "Review login locations and devices",
            "Consider enabling additional security measures",
            "Monitor account activity closely"
        ])
    else:
        recommendations.append("Account activity appears normal")

    return recommendations