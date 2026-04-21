"""CII (Carbon Intensity Indicator) calculator."""
from dataclasses import dataclass, field

from app.calculators.constants import CII_REF_LINES, CII_REDUCTION_FACTORS, CII_RATING_BOUNDARIES


@dataclass
class CIIBreakdownItem:
    label: str
    correction_type: str
    co2_offset_tonnes: float


@dataclass
class CIIResult:
    year: int
    attained_aer: float
    required_cii: float
    reference_value: float
    reduction_factor_pct: float
    rating: str
    band_boundaries: dict[str, float]
    total_co2_tonnes: float
    total_distance_nm: float
    capacity: float
    capacity_type: str
    uncorrected_co2_tonnes: float = 0.0
    uncorrected_attained_aer: float = 0.0
    corrections: list[CIIBreakdownItem] = field(default_factory=list)


def get_cii_capacity(ship_type: str, dwt: float, gt: float) -> tuple[float, str]:
    ref = CII_REF_LINES.get(ship_type)
    if ref is None:
        return dwt, "dwt"
    cap_type = ref[2]
    return (gt if cap_type == "gt" else dwt), cap_type


_CORRECTION_LABELS = {
    "ice_class": "Ice-class correction",
    "electrical_consumer": "Electrical consumers (reefer/aux)",
    "cargo_heating": "Cargo heating",
}


def calculate_cii(
    ship_type: str,
    dwt: float,
    gt: float,
    annual_fuel_records: list[dict],
    annual_distance_nm: float,
    year: int,
    fuel_types: dict,
    corrections: list[dict] | None = None,
) -> CIIResult:
    """Calculate CII for a ship for a given year.

    annual_fuel_records: list of dicts with keys: fuel_type_code, consumption_tonnes
    fuel_types: dict mapping code to dict with cf_t_co2_per_t
    corrections: optional list of dicts with keys: correction_type, co2_offset_tonnes
    """
    total_co2_g = 0.0
    for rec in annual_fuel_records:
        ft = fuel_types.get(rec["fuel_type_code"], {})
        cf = ft.get("cf_t_co2_per_t", 3.114)
        total_co2_g += rec["consumption_tonnes"] * cf * 1_000_000

    uncorrected_co2_tonnes = total_co2_g / 1_000_000

    breakdown: list[CIIBreakdownItem] = []
    total_offset_tonnes = 0.0
    for c in corrections or []:
        offset = float(c.get("co2_offset_tonnes") or 0.0)
        ctype = c.get("correction_type", "unknown")
        breakdown.append(CIIBreakdownItem(
            label=_CORRECTION_LABELS.get(ctype, ctype),
            correction_type=ctype,
            co2_offset_tonnes=round(offset, 4),
        ))
        total_offset_tonnes += offset

    corrected_co2_tonnes = max(uncorrected_co2_tonnes - total_offset_tonnes, 0.0)

    capacity, cap_type = get_cii_capacity(ship_type, dwt, gt)

    if annual_distance_nm > 0 and capacity > 0:
        uncorrected_aer = (uncorrected_co2_tonnes * 1_000_000) / (capacity * annual_distance_nm)
        attained_aer = (corrected_co2_tonnes * 1_000_000) / (capacity * annual_distance_nm)
    else:
        uncorrected_aer = 0.0
        attained_aer = 0.0

    ref_line = CII_REF_LINES.get(ship_type)
    if ref_line is None:
        ref_a, ref_c = 1000.0, 0.5
    else:
        ref_a, ref_c = ref_line[0], ref_line[1]

    ref_value = ref_a * (capacity ** (-ref_c))

    z_pct = CII_REDUCTION_FACTORS.get(year, 11.0 + 2.0 * (year - 2026))
    required_cii = ref_value * (1 - z_pct / 100)

    boundaries = CII_RATING_BOUNDARIES.get(ship_type, (0.86, 0.94, 1.06, 1.18))
    d1, d2, d3, d4 = boundaries

    if attained_aer < d1 * required_cii:
        rating = "A"
    elif attained_aer < d2 * required_cii:
        rating = "B"
    elif attained_aer < d3 * required_cii:
        rating = "C"
    elif attained_aer < d4 * required_cii:
        rating = "D"
    else:
        rating = "E"

    return CIIResult(
        year=year,
        attained_aer=round(attained_aer, 4),
        required_cii=round(required_cii, 4),
        reference_value=round(ref_value, 4),
        reduction_factor_pct=z_pct,
        rating=rating,
        band_boundaries={
            "A_upper": round(d1 * required_cii, 4),
            "B_upper": round(d2 * required_cii, 4),
            "C_upper": round(d3 * required_cii, 4),
            "D_upper": round(d4 * required_cii, 4),
        },
        total_co2_tonnes=round(corrected_co2_tonnes, 4),
        total_distance_nm=annual_distance_nm,
        capacity=capacity,
        capacity_type=cap_type,
        uncorrected_co2_tonnes=round(uncorrected_co2_tonnes, 4),
        uncorrected_attained_aer=round(uncorrected_aer, 4),
        corrections=breakdown,
    )
