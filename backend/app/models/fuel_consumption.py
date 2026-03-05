from uuid import uuid4, UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FuelConsumption(Base):
    __tablename__ = "fuel_consumptions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    voyage_leg_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("voyage_legs.id"), nullable=True
    )
    port_call_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("port_calls.id"), nullable=True
    )
    fuel_type_code: Mapped[str] = mapped_column(ForeignKey("fuel_types.code"))
    consumption_tonnes: Mapped[float]
    co2_tonnes: Mapped[float | None] = mapped_column(nullable=True)
    ch4_co2eq_tonnes: Mapped[float | None] = mapped_column(nullable=True)
    n2o_co2eq_tonnes: Mapped[float | None] = mapped_column(nullable=True)
    energy_mj: Mapped[float | None] = mapped_column(nullable=True)
    ghg_intensity_wtw: Mapped[float | None] = mapped_column(nullable=True)

    fuel_type: Mapped["FuelType"] = relationship()
    voyage_leg: Mapped["VoyageLeg | None"] = relationship(back_populates="fuel_records")
    port_call: Mapped["PortCall | None"] = relationship(back_populates="fuel_records")
