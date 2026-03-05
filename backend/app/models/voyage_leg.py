from uuid import uuid4, UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VoyageLeg(Base):
    __tablename__ = "voyage_legs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    voyage_id: Mapped[UUID] = mapped_column(ForeignKey("voyages.id"))
    leg_order: Mapped[int]
    from_port_call_id: Mapped[UUID] = mapped_column(ForeignKey("port_calls.id"))
    to_port_call_id: Mapped[UUID] = mapped_column(ForeignKey("port_calls.id"))
    distance_nm: Mapped[float | None] = mapped_column(nullable=True)
    leg_type: Mapped[str | None] = mapped_column(nullable=True)
    eu_ets_coverage: Mapped[float | None] = mapped_column(nullable=True)
    fueleu_coverage: Mapped[float | None] = mapped_column(nullable=True)
    average_speed_kn: Mapped[float | None] = mapped_column(nullable=True)
    hours_at_sea: Mapped[float | None] = mapped_column(nullable=True)

    voyage: Mapped["Voyage"] = relationship(back_populates="legs")
    from_port_call: Mapped["PortCall"] = relationship(foreign_keys=[from_port_call_id])
    to_port_call: Mapped["PortCall"] = relationship(foreign_keys=[to_port_call_id])
    track_points: Mapped[list["TrackPoint"]] = relationship(
        back_populates="leg", cascade="all, delete-orphan",
        order_by="TrackPoint.point_order",
    )
    fuel_records: Mapped[list["FuelConsumption"]] = relationship(
        back_populates="voyage_leg", cascade="all, delete-orphan",
    )
