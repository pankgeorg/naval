"""Tests for calculator modules — pure function tests, no DB required."""
from datetime import date

from app.calculators.geo import haversine, track_distance_nm, classify_leg
from app.calculators.eedi import calculate_eedi, determine_eedi_phase, _get_capacity
from app.calculators.cii import calculate_cii, get_cii_capacity
from app.calculators.fueleu import calculate_fueleu
from app.calculators.eu_ets import calculate_eu_ets
from app.calculators.scenario import run_scenario
from app.calculators.projection import project_compliance


# --- Fuel types fixture ---
FUEL_TYPES = {
    "vlsfo": {
        "cf_t_co2_per_t": 3.114,
        "lcv_mj_per_kg": 40.200,
        "wtt_default": 13.5,
        "ttw_co2_default": 77.05,
        "ttw_ch4_co2eq_default": 0.30,
        "ttw_n2o_co2eq_default": 0.93,
        "wtw_total_default": 91.78,
        "is_rfnbo": False,
        "sulfur_pct": 0.50,
    },
    "mgo": {
        "cf_t_co2_per_t": 3.206,
        "lcv_mj_per_kg": 42.700,
        "wtt_default": 14.4,
        "ttw_co2_default": 75.10,
        "ttw_ch4_co2eq_default": 0.30,
        "ttw_n2o_co2eq_default": 0.97,
        "wtw_total_default": 90.77,
        "is_rfnbo": False,
        "sulfur_pct": 0.10,
    },
    "e_methanol": {
        "cf_t_co2_per_t": 1.375,
        "lcv_mj_per_kg": 19.900,
        "wtt_default": 3.0,
        "ttw_co2_default": 69.08,
        "ttw_ch4_co2eq_default": 0.06,
        "ttw_n2o_co2eq_default": 0.93,
        "wtw_total_default": 73.07,
        "is_rfnbo": True,
        "sulfur_pct": 0.00,
    },
}


# ============================================================
# Geo Tests
# ============================================================
class TestHaversine:
    def test_same_point(self):
        assert haversine(0, 0, 0, 0) == 0.0

    def test_known_distance(self):
        # Rotterdam to Antwerp (~55 nm)
        d = haversine(51.9225, 4.47917, 51.2194, 4.4025)
        assert 40 < d < 60

    def test_long_distance(self):
        # Rotterdam to Singapore (~5200 nm)
        d = haversine(51.9225, 4.47917, 1.2644, 103.8222)
        assert 5000 < d < 6000


class TestTrackDistance:
    def test_empty_track(self):
        assert track_distance_nm([]) == 0.0

    def test_single_point(self):
        assert track_distance_nm([{"latitude": 0, "longitude": 0}]) == 0.0

    def test_multi_point(self):
        points = [
            {"latitude": 51.9225, "longitude": 4.47917},
            {"latitude": 51.5, "longitude": 3.5},
            {"latitude": 51.2194, "longitude": 4.4025},
        ]
        d = track_distance_nm(points)
        assert d > 0


class TestClassifyLeg:
    def test_intra_eu(self):
        result = classify_leg(
            {"is_eu_eea": True, "is_outermost_region": False},
            {"is_eu_eea": True, "is_outermost_region": False},
        )
        assert result.leg_type == "intra_eu"
        assert result.eu_ets_coverage == 1.0
        assert result.fueleu_coverage == 1.0

    def test_extra_eu(self):
        result = classify_leg(
            {"is_eu_eea": True, "is_outermost_region": False},
            {"is_eu_eea": False, "is_outermost_region": False},
        )
        assert result.leg_type == "extra_eu"
        assert result.eu_ets_coverage == 0.5

    def test_non_eu(self):
        result = classify_leg(
            {"is_eu_eea": False, "is_outermost_region": False},
            {"is_eu_eea": False, "is_outermost_region": False},
        )
        assert result.leg_type == "non_eu"
        assert result.eu_ets_coverage == 0.0

    def test_outermost_region(self):
        result = classify_leg(
            {"is_eu_eea": True, "is_outermost_region": True},
            {"is_eu_eea": True, "is_outermost_region": False},
        )
        assert result.leg_type == "intra_eu_outermost"
        assert result.eu_ets_coverage == 0.5


