"""Seed reference tables on startup."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference import FuelType, EEDIRefLine, CIIRefLine, CIIRatingBoundary


FUEL_TYPES_DATA = [
    ("hfo", "Heavy Fuel Oil (HFO)", 3.114, 40.200, 13.5, 77.05, 0.30, 0.93, 91.78, False, 2.50),
    ("lfo", "Light Fuel Oil (LFO)", 3.151, 41.200, 13.2, 76.53, 0.30, 0.93, 90.96, False, 1.00),
    ("vlsfo", "Very Low Sulfur FO", 3.114, 40.200, 13.5, 77.05, 0.30, 0.93, 91.78, False, 0.50),
    ("mdo", "Marine Diesel Oil (MDO)", 3.206, 42.700, 14.4, 75.10, 0.30, 0.97, 90.77, False, 0.50),
    ("mgo", "Marine Gas Oil (MGO)", 3.206, 42.700, 14.4, 75.10, 0.30, 0.97, 90.77, False, 0.10),
    ("lng_lpdf", "LNG (LPDF 4-stroke Otto)", 2.750, 48.000, 18.5, 56.94, 14.4, 0.39, 90.23, False, 0.00),
    ("lng_hpdf", "LNG (HPDF 2-stroke Diesel)", 2.750, 48.000, 18.5, 56.94, 2.24, 0.39, 78.07, False, 0.00),
    ("lpg_propane", "LPG (Propane)", 3.000, 46.300, 7.50, 64.83, 0.02, 0.93, 73.28, False, 0.00),
    ("lpg_butane", "LPG (Butane)", 3.030, 45.700, 7.50, 66.30, 0.02, 0.93, 74.75, False, 0.00),
    ("methanol_fossil", "Methanol (Fossil)", 1.375, 19.900, 31.3, 69.08, 0.06, 0.93, 101.37, False, 0.00),
    ("bio_methanol", "Bio-Methanol (waste)", 1.375, 19.900, 5.0, 69.08, 0.06, 0.93, 75.07, False, 0.00),
    ("e_methanol", "E-Methanol (RFNBO)", 1.375, 19.900, 3.0, 69.08, 0.06, 0.93, 73.07, True, 0.00),
    ("bio_lng", "Bio-LNG (from biowaste)", 2.750, 48.000, 10.0, 56.94, 14.4, 0.39, 81.73, False, 0.00),
    ("e_lng", "E-LNG/e-methane (RFNBO)", 2.750, 48.000, 3.0, 56.94, 14.4, 0.39, 74.73, True, 0.00),
    ("green_nh3", "Green Ammonia (RFNBO)", 0.000, 18.600, 5.0, 0.00, 0.00, 2.24, 7.24, True, 0.00),
    ("grey_nh3", "Grey Ammonia (Fossil)", 0.000, 18.600, 121.0, 0.00, 0.00, 2.24, 123.24, False, 0.00),
    ("green_h2", "Green Hydrogen (RFNBO)", 0.000, 120.000, 4.0, 0.00, 0.00, 0.00, 4.00, True, 0.00),
    ("electricity", "Shore Power (Electricity)", 0.000, 3.600, 0.0, 0.00, 0.00, 0.00, 0.00, False, 0.00),
    ("hvo", "HVO Biodiesel", 2.834, 44.000, 8.0, 64.45, 0.02, 0.93, 73.40, False, 0.00),
    ("fame", "FAME Biodiesel", 2.834, 37.200, 15.0, 76.20, 0.02, 0.93, 92.15, False, 0.00),
    ("ethanol", "Ethanol", 1.913, 26.800, 15.0, 71.34, 0.06, 0.93, 87.33, False, 0.00),
]

EEDI_REF_LINES_DATA = [
    ("bulk_carrier", 961.79, 0.477),
    ("gas_carrier", 1120.00, 0.456),
    ("tanker", 1218.80, 0.488),
    ("container", 174.22, 0.201),
    ("general_cargo", 107.48, 0.216),
    ("refrigerated_cargo", 227.01, 0.244),
    ("combination_carrier", 1219.00, 0.488),
    ("lng_carrier", 2253.7, 0.474),
    ("roro_cargo", 1405.15, 0.498),
    ("roro_passenger", 752.16, 0.381),
    ("cruise_passenger", 170.84, 0.214),
    ("vehicle_carrier", 3627.7, 0.590),
]

CII_REF_LINES_DATA = [
    ("bulk_carrier", 4745.0, 0.622, "dwt"),
    ("gas_carrier", 8714.0, 0.652, "dwt"),
    ("tanker", 5247.0, 0.610, "dwt"),
    ("container", 1984.0, 0.489, "dwt"),
    ("general_cargo", 588.0, 0.3885, "dwt"),
    ("refrigerated_cargo", 4600.0, 0.557, "dwt"),
    ("combination_carrier", 5119.0, 0.622, "dwt"),
    ("lng_carrier", 9827.0, 0.610, "dwt"),
    ("roro_cargo", 10952.0, 0.637, "dwt"),
    ("roro_passenger", 7540.0, 0.587, "gt"),
    ("cruise_passenger", 930.4, 0.383, "gt"),
    ("vehicle_carrier", 18455.0, 0.696, "dwt"),
]

CII_RATING_BOUNDARIES_DATA = [
    ("bulk_carrier", 0.86, 0.94, 1.06, 1.18),
    ("gas_carrier", 0.81, 0.91, 1.12, 1.44),
    ("tanker", 0.82, 0.93, 1.08, 1.28),
    ("container", 0.83, 0.94, 1.07, 1.19),
    ("general_cargo", 0.83, 0.94, 1.06, 1.19),
    ("refrigerated_cargo", 0.78, 0.91, 1.07, 1.20),
    ("combination_carrier", 0.87, 0.96, 1.06, 1.14),
    ("lng_carrier", 0.89, 0.98, 1.06, 1.13),
    ("roro_cargo", 0.66, 0.90, 1.04, 1.27),
    ("roro_passenger", 0.72, 0.90, 1.08, 1.28),
    ("cruise_passenger", 0.87, 0.95, 1.06, 1.16),
    ("vehicle_carrier", 0.86, 0.94, 1.06, 1.18),
]


async def seed_reference_tables(session: AsyncSession) -> None:
    """Seed reference tables if they don't exist yet."""
    # Check if already seeded
    result = await session.execute(select(FuelType).limit(1))
    if result.scalars().first() is not None:
        return

    # Seed fuel types
    for row in FUEL_TYPES_DATA:
        ft = FuelType(
            code=row[0],
            display_name=row[1],
            cf_t_co2_per_t=row[2],
            lcv_mj_per_kg=row[3],
            wtt_default=row[4],
            ttw_co2_default=row[5],
            ttw_ch4_co2eq_default=row[6],
            ttw_n2o_co2eq_default=row[7],
            wtw_total_default=row[8],
            is_rfnbo=row[9],
            sulfur_pct=row[10],
        )
        session.add(ft)

    # Seed EEDI reference lines
    for row in EEDI_REF_LINES_DATA:
        session.add(EEDIRefLine(ship_type=row[0], a=row[1], c=row[2]))

    # Seed CII reference lines
    for row in CII_REF_LINES_DATA:
        session.add(CIIRefLine(ship_type=row[0], a=row[1], c=row[2], capacity_type=row[3]))

    # Seed CII rating boundaries
    for row in CII_RATING_BOUNDARIES_DATA:
        session.add(CIIRatingBoundary(ship_type=row[0], d1=row[1], d2=row[2], d3=row[3], d4=row[4]))

    await session.commit()
