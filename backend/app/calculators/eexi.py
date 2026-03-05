"""EEXI calculator - uses same formula as EEDI but with EEXI-specific adjustments."""
from dataclasses import dataclass

from app.calculators.eedi import _get_capacity
from app.calculators.constants import EEDI_REF_LINES


@dataclass
class EEXIResult:
    attained: float
    required: float
    reference_line: float
    compliant: bool
    gap_pct: float
    compliance_method: str | None
    epl_limited_power_kw: float | None


def calculate_eexi(
    ship_type: str,
    dwt: float,
    gt: float,
    reference_speed_kn: float,
    fw: float,
    engines: list[dict],
    fuel_types: dict,
    attained_eexi_override: float | None = None,
    required_eexi_override: float | None = None,
    compliance_method: str | None = None,
    epl_limited_power_kw: float | None = None,
) -> EEXIResult:
    capacity = _get_capacity(ship_type, dwt, gt)
    ref_a, ref_c = EEDI_REF_LINES.get(ship_type, (1000.0, 0.5))
    ref_line = ref_a * (capacity ** (-ref_c))

    # EEXI required is typically Phase 2/3 level
    # Simplified: use a fixed reduction (varies by type, ~15-30%)
    reduction_pct = 15.0  # simplified
    required = required_eexi_override or ref_line * (1 - reduction_pct / 100)

    if attained_eexi_override is not None:
        attained = attained_eexi_override
    else:
        # Calculate like EEDI but potentially with EPL
        numerator = 0.0
        for eng in engines:
            ft = fuel_types.get(eng["primary_fuel_type"], {})
            cf = ft.get("cf_t_co2_per_t", 3.114)
            if eng["role"] == "main":
                power = epl_limited_power_kw if epl_limited_power_kw else eng["mcr_kw"] * 0.75
            else:
                power = eng["mcr_kw"]
            numerator += cf * eng["sfc_g_kwh"] * power

        denominator = fw * reference_speed_kn * capacity
        attained = numerator / denominator if denominator > 0 else 0.0

    gap_pct = ((attained - required) / required * 100) if required > 0 else 0

    return EEXIResult(
        attained=round(attained, 4),
        required=round(required, 4),
        reference_line=round(ref_line, 4),
        compliant=attained <= required,
        gap_pct=round(gap_pct, 2),
        compliance_method=compliance_method,
        epl_limited_power_kw=epl_limited_power_kw,
    )
