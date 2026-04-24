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


def _voyage_totals(voyages_data: list[dict]) -> dict:
    distance = 0.0
    fuel = 0.0
    for v in voyages_data:
        for leg in v.get("legs", []):
            distance += leg.get("distance_nm") or 0.0
            for fr in leg.get("fuel_records", []):
                fuel += fr.get("consumption_tonnes", 0) or 0
        for pc in v.get("port_calls", []):
            for fr in pc.get("fuel_records", []):
                fuel += fr.get("consumption_tonnes", 0) or 0
    return {"distance_nm": round(distance, 2), "fuel_tonnes": round(fuel, 4)}


def _synthetic_voyages(distance_nm: float, fuel_tonnes: float, fuel_mix: dict | None) -> list[dict]:
    """Build a single intra-EU leg carrying the given totals, split by fuel_mix (or 100% VLSFO)."""
    mix = fuel_mix or {"vlsfo": 1.0}
    # Normalize (mix may be pct or fraction depending on caller; accept either)
    total = sum(mix.values()) or 1.0
    fractions = {k: v / total for k, v in mix.items()}
    fuel_records = [
        {"fuel_type_code": code, "consumption_tonnes": fuel_tonnes * frac}
        for code, frac in fractions.items()
        if frac > 0
    ]
    return [{
        "legs": [{
            "distance_nm": distance_nm,
            "leg_type": "intra_eu",
            "eu_ets_coverage": 1.0,
            "fueleu_coverage": 1.0,
            "average_speed_kn": None,
            "hours_at_sea": None,
            "fuel_records": fuel_records,
        }],
        "port_calls": [],
    }]


@router.post("/{ship_id}/scenario")
async def run_what_if(
    ship_id: UUID,
    data: ScenarioRequest,
    session: AsyncSession = Depends(get_async_session),
):
    ship = await _get_ship_with_engines(session, ship_id)
    fuel_types = await _get_fuel_types_dict(session)
    voyages_data = await _get_voyages_for_year(session, ship_id, data.year)
    voyage_totals = _voyage_totals(voyages_data)

    # Determine what distance/fuel to use. Either override = synthesized single leg.
    use_override = (
        data.override_distance_nm is not None or data.override_fuel_tonnes is not None
    )
    if use_override:
        distance = (
            data.override_distance_nm
            if data.override_distance_nm is not None
            else voyage_totals["distance_nm"]
        )
        fuel = (
            data.override_fuel_tonnes
            if data.override_fuel_tonnes is not None
            else voyage_totals["fuel_tonnes"]
        )
        effective_voyages = _synthetic_voyages(distance, fuel, data.fuel_mix)
    else:
        effective_voyages = voyages_data

    baseline = run_scenario(
        ship.ship_type.value, ship.dwt, ship.gt,
        effective_voyages, data.year, fuel_types,
        speed_change_pct=0.0, fuel_mix=None, eua_price_eur=data.eua_price,
    )
    scenario = run_scenario(
        ship.ship_type.value, ship.dwt, ship.gt,
        effective_voyages, data.year, fuel_types,
        speed_change_pct=data.speed_change_pct,
        fuel_mix=data.fuel_mix,
        eua_price_eur=data.eua_price,
        corrections=data.extra_corrections,
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
        "using_override": use_override,
        "ship": {
            "name": ship.name,
            "ship_type": ship.ship_type.value,
            "dwt": ship.dwt,
            "gt": ship.gt,
            "capacity": baseline.cii.capacity,
            "capacity_type": baseline.cii.capacity_type,
        },
        "voyage_totals": voyage_totals,
    }

    projection = None
    if data.projection_years:
        projection = []
        for yr in data.projection_years:
            b = run_scenario(
                ship.ship_type.value, ship.dwt, ship.gt,
                effective_voyages, yr, fuel_types,
                speed_change_pct=0.0, fuel_mix=None, eua_price_eur=data.eua_price,
            )
            s = run_scenario(
                ship.ship_type.value, ship.dwt, ship.gt,
                effective_voyages, yr, fuel_types,
                speed_change_pct=data.speed_change_pct,
                fuel_mix=data.fuel_mix,
                eua_price_eur=data.eua_price,
                corrections=data.extra_corrections,
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
