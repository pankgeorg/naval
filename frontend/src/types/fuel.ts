export interface FuelType {
  code: string;
  display_name: string;
  cf_t_co2_per_t: number;
  lcv_mj_per_kg: number;
  wtw_total_default: number;
  is_rfnbo: boolean;
  sulfur_pct: number;
}
