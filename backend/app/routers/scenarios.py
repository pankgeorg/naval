from uuid import UUID
from dataclasses import asdict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.calculations import ScenarioRequest
from app.calculators.scenario import run_scenario
from app.routers.calculations import (
    _get_ship_with_engines, _get_fuel_types_dict, _get_voyages_for_year,
)

router = APIRouter(prefix="/api/ships", tags=["scenarios"])


@router.post("/{ship_id}/scenario")
async def run_what_if(
    ship_id: UUID,
    data: ScenarioRequest,
    session: AsyncSession = Depends(get_async_session),
):
    ship = await _get_ship_with_engines(session, ship_id)
    fuel_types = await _get_fuel_types_dict(session)
    voyages_data = await _get_voyages_for_year(session, ship_id, data.year)

    # Baseline
    baseline = run_scenario(
        ship.ship_type.value, ship.dwt, ship.gt,
        voyages_data, data.year, fuel_types,
        speed_change_pct=0.0, fuel_mix=None, eua_price_eur=data.eua_price,
    )

    # Scenario
    scenario = run_scenario(
        ship.ship_type.value, ship.dwt, ship.gt,
        voyages_data, data.year, fuel_types,
        speed_change_pct=data.speed_change_pct,
        fuel_mix=data.fuel_mix,
        eua_price_eur=data.eua_price,
    )

    baseline_dict = {
        "cii": asdict(baseline.cii),
        "fueleu": asdict(baseline.fueleu),
        "eu_ets": asdict(baseline.eu_ets),
    }
    scenario_dict = {
        "cii": asdict(scenario.cii),
        "fueleu": asdict(scenario.fueleu),
        "eu_ets": asdict(scenario.eu_ets),
    }

    delta = {
        "cii_rating_change": f"{baseline.cii.rating} -> {scenario.cii.rating}",
        "fueleu_balance_delta_mj": round(
            scenario.fueleu.compliance_balance_mj
            - baseline.fueleu.compliance_balance_mj, 2,
        ),
        "eu_ets_cost_delta_eur": round(scenario.eu_ets.cost_eur - baseline.eu_ets.cost_eur, 2),
    }

    # Include coverage metadata so the frontend can show appropriate warnings
    total_legs = sum(len(v.get("legs", [])) for v in voyages_data)
    eu_covered_legs = sum(
        1 for v in voyages_data
        for leg in v.get("legs", [])
        if (leg.get("fueleu_coverage", 0) or 0) > 0
    )
    has_fuel = any(
        len(leg.get("fuel_records", [])) > 0
        for v in voyages_data for leg in v.get("legs", [])
    )

    meta = {
        "total_voyages": len(voyages_data),
        "total_legs": total_legs,
        "eu_covered_legs": eu_covered_legs,
        "has_fuel_data": has_fuel,
    }

    projection = None
    if data.projection_years:
        projection = []
        for yr in data.projection_years:
            b = run_scenario(
                ship.ship_type.value, ship.dwt, ship.gt,
                voyages_data, yr, fuel_types,
                speed_change_pct=0.0, fuel_mix=None, eua_price_eur=data.eua_price,
            )
            s = run_scenario(
                ship.ship_type.value, ship.dwt, ship.gt,
                voyages_data, yr, fuel_types,
                speed_change_pct=data.speed_change_pct,
                fuel_mix=data.fuel_mix,
                eua_price_eur=data.eua_price,
            )
            projection.append({
                "year": yr,
                "baseline": {
                    "cii": asdict(b.cii),
                    "fueleu": asdict(b.fueleu),
                },
                "scenario": {
                    "cii": asdict(s.cii),
                    "fueleu": asdict(s.fueleu),
                },
            })

    return {
        "baseline": baseline_dict,
        "scenario": scenario_dict,
        "delta": delta,
        "meta": meta,
        "projection": projection,
    }
