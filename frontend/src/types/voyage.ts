export interface FuelConsumption {
  id: string;
  voyage_leg_id: string | null;
  port_call_id: string | null;
  fuel_type_code: string;
  consumption_tonnes: number;
  co2_tonnes: number | null;
  energy_mj: number | null;
}

export interface TrackPoint {
  id: string;
  voyage_leg_id: string;
  point_order: number;
  latitude: number;
  longitude: number;
  timestamp: string | null;
  sog_knots: number | null;
}

export interface PortCall {
  id: string;
  voyage_id: string;
  port_id: string;
  call_order: number;
  arrival_time: string | null;
  departure_time: string | null;
  berth_hours: number | null;
  used_ops: boolean;
  ops_kwh_consumed: number | null;
  fuel_records: FuelConsumption[];
}

export interface VoyageLeg {
  id: string;
  voyage_id: string;
  leg_order: number;
  from_port_call_id: string;
  to_port_call_id: string;
  distance_nm: number | null;
  leg_type: string | null;
  eu_ets_coverage: number | null;
  fueleu_coverage: number | null;
  average_speed_kn: number | null;
  hours_at_sea: number | null;
  track_points: TrackPoint[];
  fuel_records: FuelConsumption[];
}

export interface Voyage {
  id: string;
  ship_id: string;
  voyage_number: string | null;
  status: string;
  departure_date: string | null;
  arrival_date: string | null;
  cargo_type: string | null;
  cargo_tonnes: number | null;
  total_distance_nm: number | null;
  notes: string | null;
  created_at: string;
  port_calls: PortCall[];
  legs: VoyageLeg[];
}
