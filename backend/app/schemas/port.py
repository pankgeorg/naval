from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PortBase(BaseModel):
    name: str
    unlocode: str
    country_iso: str
    latitude: float
    longitude: float
    is_eu_eea: bool = False
    is_ten_t_core: bool = False
    is_ten_t_comprehensive: bool = False
    is_outermost_region: bool = False
    in_sox_eca: bool = False
    in_nox_eca: bool = False
    ops_available: bool = False
    ops_capacity_kw: float | None = None


class PortCreate(PortBase):
    pass


class PortRead(PortBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    is_user_added: bool = False


class PortList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    unlocode: str
    country_iso: str
    latitude: float
    longitude: float
    is_eu_eea: bool
