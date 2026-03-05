export interface EEDIResult {
  attained: number;
  required: number;
  reference_line: number;
  phase: number;
  reduction_pct: number;
  compliant: boolean;
  gap_pct: number;
}

export interface CIIResult {
  year: number;
  attained_aer: number;
  required_cii: number;
  reference_value: number;
  reduction_factor_pct: number;
  rating: string;
  band_boundaries: Record<string, number>;
  total_co2_tonnes: number;
  total_distance_nm: number;
  capacity: number;
  capacity_type: string;
}

export interface FuelEUResult {
  year: number;
  target_reduction_pct: number;
  target_intensity: number;
  weighted_intensity: number;
  compliance_balance_mj: number;
  compliant: boolean;
  penalty_estimate_eur: number;
  total_covered_energy_mj: number;
  total_covered_ghg_gco2eq: number;
}

export interface EUETSResult {
  year: number;
  phase_in_pct: number;
  ghg_scope: string;
  total_covered_co2_t: number;
  euas_required: number;
  eua_price_eur: number;
  cost_eur: number;
}

export interface ScenarioResult {
  baseline: {
    cii: CIIResult;
    fueleu: FuelEUResult;
    eu_ets: EUETSResult;
  };
  scenario: {
    cii: CIIResult;
    fueleu: FuelEUResult;
    eu_ets: EUETSResult;
  };
  delta: Record<string, unknown>;
}
