from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EngineBase(BaseModel):
    role: str
    designation: str
    manufacturer: str | None = None
    model: str | None = None
    mcr_kw: float
    rpm_rated: float | None = None
    engine_type: str | None = None
    primary_fuel_type: str
    sfc_g_kwh: float
    is_dual_fuel: bool = False
    secondary_fuel_type: str | None = None
    secondary_sfc_g_kwh: float | None = None
    nox_tier: str | None = None


class EngineCreate(EngineBase):
    pass


class EngineRead(EngineBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    ship_id: UUID


class EngineUpdate(BaseModel):
    role: str | None = None
    designation: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    mcr_kw: float | None = None
    rpm_rated: float | None = None
    engine_type: str | None = None
    primary_fuel_type: str | None = None
    sfc_g_kwh: float | None = None
    is_dual_fuel: bool | None = None
    secondary_fuel_type: str | None = None
    secondary_sfc_g_kwh: float | None = None
    nox_tier: str | None = None


class ShipBase(BaseModel):
    imo_number: str
    name: str
    flag_state: str
    ship_type: str
    dwt: float
    gt: float
    nt: float | None = None
    build_date: date
    delivery_date: date | None = None
    reference_speed_kn: float
    design_draught_m: float
    fw: float = 1.0
    block_coefficient: float | None = None
    attained_eedi: float | None = None
    required_eedi: float | None = None
    eedi_phase: int | None = None
    attained_eexi: float | None = None
    required_eexi: float | None = None
    eexi_compliance_method: str | None = None
    epl_limited_power_kw: float | None = None
    ice_class: str | None = None
    has_cargo_heating: bool = False
    is_shuttle_tanker: bool = False
    is_self_unloading_bc: bool = False
    ism_doc_holder: str | None = None
    ops_capable: bool = False
    ops_installed_kw: float | None = None
    pooling_group_id: UUID | None = None
    class_society: str | None = None
    notes: str | None = None


class ShipCreate(ShipBase):
    engines: list[EngineCreate] = []


class ShipRead(ShipBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    owner_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    engines: list[EngineRead] = []


class ShipUpdate(BaseModel):
    name: str | None = None
    flag_state: str | None = None
    ship_type: str | None = None
    build_date: date | None = None
    delivery_date: date | None = None
    dwt: float | None = None
    gt: float | None = None
    nt: float | None = None
    reference_speed_kn: float | None = None
    design_draught_m: float | None = None
    fw: float | None = None
    block_coefficient: float | None = None
    attained_eedi: float | None = None
    required_eedi: float | None = None
    eedi_phase: int | None = None
    attained_eexi: float | None = None
    required_eexi: float | None = None
    eexi_compliance_method: str | None = None
    epl_limited_power_kw: float | None = None
    ice_class: str | None = None
    has_cargo_heating: bool | None = None
    is_shuttle_tanker: bool | None = None
    is_self_unloading_bc: bool | None = None
    ism_doc_holder: str | None = None
    ops_capable: bool | None = None
    ops_installed_kw: float | None = None
    pooling_group_id: UUID | None = None
    class_society: str | None = None
    notes: str | None = None
    engines: list[EngineCreate] | None = None


class ShipList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    imo_number: str
    name: str
    flag_state: str
    ship_type: str
    dwt: float
    gt: float
