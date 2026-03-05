"""What-if scenario engine."""
import copy
from dataclasses import dataclass

from app.calculators.cii import calculate_cii
from app.calculators.fueleu import calculate_fueleu, FuelEUResult
from app.calculators.eu_ets import calculate_eu_ets, EUETSResult
from app.calculators.cii import CIIResult


@dataclass
class ScenarioResult:
    cii: CIIResult
    fueleu: FuelEUResult
    eu_ets: EUETSResult
    parameters: dict


def _flatten_fuel_records(voyages: list[dict]) -> list[dict]:
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


def _modify_voyages(
    voyages: list[dict],
    speed_change_pct: float,
    fuel_mix: dict[str, float] | None,
    fuel_types: dict,
) -> list[dict]:
    modified = copy.deepcopy(voyages)
    speed_factor = 1 + speed_change_pct / 100
    consumption_factor = speed_factor ** 3

    for voyage in modified:
        for leg in voyage.get("legs", []):
            # Adjust speed
            if leg.get("average_speed_kn"):
                leg["average_speed_kn"] *= speed_factor
            if leg.get("hours_at_sea") and speed_factor != 0:
                leg["hours_at_sea"] /= speed_factor

            # Scale consumption
            for rec in leg.get("fuel_records", []):
                rec["consumption_tonnes"] *= consumption_factor

            # Redistribute fuel mix if specified
            if fuel_mix:
                total_energy = 0.0
                for rec in leg.get("fuel_records", []):
                    ft = fuel_types.get(rec["fuel_type_code"], {})
                    lcv = ft.get("lcv_mj_per_kg", 40.2)
                    total_energy += rec["consumption_tonnes"] * lcv * 1000

                new_records = []
                for fuel_code, fraction in fuel_mix.items():
                    ft = fuel_types.get(fuel_code, {})
                    lcv = ft.get("lcv_mj_per_kg", 40.2)
                    energy_share = total_energy * fraction
                    tonnes = energy_share / (lcv * 1000) if lcv > 0 else 0
                    new_records.append({
                        "fuel_type_code": fuel_code,
                        "consumption_tonnes": tonnes,
                    })
                leg["fuel_records"] = new_records

    return modified


def run_scenario(
    ship_type: str,
    dwt: float,
    gt: float,
    baseline_voyages: list[dict],
    year: int,
    fuel_types: dict,
    speed_change_pct: float = 0.0,
    fuel_mix: dict[str, float] | None = None,
    eua_price_eur: float = 75.0,
) -> ScenarioResult:
    modified_voyages = _modify_voyages(baseline_voyages, speed_change_pct, fuel_mix, fuel_types)

    fuel_records = _flatten_fuel_records(modified_voyages)
    distance = _total_distance(modified_voyages)

    cii = calculate_cii(ship_type, dwt, gt, fuel_records, distance, year, fuel_types)
    fueleu = calculate_fueleu(modified_voyages, year, fuel_types)
    ets = calculate_eu_ets(modified_voyages, year, fuel_types, eua_price_eur)

    return ScenarioResult(
        cii=cii,
        fueleu=fueleu,
        eu_ets=ets,
        parameters={
            "speed_change_pct": speed_change_pct,
            "fuel_mix": fuel_mix,
            "eua_price_eur": eua_price_eur,
            "year": year,
        },
    )
