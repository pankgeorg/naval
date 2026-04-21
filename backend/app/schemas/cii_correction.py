from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


CorrectionType = Literal["ice_class", "electrical_consumer", "cargo_heating"]


class CIICorrectionBase(BaseModel):
    correction_type: CorrectionType
    start_time: datetime | None = None
    end_time: datetime | None = None
    quantity: float | None = None
    unit: str | None = None
    co2_offset_tonnes: float = 0.0
    notes: str | None = None


class CIICorrectionCreate(CIICorrectionBase):
    pass


class CIICorrectionUpdate(BaseModel):
    correction_type: CorrectionType | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    quantity: float | None = None
    unit: str | None = None
    co2_offset_tonnes: float | None = None
    notes: str | None = None


class CIICorrectionRead(CIICorrectionBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    voyage_id: UUID
    created_at: datetime
