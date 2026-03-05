"""Forward projection calculator."""
from dataclasses import dataclass
import copy

from app.calculators.cii import calculate_cii, CIIResult
from app.calculators.fueleu import calculate_fueleu, FuelEUResult
from app.calculators.eu_ets import calculate_eu_ets, EUETSResult


@dataclass
class ProjectionYearResult:
    year: int
    cii: CIIResult
    fueleu: FuelEUResult
    eu_ets: EUETSResult


def _flatten_fuel(voyages: list[dict]) -> list[dict]:
    records = []
    for v in voyages:
        for leg in v.get("legs", []):
            records.extend(leg.get("fuel_records", []))
        for pc in v.get("port_calls", []):
            records.extend(pc.get("fuel_records", []))
    return records


def _total_distance(voyages: list[dict]) -> float:
    total = 0.0
    for v in voyages:
        for leg in v.get("legs", []):
            total += leg.get("distance_nm", 0.0) or 0.0
    return total


def _scale_fuel(voyages: list[dict], factor: float) -> list[dict]:
    scaled = copy.deepcopy(voyages)
    for v in scaled:
        for leg in v.get("legs", []):
            for rec in leg.get("fuel_records", []):
                rec["consumption_tonnes"] *= factor
        for pc in v.get("port_calls", []):
            for rec in pc.get("fuel_records", []):
                rec["consumption_tonnes"] *= factor
    return scaled


def project_compliance(
    ship_type: str,
    dwt: float,
    gt: float,
    baseline_voyages: list[dict],
    baseline_year: int,
    target_years: list[int],
    fuel_types: dict,
    eua_price_trajectory: dict[int, float] | None = None,
    operational_assumptions: str = "constant",
) -> list[ProjectionYearResult]:
    results = []
    for year in target_years:
        years_delta = year - baseline_year
        if operational_assumptions == "improving_2pct_year":
            efficiency_factor = 0.98 ** years_delta
        else:
            efficiency_factor = 1.0

        adjusted = _scale_fuel(baseline_voyages, efficiency_factor)
        eua_price = (eua_price_trajectory or {}).get(year, 75.0 + (year - 2025) * 2.5)

        fuel_records = _flatten_fuel(adjusted)
        distance = _total_distance(adjusted)

        cii = calculate_cii(ship_type, dwt, gt, fuel_records, distance, year, fuel_types)
        fueleu = calculate_fueleu(adjusted, year, fuel_types)
        ets = calculate_eu_ets(adjusted, year, fuel_types, eua_price)

        results.append(ProjectionYearResult(year=year, cii=cii, fueleu=fueleu, eu_ets=ets))

    return results
