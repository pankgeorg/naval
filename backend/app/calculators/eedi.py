"""EEDI / EEXI calculator."""
from dataclasses import dataclass
from datetime import date

from app.calculators.constants import EEDI_REF_LINES, EEDI_REDUCTIONS


@dataclass
class EEDIResult:
    attained: float
    required: float
    reference_line: float
    phase: int
    reduction_pct: float
    compliant: bool
    gap_pct: float


def _get_capacity(ship_type: str, dwt: float, gt: float) -> float:
    if ship_type == "cruise_passenger":
        return gt
    if ship_type == "container":
        return 0.7 * dwt
    return dwt


def determine_eedi_phase(delivery_date: date | None, ship_type: str) -> int:
    if delivery_date is None:
        return 0
    year = delivery_date.year
    # Simplified phase determination
    if year < 2013:
        return 0
    elif year < 2015:
        return 0
    elif year < 2020:
        return 1
    elif year < 2025:
        return 2
    else:
        return 3


def get_eedi_reduction(ship_type: str, dwt: float, phase: int) -> float:
    phase_idx = {0: 3, 1: 4, 2: 5, 3: 6}[phase]
    for row in EEDI_REDUCTIONS:
        if row[0] != ship_type:
            continue
        min_dwt = row[1] or 0
        max_dwt = row[2]
        if dwt >= min_dwt and (max_dwt is None or dwt < max_dwt):
            return row[phase_idx]
    return 0.0


def calculate_eedi(
    ship_type: str,
    dwt: float,
    gt: float,
    reference_speed_kn: float,
    fw: float,
    delivery_date: date | None,
    engines: list[dict],
    fuel_types: dict,
) -> EEDIResult:
    """Calculate EEDI for a ship.

    engines: list of dicts with keys: role, mcr_kw, primary_fuel_type, sfc_g_kwh
    fuel_types: dict mapping fuel code to dict with cf_t_co2_per_t
    """
    capacity = _get_capacity(ship_type, dwt, gt)

    ref_a, ref_c = EEDI_REF_LINES.get(ship_type, (1000.0, 0.5))
    ref_line = ref_a * (capacity ** (-ref_c))

    phase = determine_eedi_phase(delivery_date, ship_type)
    reduction_pct = get_eedi_reduction(ship_type, dwt, phase)
    required_eedi = ref_line * (1 - reduction_pct / 100)

    # Calculate attained EEDI
    numerator = 0.0
    for eng in engines:
        ft = fuel_types.get(eng["primary_fuel_type"], {})
        cf = ft.get("cf_t_co2_per_t", 3.114)
        power = eng["mcr_kw"] * 0.75 if eng["role"] == "main" else eng["mcr_kw"]
        numerator += cf * eng["sfc_g_kwh"] * power

    denominator = fw * reference_speed_kn * capacity
    attained = numerator / denominator if denominator > 0 else 0.0

    gap_pct = ((attained - required_eedi) / required_eedi * 100) if required_eedi > 0 else 0

    return EEDIResult(
        attained=round(attained, 4),
        required=round(required_eedi, 4),
        reference_line=round(ref_line, 4),
        phase=phase,
        reduction_pct=reduction_pct,
        compliant=attained <= required_eedi,
        gap_pct=round(gap_pct, 2),
    )
