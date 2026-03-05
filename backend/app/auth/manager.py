from uuid import UUID

from fastapi import Depends
from fastapi_users import BaseUserManager, UUIDIDMixin
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.config import settings
from app.database import get_async_session
from fastapi_users.db import SQLAlchemyUserDatabase


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


class UserManager(UUIDIDMixin, BaseUserManager[User, UUID]):
    reset_password_token_secret = settings.jwt_secret
    verification_token_secret = settings.jwt_secret


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)
