"""
Enhanced API utilities for AgriCredit backend
Provides pagination, filtering, sorting, and response formatting
"""

from typing import Dict, List, Any, Optional, Generic, TypeVar, Union
from fastapi import HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Query as SQLQuery
from sqlalchemy import desc, asc
import math
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')

class PaginationParams(BaseModel):
    """Standard pagination parameters"""
    page: int = Field(1, ge=1, description="Page number (1-based)")
    size: int = Field(50, ge=1, le=1000, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")

class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response format"""
    data: List[T]
    pagination: Dict[str, Any] = Field(..., description="Pagination metadata")
    meta: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class FilterParams(BaseModel):
    """Common filter parameters"""
    search: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    category: Optional[str] = None

class APIResponse:
    """Enhanced API response utilities"""

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Operation successful",
        status_code: int = 200,
        meta: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """Create a standardized success response"""
        response_data = {
            "success": True,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }

        if data is not None:
            response_data["data"] = data

        if meta:
            response_data["meta"] = meta

        return JSONResponse(
            content=response_data,
            status_code=status_code
        )

    @staticmethod
    def error(
        message: str = "An error occurred",
        status_code: int = 500,
        errors: Optional[List[Dict[str, Any]]] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """Create a standardized error response"""
        response_data = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }

        if errors:
            response_data["errors"] = errors

        if details:
            response_data["details"] = details

        return JSONResponse(
            content=response_data,
            status_code=status_code
        )

class PaginationHelper:
    """Helper class for database pagination"""

    @staticmethod
    def paginate_query(
        query: SQLQuery,
        pagination: PaginationParams,
        model_class: Any = None
    ) -> Dict[str, Any]:
        """Paginate a SQLAlchemy query and return paginated results"""

        # Apply sorting
        if pagination.sort_by and hasattr(model_class, pagination.sort_by):
            sort_column = getattr(model_class, pagination.sort_by)
            if pagination.sort_order == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))

        # Get total count
        total_items = query.count()

        # Apply pagination
        offset = (pagination.page - 1) * pagination.size
        items = query.offset(offset).limit(pagination.size).all()

        # Calculate pagination metadata
        total_pages = math.ceil(total_items / pagination.size)

        pagination_meta = {
            "page": pagination.page,
            "size": pagination.size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": pagination.page < total_pages,
            "has_prev": pagination.page > 1,
            "next_page": pagination.page + 1 if pagination.page < total_pages else None,
            "prev_page": pagination.page - 1 if pagination.page > 1 else None
        }

        return {
            "items": items,
            "pagination": pagination_meta
        }

class FilterHelper:
    """Helper class for applying filters to queries"""

    @staticmethod
    def apply_filters(
        query: SQLQuery,
        model_class: Any,
        filters: Dict[str, Any]
    ) -> SQLQuery:
        """Apply common filters to a SQLAlchemy query"""

        # Text search
        if filters.get("search"):
            search_term = f"%{filters['search']}%"
            # This is a basic implementation - in practice, you'd define searchable fields per model
            if hasattr(model_class, 'name'):
                query = query.filter(model_class.name.ilike(search_term))
            elif hasattr(model_class, 'title'):
                query = query.filter(model_class.title.ilike(search_term))

        # Status filter
        if filters.get("status") and hasattr(model_class, 'status'):
            query = query.filter(model_class.status == filters["status"])

        # Date range filters
        if filters.get("date_from") and hasattr(model_class, 'created_at'):
            query = query.filter(model_class.created_at >= filters["date_from"])

        if filters.get("date_to") and hasattr(model_class, 'created_at'):
            query = query.filter(model_class.created_at <= filters["date_to"])

        # Category filter
        if filters.get("category") and hasattr(model_class, 'category'):
            query = query.filter(model_class.category == filters["category"])

        return query

class ValidationHelper:
    """Helper class for input validation"""

    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> bool:
        """Validate latitude and longitude values"""
        return -90 <= latitude <= 90 and -180 <= longitude <= 180

    @staticmethod
    def validate_phone_number(phone: str) -> bool:
        """Basic phone number validation"""
        import re
        # Simple international phone number pattern
        pattern = r'^\+?[\d\s\-\(\)]{10,}$'
        return bool(re.match(pattern, phone.strip()))

    @staticmethod
    def validate_email_domain(email: str) -> bool:
        """Check if email domain is valid (basic check)"""
        import re
        # Extract domain and check for common valid TLDs
        domain_match = re.search(r'@([a-zA-Z0-9-]+\.[a-zA-Z]{2,})$', email)
        if not domain_match:
            return False

        domain = domain_match.group(1).lower()
        # Basic check for common TLDs
        valid_tlds = ['.com', '.org', '.net', '.edu', '.gov', '.mil', '.int']
        return any(domain.endswith(tld) for tld in valid_tlds) or '.' in domain

class RateLimitHelper:
    """Helper for advanced rate limiting"""

    @staticmethod
    def get_client_fingerprint(request) -> str:
        """Generate a fingerprint for rate limiting based on client characteristics"""
        import hashlib

        fingerprint_data = [
            request.client.host if request.client else "unknown",
            request.headers.get("user-agent", "unknown"),
            request.headers.get("accept-language", "unknown"),
        ]

        fingerprint = hashlib.md5("|".join(fingerprint_data).encode()).hexdigest()
        return fingerprint

class AuditHelper:
    """Helper for audit logging"""

    @staticmethod
    def log_user_action(
        user_id: int,
        action: str,
        resource: str,
        resource_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        """Log user actions for audit purposes"""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address
        }

        logger.info("User action audit", extra=audit_entry)

# Global instances
api_response = APIResponse()
pagination_helper = PaginationHelper()
filter_helper = FilterHelper()
validation_helper = ValidationHelper()
rate_limit_helper = RateLimitHelper()
audit_helper = AuditHelper()