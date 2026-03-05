export interface Port {
  id: string;
  name: string;
  unlocode: string;
  country_iso: string;
  latitude: number;
  longitude: number;
  is_eu_eea: boolean;
  is_ten_t_core: boolean;
  is_ten_t_comprehensive: boolean;
  is_outermost_region: boolean;
  in_sox_eca: boolean;
  in_nox_eca: boolean;
  ops_available: boolean;
  ops_capacity_kw: number | null;
  is_user_added: boolean;
}
