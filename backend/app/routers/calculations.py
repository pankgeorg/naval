from uuid import UUID
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_async_session
from app.models.ship import Ship
from app.models.voyage import Voyage
from app.models.port_call import PortCall
from app.models.voyage_leg import VoyageLeg
from app.models.reference import FuelType
from app.calculators.eedi import calculate_eedi
from app.calculators.eexi import calculate_eexi
from app.calculators.cii import calculate_cii
from app.calculators.fueleu import calculate_fueleu
from app.calculators.eu_ets import calculate_eu_ets
from app.calculators.projection import project_compliance

router = APIRouter(prefix="/api/ships", tags=["calculations"])


async def _get_fuel_types_dict(session: AsyncSession) -> dict:
    result = await session.execute(select(FuelType))
    fuel_types = {}
    for ft in result.scalars().all():
        fuel_types[ft.code] = {
            "cf_t_co2_per_t": ft.cf_t_co2_per_t,
            "lcv_mj_per_kg": ft.lcv_mj_per_kg,
            "wtt_default": ft.wtt_default,
            "ttw_co2_default": ft.ttw_co2_default,
            "ttw_ch4_co2eq_default": ft.ttw_ch4_co2eq_default,
            "ttw_n2o_co2eq_default": ft.ttw_n2o_co2eq_default,
            "wtw_total_default": ft.wtw_total_default,
            "is_rfnbo": ft.is_rfnbo,
            "sulfur_pct": ft.sulfur_pct,
        }
    return fuel_types


async def _get_ship_with_engines(session: AsyncSession, ship_id: UUID):
    result = await session.execute(
        select(Ship).where(Ship.id == ship_id).options(selectinload(Ship.engines))
    )
    ship = result.scalars().first()
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    return ship


async def _get_voyages_for_year(session: AsyncSession, ship_id: UUID, year: int) -> list[dict]:
    from sqlalchemy import or_
    result = await session.execute(
        select(Voyage)
        .where(Voyage.ship_id == ship_id)
        .where(
            or_(
                extract("year", Voyage.departure_date) == year,
                # Fallback: if departure_date is not set, match on created_at year
                (Voyage.departure_date.is_(None)) & (extract("year", Voyage.created_at) == year),
            )
        )
        .options(
            selectinload(Voyage.port_calls).selectinload(PortCall.fuel_records),
            selectinload(Voyage.port_calls).selectinload(PortCall.port),
            selectinload(Voyage.legs).selectinload(VoyageLeg.fuel_records),
        )
    )
    voyages = result.scalars().all()
    voyages_data = []
    for v in voyages:
        legs_data = []
        for leg in v.legs:
            legs_data.append({
                "distance_nm": leg.distance_nm,
                "leg_type": leg.leg_type,
                "eu_ets_coverage": leg.eu_ets_coverage or 0.0,
                "fueleu_coverage": leg.fueleu_coverage or 0.0,
                "average_speed_kn": leg.average_speed_kn,
                "hours_at_sea": leg.hours_at_sea,
                "fuel_records": [
                    {
                        "fuel_type_code": fr.fuel_type_code,
                        "consumption_tonnes": fr.consumption_tonnes,
                    }
                    for fr in leg.fuel_records
                ],
            })
        pcs_data = []
        for pc in v.port_calls:
            pcs_data.append({
                "port": {
                    "is_eu_eea": (
                        pc.port.is_eu_eea if pc.port else False
                    ),
                    "is_outermost_region": (
                        pc.port.is_outermost_region
                        if pc.port else False
                    ),
                },
                "used_ops": pc.used_ops,
                "ops_kwh_consumed": pc.ops_kwh_consumed,
                "fuel_records": [
                    {
                        "fuel_type_code": fr.fuel_type_code,
                        "consumption_tonnes": fr.consumption_tonnes,
                    }
                    for fr in pc.fuel_records
                ],
            })
        voyages_data.append({"legs": legs_data, "port_calls": pcs_data})
    return voyages_data


