from datetime import datetime
from uuid import uuid4, UUID

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Voyage(Base):
    __tablename__ = "voyages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    ship_id: Mapped[UUID] = mapped_column(ForeignKey("ships.id"))
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    voyage_number: Mapped[str | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(default="planned")
    departure_date: Mapped[datetime | None] = mapped_column(nullable=True)
    arrival_date: Mapped[datetime | None] = mapped_column(nullable=True)
    cargo_type: Mapped[str | None] = mapped_column(nullable=True)
    cargo_tonnes: Mapped[float | None] = mapped_column(nullable=True)
    total_distance_nm: Mapped[float | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    ship: Mapped["Ship"] = relationship(back_populates="voyages")
    port_calls: Mapped[list["PortCall"]] = relationship(
        back_populates="voyage", cascade="all, delete-orphan",
        order_by="PortCall.call_order",
    )
    legs: Mapped[list["VoyageLeg"]] = relationship(
        back_populates="voyage", cascade="all, delete-orphan",
        order_by="VoyageLeg.leg_order",
    )
    corrections: Mapped[list["CIICorrection"]] = relationship(
        back_populates="voyage", cascade="all, delete-orphan",
    )
