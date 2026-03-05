from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class FuelConsumptionBase(BaseModel):
    fuel_type_code: str
    consumption_tonnes: float


class FuelConsumptionCreate(FuelConsumptionBase):
    pass


class FuelConsumptionRead(FuelConsumptionBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    voyage_leg_id: UUID | None = None
    port_call_id: UUID | None = None
    co2_tonnes: float | None = None
    ch4_co2eq_tonnes: float | None = None
    n2o_co2eq_tonnes: float | None = None
    energy_mj: float | None = None
    ghg_intensity_wtw: float | None = None


class TrackPointBase(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime | None = None
    sog_knots: float | None = None
    heading_deg: float | None = None


class TrackPointCreate(TrackPointBase):
    pass


class TrackPointRead(TrackPointBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    voyage_leg_id: UUID
    point_order: int


class PortCallBase(BaseModel):
    port_id: UUID
    call_order: int
    arrival_time: str | None = None
    departure_time: str | None = None
    berth_hours: float | None = None
    used_ops: bool = False
    ops_kwh_consumed: float | None = None


class PortCallCreate(PortCallBase):
    fuel_records: list[FuelConsumptionCreate] = []


class PortCallRead(PortCallBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    voyage_id: UUID
    fuel_records: list[FuelConsumptionRead] = []


class VoyageLegRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    voyage_id: UUID
    leg_order: int
    from_port_call_id: UUID
    to_port_call_id: UUID
    distance_nm: float | None = None
    leg_type: str | None = None
    eu_ets_coverage: float | None = None
    fueleu_coverage: float | None = None
    average_speed_kn: float | None = None
    hours_at_sea: float | None = None
    track_points: list[TrackPointRead] = []
    fuel_records: list[FuelConsumptionRead] = []


class VoyageBase(BaseModel):
    voyage_number: str | None = None
    status: str = "planned"
    departure_date: datetime | None = None
    arrival_date: datetime | None = None
    cargo_type: str | None = None
    cargo_tonnes: float | None = None
    notes: str | None = None

    @field_validator("departure_date", "arrival_date", mode="before")
    @classmethod
    def strip_timezone(cls, v: datetime | str | None) -> datetime | None:
        if v is None:
            return None
        if isinstance(v, str):
            v = datetime.fromisoformat(v.replace("Z", "+00:00"))
        if v.tzinfo is not None:
            v = v.replace(tzinfo=None)
        return v


class VoyageCreate(VoyageBase):
    port_calls: list[PortCallCreate] = []


class VoyageRead(VoyageBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    ship_id: UUID
    owner_id: UUID | None = None
    total_distance_nm: float | None = None
    created_at: datetime
    port_calls: list[PortCallRead] = []
    legs: list[VoyageLegRead] = []


class VoyageUpdate(BaseModel):
    voyage_number: str | None = None
    status: str | None = None
    departure_date: datetime | None = None
    arrival_date: datetime | None = None
    cargo_type: str | None = None
    cargo_tonnes: float | None = None
    notes: str | None = None
