"""Regulatory constants for maritime compliance calculations."""

EEDI_REF_LINES: dict[str, tuple[float, float]] = {
    "bulk_carrier": (961.79, 0.477),
    "gas_carrier": (1120.00, 0.456),
    "tanker": (1218.80, 0.488),
    "container": (174.22, 0.201),
    "general_cargo": (107.48, 0.216),
    "refrigerated_cargo": (227.01, 0.244),
    "combination_carrier": (1219.00, 0.488),
    "lng_carrier": (2253.7, 0.474),
    "roro_cargo": (1405.15, 0.498),
    "roro_passenger": (752.16, 0.381),
    "cruise_passenger": (170.84, 0.214),
    "vehicle_carrier": (3627.7, 0.590),
}

EEDI_REDUCTIONS: list[tuple[str, float | None, float | None, int, int, int, int]] = [
    ("bulk_carrier", 20000, None, 0, 10, 20, 30),
    ("bulk_carrier", 10000, 20000, 0, 0, 0, 0),
    ("tanker", 20000, None, 0, 10, 20, 30),
    ("container", 200000, None, 0, 10, 20, 50),
    ("container", 120000, 200000, 0, 10, 20, 45),
    ("container", 80000, 120000, 0, 10, 20, 40),
    ("container", 40000, 80000, 0, 10, 20, 35),
    ("container", 15000, 40000, 0, 10, 20, 30),
    ("gas_carrier", 10000, None, 0, 10, 20, 30),
    ("general_cargo", 15000, None, 0, 10, 15, 30),
    ("lng_carrier", 10000, None, 0, 10, 20, 30),
    ("cruise_passenger", 25000, None, 0, 5, 20, 30),
]

CII_REF_LINES: dict[str, tuple[float, float, str]] = {
    "bulk_carrier": (4745.0, 0.622, "dwt"),
    "gas_carrier": (8714.0, 0.652, "dwt"),
    "tanker": (5247.0, 0.610, "dwt"),
    "container": (1984.0, 0.489, "dwt"),
    "general_cargo": (588.0, 0.3885, "dwt"),
    "refrigerated_cargo": (4600.0, 0.557, "dwt"),
    "combination_carrier": (5119.0, 0.622, "dwt"),
    "lng_carrier": (9827.0, 0.610, "dwt"),
    "roro_cargo": (10952.0, 0.637, "dwt"),
    "roro_passenger": (7540.0, 0.587, "gt"),
    "cruise_passenger": (930.4, 0.383, "gt"),
    "vehicle_carrier": (18455.0, 0.696, "dwt"),
}

CII_REDUCTION_FACTORS: dict[int, float] = {
    2023: 5.0,
    2024: 7.0,
    2025: 9.0,
    2026: 11.0,
    2027: 13.0,
    2028: 15.0,
    2029: 17.0,
    2030: 19.0,
}

CII_RATING_BOUNDARIES: dict[str, tuple[float, float, float, float]] = {
    "bulk_carrier": (0.86, 0.94, 1.06, 1.18),
    "gas_carrier": (0.81, 0.91, 1.12, 1.44),
    "tanker": (0.82, 0.93, 1.08, 1.28),
    "container": (0.83, 0.94, 1.07, 1.19),
    "general_cargo": (0.83, 0.94, 1.06, 1.19),
    "refrigerated_cargo": (0.78, 0.91, 1.07, 1.20),
    "combination_carrier": (0.87, 0.96, 1.06, 1.14),
    "lng_carrier": (0.89, 0.98, 1.06, 1.13),
    "roro_cargo": (0.66, 0.90, 1.04, 1.27),
    "roro_passenger": (0.72, 0.90, 1.08, 1.28),
    "cruise_passenger": (0.87, 0.95, 1.06, 1.16),
    "vehicle_carrier": (0.86, 0.94, 1.06, 1.18),
}

FUELEU_REFERENCE_VALUE = 91.16  # gCO2eq/MJ (2020 baseline)

FUELEU_TARGETS: dict[int, tuple[float, float]] = {
    2025: (2.0, 89.34),
    2030: (6.0, 85.69),
    2035: (14.5, 77.94),
    2040: (31.0, 62.90),
    2045: (62.0, 34.64),
    2050: (80.0, 18.23),
}

FUELEU_RFNBO_MULTIPLIER = 2.0
FUELEU_RFNBO_MULTIPLIER_EXPIRY = 2033
FUELEU_OPS_PENALTY_EUR_PER_KWH = 1.50
FUELEU_GHG_PENALTY_PRICE_EUR_PER_T_VLSFO = 2400.0

EU_ETS_PHASE_IN: dict[int, tuple[float, str]] = {
    2024: (0.40, "co2_only"),
    2025: (0.70, "co2_only"),
    2026: (1.00, "co2eq"),
    2027: (1.00, "co2eq"),
    2028: (1.00, "co2eq"),
    2029: (1.00, "co2eq"),
    2030: (1.00, "co2eq"),
}

EU_ETS_EXCESS_PENALTY_EUR_PER_T = 100.0
EU_ETS_DEFAULT_EUA_EUR = 75.0