@router.get("/{ship_id}/eedi")
async def get_eedi(
    ship_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    ship = await _get_ship_with_engines(session, ship_id)
    fuel_types = await _get_fuel_types_dict(session)
    engines = [
        {
            "role": e.role, "mcr_kw": e.mcr_kw,
            "primary_fuel_type": e.primary_fuel_type,
            "sfc_g_kwh": e.sfc_g_kwh,
        }
        for e in ship.engines
    ]
    result = calculate_eedi(
        ship.ship_type.value, ship.dwt, ship.gt,
        ship.reference_speed_kn, ship.fw, ship.delivery_date,
        engines, fuel_types,
    )
    return asdict(result)


@router.get("/{ship_id}/eexi")
async def get_eexi(
    ship_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    ship = await _get_ship_with_engines(session, ship_id)
    fuel_types = await _get_fuel_types_dict(session)
    engines = [
        {
            "role": e.role, "mcr_kw": e.mcr_kw,
            "primary_fuel_type": e.primary_fuel_type,
            "sfc_g_kwh": e.sfc_g_kwh,
        }
        for e in ship.engines
    ]
    result = calculate_eexi(
        ship.ship_type.value, ship.dwt, ship.gt,
        ship.reference_speed_kn, ship.fw,
        engines, fuel_types,
        attained_eexi_override=ship.attained_eexi,
        required_eexi_override=ship.required_eexi,
        compliance_method=ship.eexi_compliance_method,
        epl_limited_power_kw=ship.epl_limited_power_kw,
    )
    return asdict(result)


@router.get("/{ship_id}/cii")
async def get_cii(
    ship_id: UUID,
    year: int = Query(2025),
    session: AsyncSession = Depends(get_async_session),
):
    ship = await _get_ship_with_engines(session, ship_id)
    fuel_types = await _get_fuel_types_dict(session)
    voyages_data = await _get_voyages_for_year(session, ship_id, year)

    fuel_records = []
    total_distance = 0.0
    for v in voyages_data:
        for leg in v["legs"]:
            fuel_records.extend(leg["fuel_records"])
            total_distance += leg.get("distance_nm") or 0.0

    result = calculate_cii(
        ship.ship_type.value, ship.dwt, ship.gt,
        fuel_records, total_distance, year, fuel_types,
    )
    return asdict(result)


@router.get("/{ship_id}/fueleu")
async def get_fueleu(
    ship_id: UUID,
    year: int = Query(2025),
    session: AsyncSession = Depends(get_async_session),
):
    await _get_ship_with_engines(session, ship_id)  # validate ship exists
    fuel_types = await _get_fuel_types_dict(session)
    voyages_data = await _get_voyages_for_year(session, ship_id, year)
    result = calculate_fueleu(voyages_data, year, fuel_types)
    return asdict(result)


@router.get("/{ship_id}/eu-ets")
async def get_eu_ets(
    ship_id: UUID,
    year: int = Query(2025),
    eua_price: float = Query(75.0),
    session: AsyncSession = Depends(get_async_session),
):
    await _get_ship_with_engines(session, ship_id)  # validate ship exists
    fuel_types = await _get_fuel_types_dict(session)
    voyages_data = await _get_voyages_for_year(session, ship_id, year)
    result = calculate_eu_ets(voyages_data, year, fuel_types, eua_price)
    return asdict(result)


@router.get("/{ship_id}/projection")
async def get_projection(
    ship_id: UUID,
    years: str = Query("2025,2030,2035,2040,2050"),
    assumptions: str = Query("constant"),
    session: AsyncSession = Depends(get_async_session),
):
    ship = await _get_ship_with_engines(session, ship_id)
    fuel_types = await _get_fuel_types_dict(session)

    target_years = [int(y.strip()) for y in years.split(",")]
    baseline_year = min(target_years)
    voyages_data = await _get_voyages_for_year(session, ship_id, baseline_year)

    results = project_compliance(
        ship.ship_type.value, ship.dwt, ship.gt,
        voyages_data, baseline_year, target_years,
        fuel_types, operational_assumptions=assumptions,
    )
    return [
        {
            "year": r.year, "cii": asdict(r.cii),
            "fueleu": asdict(r.fueleu),
            "eu_ets": asdict(r.eu_ets),
        }
        for r in results
    ]


@router.get("/{ship_id}/annual-report")
async def get_annual_report(
    ship_id: UUID,
    year: int = Query(2025),
    session: AsyncSession = Depends(get_async_session),
):
    ship = await _get_ship_with_engines(session, ship_id)
    fuel_types = await _get_fuel_types_dict(session)
    voyages_data = await _get_voyages_for_year(session, ship_id, year)

    engines = [
        {
            "role": e.role, "mcr_kw": e.mcr_kw,
            "primary_fuel_type": e.primary_fuel_type,
            "sfc_g_kwh": e.sfc_g_kwh,
        }
        for e in ship.engines
    ]

    eedi_result = calculate_eedi(
        ship.ship_type.value, ship.dwt, ship.gt,
        ship.reference_speed_kn, ship.fw, ship.delivery_date,
        engines, fuel_types,
    )

    fuel_records = []
    total_distance = 0.0
    for v in voyages_data:
        for leg in v["legs"]:
            fuel_records.extend(leg["fuel_records"])
            total_distance += leg.get("distance_nm") or 0.0

    cii_result = calculate_cii(
        ship.ship_type.value, ship.dwt, ship.gt,
        fuel_records, total_distance, year, fuel_types,
    )
    fueleu_result = calculate_fueleu(voyages_data, year, fuel_types)
    ets_result = calculate_eu_ets(voyages_data, year, fuel_types)

    return {
        "year": year,
        "eedi": asdict(eedi_result),
        "cii": asdict(cii_result),
        "fueleu": asdict(fueleu_result),
        "eu_ets": asdict(ets_result),
    }
