from datetime import datetime

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
