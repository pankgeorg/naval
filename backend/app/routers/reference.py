from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models.reference import FuelType
from app.seed.eca_zones import load_eca_zones
from app.calculators.constants import (
    FUELEU_TARGETS, CII_REDUCTION_FACTORS, EEDI_REDUCTIONS,
)

router = APIRouter(prefix="/api/reference", tags=["reference"])


@router.get("/fuel-types")
async def get_fuel_types(session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(FuelType))
    fuel_types = result.scalars().all()
    return [
        {
            "code": ft.code,
            "display_name": ft.display_name,
            "cf_t_co2_per_t": ft.cf_t_co2_per_t,
            "lcv_mj_per_kg": ft.lcv_mj_per_kg,
            "wtw_total_default": ft.wtw_total_default,
            "is_rfnbo": ft.is_rfnbo,
            "sulfur_pct": ft.sulfur_pct,
        }
        for ft in fuel_types
    ]


@router.get("/eca-zones")
async def get_eca_zones():
    return load_eca_zones()


@router.get("/fueleu-targets")
async def get_fueleu_targets():
    return {
        str(year): {"reduction_pct": val[0], "target_intensity": val[1]}
        for year, val in FUELEU_TARGETS.items()
    }


@router.get("/cii-reduction-factors")
async def get_cii_reduction_factors():
    return {str(k): v for k, v in CII_REDUCTION_FACTORS.items()}


@router.get("/eedi-phases")
async def get_eedi_phases():
    return [
        {
            "ship_type": r[0],
            "min_dwt": r[1],
            "max_dwt": r[2],
            "phase0": r[3],
            "phase1": r[4],
            "phase2": r[5],
            "phase3": r[6],
        }
        for r in EEDI_REDUCTIONS
    ]
