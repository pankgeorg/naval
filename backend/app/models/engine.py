from uuid import uuid4, UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Engine(Base):
    __tablename__ = "engines"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    ship_id: Mapped[UUID] = mapped_column(ForeignKey("ships.id"))
    role: Mapped[str]  # "main" or "auxiliary"
    designation: Mapped[str]  # e.g. "ME1", "AE2"
    manufacturer: Mapped[str | None] = mapped_column(nullable=True)
    model: Mapped[str | None] = mapped_column(String(200), nullable=True)
    mcr_kw: Mapped[float]
    rpm_rated: Mapped[float | None] = mapped_column(nullable=True)
    engine_type: Mapped[str | None] = mapped_column(nullable=True)
    primary_fuel_type: Mapped[str] = mapped_column(ForeignKey("fuel_types.code"))
    sfc_g_kwh: Mapped[float]
    is_dual_fuel: Mapped[bool] = mapped_column(default=False)
    secondary_fuel_type: Mapped[str | None] = mapped_column(
        ForeignKey("fuel_types.code"), nullable=True, name="secondary_fuel_type_fk"
    )
    secondary_sfc_g_kwh: Mapped[float | None] = mapped_column(nullable=True)
    nox_tier: Mapped[str | None] = mapped_column(nullable=True)

    ship: Mapped["Ship"] = relationship(back_populates="engines")
