export interface Engine {
  id: string;
  ship_id: string;
  role: string;
  designation: string;
  manufacturer: string | null;
  model: string | null;
  mcr_kw: number;
  rpm_rated: number | null;
  engine_type: string | null;
  primary_fuel_type: string;
  sfc_g_kwh: number;
  is_dual_fuel: boolean;
  secondary_fuel_type: string | null;
  secondary_sfc_g_kwh: number | null;
  nox_tier: string | null;
}

export interface Ship {
  id: string;
  owner_id: string | null;
  imo_number: string;
  name: string;
  flag_state: string;
  ship_type: string;
  dwt: number;
  gt: number;
  nt: number | null;
  build_date: string;
  delivery_date: string | null;
  reference_speed_kn: number;
  design_draught_m: number;
  fw: number;
  block_coefficient: number | null;
  attained_eedi: number | null;
  required_eedi: number | null;
  eedi_phase: number | null;
  attained_eexi: number | null;
  required_eexi: number | null;
  eexi_compliance_method: string | null;
  epl_limited_power_kw: number | null;
  ice_class: string | null;
  has_cargo_heating: boolean;
  is_shuttle_tanker: boolean;
  is_self_unloading_bc: boolean;
  ism_doc_holder: string | null;
  ops_capable: boolean;
  ops_installed_kw: number | null;
  pooling_group_id: string | null;
  class_society: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  engines: Engine[];
}

export interface EngineCreate {
  role: string;
  designation: string;
  manufacturer?: string | null;
  model?: string | null;
  mcr_kw: number;
  rpm_rated?: number | null;
  engine_type?: string | null;
  primary_fuel_type: string;
  sfc_g_kwh: number;
  is_dual_fuel: boolean;
  secondary_fuel_type?: string | null;
  secondary_sfc_g_kwh?: number | null;
  nox_tier?: string | null;
}

export interface ShipCreate {
  imo_number: string;
  name: string;
  flag_state: string;
  ship_type: string;
  dwt: number;
  gt: number;
  build_date: string;
  reference_speed_kn: number;
  design_draught_m: number;
  engines?: EngineCreate[];
  [key: string]: unknown;
}

export type ShipUpdate = Partial<Omit<ShipCreate, 'imo_number'>>;

export const SHIP_TYPES = [
  { value: 'bulk_carrier', label: 'Bulk Carrier' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'container', label: 'Container Ship' },
  { value: 'gas_carrier', label: 'Gas Carrier' },
  { value: 'general_cargo', label: 'General Cargo' },
  { value: 'refrigerated_cargo', label: 'Refrigerated Cargo' },
  { value: 'combination_carrier', label: 'Combination Carrier' },
  { value: 'lng_carrier', label: 'LNG Carrier' },
  { value: 'cruise_passenger', label: 'Cruise / Passenger' },
  { value: 'roro_cargo', label: 'RoRo Cargo' },
  { value: 'roro_passenger', label: 'RoRo Passenger' },
  { value: 'vehicle_carrier', label: 'Vehicle Carrier' },
] as const;
