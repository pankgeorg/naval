"""Annual compliance report aggregator."""
from dataclasses import dataclass

from app.calculators.cii import CIIResult
from app.calculators.fueleu import FuelEUResult
from app.calculators.eu_ets import EUETSResult
from app.calculators.eedi import EEDIResult


@dataclass
class AnnualReportResult:
    year: int
    eedi: EEDIResult | None
    eexi: dict | None
    cii: CIIResult
    fueleu: FuelEUResult
    eu_ets: EUETSResult
