from typing import Dict, Any, List, Optional, Generic, TypeVar
from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Query
from sqlalchemy import desc, asc
import math

T = TypeVar('T')

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = 1
    per_page: int = 20
    sort_by: Optional[str] = None
    sort_order: str = "desc"

class FilterParams(BaseModel):
    """Filter parameters"""
    search: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response structure"""
    data: List[T]
    pagination: Dict[str, Any]
    meta: Optional[Dict[str, Any]] = None

class PaginationHelper:
    """Helper class for pagination"""

    @staticmethod
    def paginate_query(query: Query, params: PaginationParams, model) -> Dict[str, Any]:
        """Paginate a SQLAlchemy query"""
        # Apply sorting
        if params.sort_by:
            column = getattr(model, params.sort_by, None)
            if column is not None:
                if params.sort_order == "desc":
                    query = query.order_by(desc(column))
                else:
                    query = query.order_by(asc(column))

        # Get total count
        total_items = query.count()

        # Calculate pagination
        total_pages = math.ceil(total_items / params.per_page)
        offset = (params.page - 1) * params.per_page

        # Apply pagination
        items = query.offset(offset).limit(params.per_page).all()

        return {
            "items": items,
            "pagination": {
                "page": params.page,
                "per_page": params.per_page,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": params.page < total_pages,
                "has_prev": params.page > 1
            }
        }

class FilterHelper:
    """Helper class for filtering"""

    @staticmethod
    def apply_filters(query: Query, model, filters: Dict[str, Any]) -> Query:
        """Apply filters to a SQLAlchemy query"""
        for field, value in filters.items():
            if value is not None:
                column = getattr(model, field, None)
                if column is not None:
                    if isinstance(value, str):
                        # Case-insensitive search for strings
                        query = query.filter(column.ilike(f"%{value}%"))
                    else:
                        query = query.filter(column == value)

        return query

def api_response(success: bool = True, message: str = "", data: Any = None,
                status_code: int = 200) -> Dict[str, Any]:
    """Standard API response format"""
    response = {
        "success": success,
        "message": message,
        "timestamp": "2024-01-01T00:00:00Z"  # Would use actual timestamp
    }

    if data is not None:
        response["data"] = data

    return response

def pagination_helper(query: Query, params: PaginationParams, model) -> Dict[str, Any]:
    """Helper function for pagination"""
    return PaginationHelper.paginate_query(query, params, model)

def filter_helper(query: Query, model, filters: Dict[str, Any]) -> Query:
    """Helper function for filtering"""
    return FilterHelper.apply_filters(query, model, filters)

def audit_helper(user_id: Optional[int], action: str, resource: str,
                resource_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
    """Helper for audit logging"""
    # This would log to audit table/database
    audit_entry = {
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "resource_id": resource_id,
        "details": details or {},
        "timestamp": "2024-01-01T00:00:00Z"  # Would use actual timestamp
    }

    # In production, this would be saved to database
    print(f"AUDIT: {audit_entry}")

def validate_request_data(data: Dict[str, Any], required_fields: List[str]) -> None:
    """Validate that required fields are present in request data"""
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None:
            missing_fields.append(field)

    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )

def sanitize_input(text: str, max_length: int = 1000) -> str:
    """Sanitize text input"""
    if not text:
        return ""

    # Remove potentially harmful characters
    sanitized = text.strip()
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized

def format_error_response(error: str, error_code: str = "INTERNAL_ERROR") -> Dict[str, Any]:
    """Format error response"""
    return {
        "success": False,
        "error": error,
        "error_code": error_code,
        "timestamp": "2024-01-01T00:00:00Z"  # Would use actual timestamp
    }