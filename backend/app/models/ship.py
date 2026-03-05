import enum
from datetime import date, datetime
from uuid import uuid4, UUID

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ShipType(str, enum.Enum):
    BULK_CARRIER = "bulk_carrier"
    TANKER = "tanker"
    CONTAINER = "container"
    GAS_CARRIER = "gas_carrier"
    GENERAL_CARGO = "general_cargo"
    REFRIGERATED_CARGO = "refrigerated_cargo"
    COMBINATION_CARRIER = "combination_carrier"
    LNG_CARRIER = "lng_carrier"
    CRUISE_PASSENGER = "cruise_passenger"
    RORO_CARGO = "roro_cargo"
    RORO_PASSENGER = "roro_passenger"
    VEHICLE_CARRIER = "vehicle_carrier"


class Ship(Base):
    __tablename__ = "ships"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    imo_number: Mapped[str] = mapped_column(String(7), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    flag_state: Mapped[str] = mapped_column(String(2))
    ship_type: Mapped[ShipType]
    dwt: Mapped[float]
    gt: Mapped[float]
    nt: Mapped[float | None] = mapped_column(nullable=True)
    build_date: Mapped[date]
    delivery_date: Mapped[date | None] = mapped_column(nullable=True)

    reference_speed_kn: Mapped[float]
    design_draught_m: Mapped[float]
    fw: Mapped[float] = mapped_column(default=1.0)
    block_coefficient: Mapped[float | None] = mapped_column(nullable=True)

    attained_eedi: Mapped[float | None] = mapped_column(nullable=True)
    required_eedi: Mapped[float | None] = mapped_column(nullable=True)
    eedi_phase: Mapped[int | None] = mapped_column(nullable=True)
    attained_eexi: Mapped[float | None] = mapped_column(nullable=True)
    required_eexi: Mapped[float | None] = mapped_column(nullable=True)
    eexi_compliance_method: Mapped[str | None] = mapped_column(nullable=True)
    epl_limited_power_kw: Mapped[float | None] = mapped_column(nullable=True)

    ice_class: Mapped[str | None] = mapped_column(nullable=True)
    has_cargo_heating: Mapped[bool] = mapped_column(default=False)
    is_shuttle_tanker: Mapped[bool] = mapped_column(default=False)
    is_self_unloading_bc: Mapped[bool] = mapped_column(default=False)

    ism_doc_holder: Mapped[str | None] = mapped_column(nullable=True)
    ops_capable: Mapped[bool] = mapped_column(default=False)
    ops_installed_kw: Mapped[float | None] = mapped_column(nullable=True)
    pooling_group_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("pooling_groups.id"), nullable=True
    )

    class_society: Mapped[str | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    engines: Mapped[list["Engine"]] = relationship(
        back_populates="ship", cascade="all, delete-orphan"
    )
    voyages: Mapped[list["Voyage"]] = relationship(
        back_populates="ship", cascade="all, delete-orphan"
    )
