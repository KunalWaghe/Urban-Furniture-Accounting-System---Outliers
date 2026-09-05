"""
Custom exceptions and global error handlers.

All API errors follow the standard error envelope from the API contract:
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": { "field_name": "error detail" },  // optional
    "request_id": "uuid"
  }
}
"""

import uuid
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppException(Exception):
    """Base exception for all application-level errors."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        fields: dict | None = None,
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.fields = fields


# --- Concrete exception classes ---

class NotFoundException(AppException):
    def __init__(self, entity: str, entity_id: int | str):
        super().__init__(
            status_code=404,
            code="NOT_FOUND",
            message=f"{entity} with id {entity_id} not found",
        )


class ConflictException(AppException):
    def __init__(self, code: str, message: str):
        super().__init__(status_code=409, code=code, message=message)


class ValidationException(AppException):
    def __init__(self, message: str, fields: dict | None = None):
        super().__init__(
            status_code=422,
            code="VALIDATION_ERROR",
            message=message,
            fields=fields,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(status_code=401, code="INVALID_CREDENTIALS", message=message)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access denied"):
        super().__init__(status_code=403, code="FORBIDDEN", message=message)


# --- Error handlers (registered in main.py) ---

def _build_error_response(status_code: int, code: str, message: str, fields: dict | None = None) -> JSONResponse:
    """Build a standard error envelope response."""
    body = {
        "error": {
            "code": code,
            "message": message,
            "request_id": str(uuid.uuid4()),
        }
    }
    if fields:
        body["error"]["fields"] = fields
    return JSONResponse(status_code=status_code, content=body)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle all custom AppException subclasses."""
    return _build_error_response(exc.status_code, exc.code, exc.message, exc.fields)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle Pydantic/FastAPI validation errors.
    
    Transforms FastAPI's default validation error format into our
    standard error envelope with field-level errors.
    """
    fields = {}
    for error in exc.errors():
        # error["loc"] is a tuple like ("body", "email") — we want "email"
        field_name = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        fields[field_name] = error["msg"]

    return _build_error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        fields=fields,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all for unhandled exceptions.
    
    Returns a generic 500 error with a request_id for debugging.
    The actual error details are NOT exposed to the client (security).
    """
    return _build_error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message="An unexpected error occurred",
    )
