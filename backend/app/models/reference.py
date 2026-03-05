from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FuelType(Base):
    __tablename__ = "fuel_types"

    code: Mapped[str] = mapped_column(String(30), primary_key=True)
    display_name: Mapped[str]
    cf_t_co2_per_t: Mapped[float]
    lcv_mj_per_kg: Mapped[float]
    wtt_default: Mapped[float]
    ttw_co2_default: Mapped[float]
    ttw_ch4_co2eq_default: Mapped[float]
    ttw_n2o_co2eq_default: Mapped[float]
    wtw_total_default: Mapped[float]
    is_rfnbo: Mapped[bool] = mapped_column(default=False)
    sulfur_pct: Mapped[float] = mapped_column(default=0.0)


class EEDIRefLine(Base):
    __tablename__ = "eedi_ref_lines"

    ship_type: Mapped[str] = mapped_column(String(30), primary_key=True)
    a: Mapped[float]
    c: Mapped[float]


class CIIRefLine(Base):
    __tablename__ = "cii_ref_lines"

    ship_type: Mapped[str] = mapped_column(String(30), primary_key=True)
    a: Mapped[float]
    c: Mapped[float]
    capacity_type: Mapped[str]  # "dwt" or "gt"


class CIIRatingBoundary(Base):
    __tablename__ = "cii_rating_boundaries"

    ship_type: Mapped[str] = mapped_column(String(30), primary_key=True)
    d1: Mapped[float]
    d2: Mapped[float]
    d3: Mapped[float]
    d4: Mapped[float]
