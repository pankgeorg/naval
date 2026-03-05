"""Middleware to inject an anonymous user context when no JWT is present."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class AnonymousUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Simply pass through - fastapi-users handles optional auth
        response = await call_next(request)
        return response
