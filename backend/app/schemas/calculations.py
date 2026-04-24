from pydantic import BaseModel


class EEDIResponse(BaseModel):
    attained: float
    required: float
    reference_line: float
    phase: int
    reduction_pct: float
    compliant: bool
    gap_pct: float


class EEXIResponse(BaseModel):
    attained: float
    required: float
    reference_line: float
    compliant: bool
    gap_pct: float
    compliance_method: str | None = None
    epl_limited_power_kw: float | None = None


class CIIResponse(BaseModel):
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


class FuelEUResponse(BaseModel):
    year: int
    target_reduction_pct: float
    target_intensity: float
    weighted_intensity: float
    compliance_balance_mj: float
    compliant: bool
    penalty_estimate_eur: float
    total_covered_energy_mj: float
    total_covered_ghg_gco2eq: float


class EUETSResponse(BaseModel):
    year: int
    phase_in_pct: float
    ghg_scope: str
    total_covered_co2_t: float
    total_covered_ch4_co2eq_t: float
    total_covered_n2o_co2eq_t: float
    euas_required: float
    eua_price_eur: float
    cost_eur: float


class ScenarioRequest(BaseModel):
    year: int = 2025
    speed_change_pct: float = 0.0
    fuel_mix: dict[str, float] | None = None
    eua_price: float = 75.0
    projection_years: list[int] | None = None
    # When either override is provided, a single synthetic intra-EU leg is
    # used for the calc instead of the stored voyage data — useful when the
    # voyage log is incomplete and the user wants to enter yearly totals.
    override_distance_nm: float | None = None
    override_fuel_tonnes: float | None = None
    # Ephemeral CII corrections applied only to the scenario branch (not
    # persisted, not applied to baseline) — used for "what if I also record
    # these corrections" planning.
    extra_corrections: list[dict] | None = None


class ScenarioResponse(BaseModel):
    baseline: dict
    scenario: dict
    delta: dict


class ProjectionYearResponse(BaseModel):
    year: int
    cii: CIIResponse
    fueleu: FuelEUResponse
    eu_ets: EUETSResponse


class AnnualReportResponse(BaseModel):
    year: int
    eedi: EEDIResponse | None = None
    eexi: EEXIResponse | None = None
    cii: CIIResponse
    fueleu: FuelEUResponse
    eu_ets: EUETSResponse


class ReferenceDataResponse(BaseModel):
    fuel_types: list[dict]
    fueleu_targets: dict
    cii_reduction_factors: dict
    eedi_phases: list[dict]
