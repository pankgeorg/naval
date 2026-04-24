"""FuelEU Maritime calculator."""
from dataclasses import dataclass

from app.calculators.constants import (
    FUELEU_TARGETS,
    FUELEU_RFNBO_MULTIPLIER,
    FUELEU_RFNBO_MULTIPLIER_EXPIRY,
    FUELEU_GHG_PENALTY_PRICE_EUR_PER_T_VLSFO,
)


@dataclass
class FuelEUResult:
    year: int
    target_reduction_pct: float
    target_intensity: float
    weighted_intensity: float
    compliance_balance_mj: float
    compliant: bool
    penalty_estimate_eur: float
    total_covered_energy_mj: float
    total_covered_ghg_gco2eq: float


def calculate_fueleu(
    voyages: list[dict],
    year: int,
    fuel_types: dict,
) -> FuelEUResult:
    """Calculate FuelEU Maritime compliance.

    voyages: list of dicts, each with:
      - legs: list of dicts with fueleu_coverage and fuel_records
      - port_calls: list of dicts with port info and fuel_records
    fuel_types: dict mapping code to fuel type properties
    """
    target_year = max(y for y in FUELEU_TARGETS if y <= year)
    reduction_pct, target_intensity = FUELEU_TARGETS[target_year]

    total_covered_energy_mj = 0.0
    total_covered_ghg_gco2eq = 0.0

    for voyage in voyages:
        for leg in voyage.get("legs", []):
            coverage = leg.get("fueleu_coverage", 0.0)
            if coverage == 0.0:
                continue
            for fuel_rec in leg.get("fuel_records", []):
                ft = fuel_types.get(fuel_rec["fuel_type_code"], {})
                lcv = ft.get("lcv_mj_per_kg", 40.2)
                energy = fuel_rec["consumption_tonnes"] * lcv * 1000

                effective_energy = energy
                if ft.get("is_rfnbo") and year <= FUELEU_RFNBO_MULTIPLIER_EXPIRY:
                    effective_energy = energy * FUELEU_RFNBO_MULTIPLIER

                wtw = ft.get("wtw_total_default", 91.78)
                ghg = energy * wtw

                total_covered_energy_mj += effective_energy * coverage
                total_covered_ghg_gco2eq += ghg * coverage

        for pc in voyage.get("port_calls", []):
            port = pc.get("port", {})
            if not port.get("is_eu_eea", False):
                continue
            for fuel_rec in pc.get("fuel_records", []):
                ft = fuel_types.get(fuel_rec["fuel_type_code"], {})
                lcv = ft.get("lcv_mj_per_kg", 40.2)
                energy = fuel_rec["consumption_tonnes"] * lcv * 1000

                effective_energy = energy
                if ft.get("is_rfnbo") and year <= FUELEU_RFNBO_MULTIPLIER_EXPIRY:
                    effective_energy = energy * FUELEU_RFNBO_MULTIPLIER

                wtw = ft.get("wtw_total_default", 91.78)
                ghg = energy * wtw

                total_covered_energy_mj += effective_energy
                total_covered_ghg_gco2eq += ghg

            if pc.get("used_ops") and pc.get("ops_kwh_consumed"):
                ops_mj = pc["ops_kwh_consumed"] * 3.6
                total_covered_energy_mj += ops_mj

    if total_covered_energy_mj > 0:
        weighted_intensity = total_covered_ghg_gco2eq / total_covered_energy_mj
    else:
        weighted_intensity = 0.0

    compliance_balance_mj = 0.0
    if total_covered_energy_mj > 0 and target_intensity > 0:
        compliance_balance_mj = (
            (target_intensity - weighted_intensity) * total_covered_energy_mj / target_intensity
        )

    penalty_eur = 0.0
    if compliance_balance_mj < 0:
        penalty_per_mj = FUELEU_GHG_PENALTY_PRICE_EUR_PER_T_VLSFO / (40.200 * 1000)
        penalty_eur = abs(compliance_balance_mj) * penalty_per_mj

    return FuelEUResult(
        year=year,
        target_reduction_pct=reduction_pct,
        target_intensity=target_intensity,
        weighted_intensity=round(weighted_intensity, 6),
        compliance_balance_mj=round(compliance_balance_mj, 2),
        compliant=compliance_balance_mj >= 0,
        penalty_estimate_eur=round(penalty_eur, 2),
        total_covered_energy_mj=round(total_covered_energy_mj, 2),
        total_covered_ghg_gco2eq=round(total_covered_ghg_gco2eq, 2),
    )
