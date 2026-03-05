from uuid import UUID

from fastapi_users import FastAPIUsers
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)

from app.auth.manager import get_user_manager
from app.auth.models import User
from app.config import settings

bearer_transport = BearerTransport(tokenUrl="api/auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=settings.jwt_secret, lifetime_seconds=3600 * 24)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True, optional=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True, optional=True)
