from uuid import uuid4, UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PortCall(Base):
    __tablename__ = "port_calls"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    voyage_id: Mapped[UUID] = mapped_column(ForeignKey("voyages.id"))
    port_id: Mapped[UUID] = mapped_column(ForeignKey("ports.id"))
    call_order: Mapped[int]
    arrival_time: Mapped[str | None] = mapped_column(nullable=True)
    departure_time: Mapped[str | None] = mapped_column(nullable=True)
    berth_hours: Mapped[float | None] = mapped_column(nullable=True)
    used_ops: Mapped[bool] = mapped_column(default=False)
    ops_kwh_consumed: Mapped[float | None] = mapped_column(nullable=True)

    voyage: Mapped["Voyage"] = relationship(back_populates="port_calls")
    port: Mapped["Port"] = relationship()
    fuel_records: Mapped[list["FuelConsumption"]] = relationship(
        back_populates="port_call", cascade="all, delete-orphan",
    )
