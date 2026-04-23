from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


CorrectionType = Literal["ice_class", "electrical_consumer", "cargo_heating"]


def _strip_tz(v: datetime | str | None) -> datetime | None:
    if v is None:
        return None
    if isinstance(v, str):
        v = datetime.fromisoformat(v.replace("Z", "+00:00"))
    if v.tzinfo is not None:
        v = v.replace(tzinfo=None)
    return v


class CIICorrectionBase(BaseModel):
    correction_type: CorrectionType
    start_time: datetime | None = None
    end_time: datetime | None = None
    quantity: float | None = None
    unit: str | None = None
    co2_offset_tonnes: float = 0.0
    notes: str | None = None

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def strip_timezone(cls, v: datetime | str | None) -> datetime | None:
        return _strip_tz(v)


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

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def strip_timezone(cls, v: datetime | str | None) -> datetime | None:
        return _strip_tz(v)


class CIICorrectionRead(CIICorrectionBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    voyage_id: UUID
    created_at: datetime
