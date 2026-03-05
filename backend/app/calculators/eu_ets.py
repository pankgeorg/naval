"""EU ETS calculator."""
from dataclasses import dataclass

from app.calculators.constants import EU_ETS_PHASE_IN


@dataclass
class EUETSResult:
    year: int
    phase_in_pct: float
    ghg_scope: str
    total_covered_co2_t: float
    total_covered_ch4_co2eq_t: float
    total_covered_n2o_co2eq_t: float
    euas_required: float
    eua_price_eur: float
    cost_eur: float


def calculate_eu_ets(
    voyages: list[dict],
    year: int,
    fuel_types: dict,
    eua_price_eur: float = 75.0,
) -> EUETSResult:
    """Calculate EU ETS obligations.

    voyages: list of dicts, each with:
      - legs: list of dicts with eu_ets_coverage and fuel_records
      - port_calls: list of dicts with port info and fuel_records
    """
    phase_in_pct, ghg_scope = EU_ETS_PHASE_IN.get(year, (1.0, "co2eq"))

    total_covered_co2_t = 0.0
    total_covered_ch4_co2eq_t = 0.0
    total_covered_n2o_co2eq_t = 0.0

    for voyage in voyages:
        for leg in voyage.get("legs", []):
            coverage = leg.get("eu_ets_coverage", 0.0)
            if coverage == 0.0:
                continue
            for fuel_rec in leg.get("fuel_records", []):
                ft = fuel_types.get(fuel_rec["fuel_type_code"], {})
                cf = ft.get("cf_t_co2_per_t", 3.114)
                co2 = fuel_rec["consumption_tonnes"] * cf
                total_covered_co2_t += co2 * coverage

                if ghg_scope == "co2eq":
                    lcv = ft.get("lcv_mj_per_kg", 40.2)
                    energy_mj = fuel_rec["consumption_tonnes"] * lcv * 1000
                    ch4 = energy_mj * ft.get("ttw_ch4_co2eq_default", 0.3) / 1_000_000
                    n2o = energy_mj * ft.get("ttw_n2o_co2eq_default", 0.93) / 1_000_000
                    total_covered_ch4_co2eq_t += ch4 * coverage
                    total_covered_n2o_co2eq_t += n2o * coverage

        for pc in voyage.get("port_calls", []):
            port = pc.get("port", {})
            if not port.get("is_eu_eea", False):
                continue
            for fuel_rec in pc.get("fuel_records", []):
                ft = fuel_types.get(fuel_rec["fuel_type_code"], {})
                cf = ft.get("cf_t_co2_per_t", 3.114)
                co2 = fuel_rec["consumption_tonnes"] * cf
                total_covered_co2_t += co2
                if ghg_scope == "co2eq":
                    lcv = ft.get("lcv_mj_per_kg", 40.2)
                    energy_mj = fuel_rec["consumption_tonnes"] * lcv * 1000
                    ch4_factor = ft.get("ttw_ch4_co2eq_default", 0.3)
                    n2o_factor = ft.get("ttw_n2o_co2eq_default", 0.93)
                    total_covered_ch4_co2eq_t += energy_mj * ch4_factor / 1e6
                    total_covered_n2o_co2eq_t += energy_mj * n2o_factor / 1e6

    total_co2eq = total_covered_co2_t + total_covered_ch4_co2eq_t + total_covered_n2o_co2eq_t
    euas_required = total_co2eq * phase_in_pct
    cost_eur = euas_required * eua_price_eur

    return EUETSResult(
        year=year,
        phase_in_pct=phase_in_pct,
        ghg_scope=ghg_scope,
        total_covered_co2_t=round(total_covered_co2_t, 4),
        total_covered_ch4_co2eq_t=round(total_covered_ch4_co2eq_t, 4),
        total_covered_n2o_co2eq_t=round(total_covered_n2o_co2eq_t, 4),
        euas_required=round(euas_required, 4),
        eua_price_eur=eua_price_eur,
        cost_eur=round(cost_eur, 2),
    )
