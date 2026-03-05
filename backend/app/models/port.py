from uuid import uuid4, UUID

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Port(Base):
    __tablename__ = "ports"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str]
    unlocode: Mapped[str] = mapped_column(String(5), unique=True)
    country_iso: Mapped[str] = mapped_column(String(2))
    latitude: Mapped[float]
    longitude: Mapped[float]
    is_eu_eea: Mapped[bool] = mapped_column(default=False)
    is_ten_t_core: Mapped[bool] = mapped_column(default=False)
    is_ten_t_comprehensive: Mapped[bool] = mapped_column(default=False)
    is_outermost_region: Mapped[bool] = mapped_column(default=False)
    in_sox_eca: Mapped[bool] = mapped_column(default=False)
    in_nox_eca: Mapped[bool] = mapped_column(default=False)
    ops_available: Mapped[bool] = mapped_column(default=False)
    ops_capacity_kw: Mapped[float | None] = mapped_column(nullable=True)
    is_user_added: Mapped[bool] = mapped_column(default=False)