# ============================================================
# EEDI Tests
# ============================================================
class TestEEDI:
    def test_bulk_carrier(self):
        engines = [
            {"role": "main", "mcr_kw": 10000, "primary_fuel_type": "vlsfo", "sfc_g_kwh": 170},
            {"role": "auxiliary", "mcr_kw": 1500, "primary_fuel_type": "mgo", "sfc_g_kwh": 210},
        ]
        result = calculate_eedi(
            "bulk_carrier", 80000, 40000, 14.5, 1.0,
            date(2020, 1, 1), engines, FUEL_TYPES,
        )
        assert result.attained > 0
        assert result.required > 0
        assert result.reference_line > 0
        assert result.phase >= 0

    def test_capacity_container(self):
        cap = _get_capacity("container", 100000, 80000)
        assert cap == 70000  # 70% DWT for containers

    def test_capacity_cruise(self):
        cap = _get_capacity("cruise_passenger", 50000, 120000)
        assert cap == 120000  # GT for cruise

    def test_phase_determination(self):
        assert determine_eedi_phase(date(2010, 1, 1), "bulk_carrier") == 0
        assert determine_eedi_phase(date(2021, 1, 1), "bulk_carrier") == 2
        assert determine_eedi_phase(date(2026, 1, 1), "bulk_carrier") == 3
        assert determine_eedi_phase(None, "bulk_carrier") == 0


# ============================================================
# CII Tests
# ============================================================
class TestCII:
    def test_basic_cii(self):
        records = [
            {"fuel_type_code": "vlsfo", "consumption_tonnes": 5000},
        ]
        result = calculate_cii(
            "bulk_carrier", 80000, 40000, records, 50000, 2025, FUEL_TYPES,
        )
        assert result.rating in ("A", "B", "C", "D", "E")
        assert result.attained_aer > 0
        assert result.required_cii > 0
        assert result.year == 2025

    def test_zero_distance(self):
        records = [{"fuel_type_code": "vlsfo", "consumption_tonnes": 100}]
        result = calculate_cii(
            "bulk_carrier", 80000, 40000, records, 0, 2025, FUEL_TYPES,
        )
        assert result.attained_aer == 0.0

    def test_cii_capacity_gt(self):
        cap, cap_type = get_cii_capacity("cruise_passenger", 50000, 120000)
        assert cap == 120000
        assert cap_type == "gt"

    def test_cii_rating_bands(self):
        # High emissions => D or E
        records = [{"fuel_type_code": "vlsfo", "consumption_tonnes": 20000}]
        result = calculate_cii(
            "bulk_carrier", 80000, 40000, records, 30000, 2025, FUEL_TYPES,
        )
        assert result.rating in ("C", "D", "E")


