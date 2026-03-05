from datetime import datetime
from uuid import uuid4, UUID

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PoolingGroup(Base):
    __tablename__ = "pooling_groups"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str]
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