# ============================================================
# FuelEU Tests
# ============================================================
class TestFuelEU:
    def test_no_voyages(self):
        result = calculate_fueleu([], 2025, FUEL_TYPES)
        assert result.weighted_intensity == 0.0
        assert result.compliant

    def test_basic_fueleu(self):
        voyages = [
            {
                "legs": [
                    {
                        "fueleu_coverage": 1.0,
                        "fuel_records": [
                            {"fuel_type_code": "vlsfo", "consumption_tonnes": 500},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        result = calculate_fueleu(voyages, 2025, FUEL_TYPES)
        assert result.weighted_intensity > 0
        assert result.total_covered_energy_mj > 0

    def test_rfnbo_multiplier(self):
        voyages = [
            {
                "legs": [
                    {
                        "fueleu_coverage": 1.0,
                        "fuel_records": [
                            {"fuel_type_code": "e_methanol", "consumption_tonnes": 500},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        result = calculate_fueleu(voyages, 2025, FUEL_TYPES)
        # RFNBO should get 2x energy multiplier
        assert result.total_covered_energy_mj > 500 * 19.9 * 1000


# ============================================================
# EU ETS Tests
# ============================================================
class TestEUETS:
    def test_no_voyages(self):
        result = calculate_eu_ets([], 2025, FUEL_TYPES)
        assert result.euas_required == 0.0
        assert result.cost_eur == 0.0

    def test_basic_ets(self):
        voyages = [
            {
                "legs": [
                    {
                        "eu_ets_coverage": 1.0,
                        "fuel_records": [
                            {"fuel_type_code": "vlsfo", "consumption_tonnes": 1000},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        result = calculate_eu_ets(voyages, 2025, FUEL_TYPES, eua_price_eur=80.0)
        assert result.euas_required > 0
        assert result.cost_eur > 0
        assert result.phase_in_pct == 0.70  # 2025 = 70%
        assert result.eua_price_eur == 80.0

    def test_non_eu_leg(self):
        voyages = [
            {
                "legs": [
                    {
                        "eu_ets_coverage": 0.0,
                        "fuel_records": [
                            {"fuel_type_code": "vlsfo", "consumption_tonnes": 1000},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        result = calculate_eu_ets(voyages, 2025, FUEL_TYPES)
        assert result.euas_required == 0.0


# ============================================================
# Scenario Tests
# ============================================================
class TestScenario:
    def test_baseline_scenario(self):
        voyages = [
            {
                "legs": [
                    {
                        "distance_nm": 1000,
                        "eu_ets_coverage": 1.0,
                        "fueleu_coverage": 1.0,
                        "average_speed_kn": 14,
                        "hours_at_sea": 71,
                        "fuel_records": [
                            {"fuel_type_code": "vlsfo", "consumption_tonnes": 500},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        result = run_scenario(
            "bulk_carrier", 80000, 40000,
            voyages, 2025, FUEL_TYPES,
            speed_change_pct=0.0,
        )
        assert result.cii.rating in ("A", "B", "C", "D", "E")

    def test_speed_reduction(self):
        voyages = [
            {
                "legs": [
                    {
                        "distance_nm": 1000,
                        "eu_ets_coverage": 1.0,
                        "fueleu_coverage": 1.0,
                        "average_speed_kn": 14,
                        "hours_at_sea": 71,
                        "fuel_records": [
                            {"fuel_type_code": "vlsfo", "consumption_tonnes": 500},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        baseline = run_scenario(
            "bulk_carrier", 80000, 40000,
            voyages, 2025, FUEL_TYPES, speed_change_pct=0.0,
        )
        reduced = run_scenario(
            "bulk_carrier", 80000, 40000,
            voyages, 2025, FUEL_TYPES, speed_change_pct=-10.0,
        )
        # Speed reduction should lower EU ETS cost
        assert reduced.eu_ets.cost_eur < baseline.eu_ets.cost_eur


# ============================================================
# Projection Tests
# ============================================================
class TestProjection:
    def test_multi_year(self):
        voyages = [
            {
                "legs": [
                    {
                        "distance_nm": 1000,
                        "eu_ets_coverage": 1.0,
                        "fueleu_coverage": 1.0,
                        "fuel_records": [
                            {"fuel_type_code": "vlsfo", "consumption_tonnes": 500},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        results = project_compliance(
            "bulk_carrier", 80000, 40000,
            voyages, 2025, [2025, 2030, 2050], FUEL_TYPES,
        )
        assert len(results) == 3
        assert results[0].year == 2025
        assert results[1].year == 2030
        assert results[2].year == 2050

    def test_improving_assumptions(self):
        voyages = [
            {
                "legs": [
                    {
                        "distance_nm": 1000,
                        "eu_ets_coverage": 1.0,
                        "fueleu_coverage": 1.0,
                        "fuel_records": [
                            {"fuel_type_code": "vlsfo", "consumption_tonnes": 500},
                        ],
                    },
                ],
                "port_calls": [],
            },
        ]
        constant = project_compliance(
            "bulk_carrier", 80000, 40000,
            voyages, 2025, [2030], FUEL_TYPES,
            operational_assumptions="constant",
        )
        improving = project_compliance(
            "bulk_carrier", 80000, 40000,
            voyages, 2025, [2030], FUEL_TYPES,
            operational_assumptions="improving_2pct_year",
        )
        # Improving should have lower CO2
        assert improving[0].cii.total_co2_tonnes < constant[0].cii.total_co2_tonnes
