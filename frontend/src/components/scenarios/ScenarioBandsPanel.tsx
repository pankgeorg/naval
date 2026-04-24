import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import CIIBandsChart from './CIIBandsChart';
import FuelEUBandsChart from './FuelEUBandsChart';
import CIIProjectionChart from './CIIProjectionChart';
import FuelEUProjectionChart from './FuelEUProjectionChart';

interface CIIData {
  attained_aer: number;
  rating: string;
  required_cii: number;
  band_boundaries: { A_upper: number; B_upper: number; C_upper: number; D_upper: number };
}

interface FuelEUData {
  weighted_intensity: number;
  target_intensity: number;
  compliance_balance_mj: number;
  compliant: boolean;
  total_covered_energy_mj: number;
}

interface ProjectionEntry {
  year: number;
  baseline: {
    cii: CIIData;
    fueleu: FuelEUData;
  };
  scenario: {
    cii: CIIData;
    fueleu: FuelEUData;
  };
}

interface Props {
  year: number;
  baselineCii: CIIData;
  scenarioCii: CIIData;
  baselineFueleu: FuelEUData;
  scenarioFueleu: FuelEUData;
  projection: ProjectionEntry[] | null;
}

type View = 'cii' | 'fueleu';

export default function ScenarioBandsPanel({
  year,
  baselineCii,
  scenarioCii,
  baselineFueleu,
  scenarioFueleu,
  projection,
}: Props) {
  const [view, setView] = useState<View>('cii');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
        <button
          type="button"
          onClick={() => setView('cii')}
          className={`px-3 py-1 rounded-md transition-colors ${
            view === 'cii' ? 'bg-maritime-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          CII
        </button>
        <button
          type="button"
          onClick={() => setView('fueleu')}
          className={`px-3 py-1 rounded-md transition-colors ${
            view === 'fueleu' ? 'bg-maritime-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          FuelEU
        </button>
      </div>

      {view === 'cii' ? (
        <CIIBandsChart baseline={baselineCii} scenario={scenarioCii} year={year} />
      ) : (
        <FuelEUBandsChart baseline={baselineFueleu} scenario={scenarioFueleu} year={year} />
      )}

      {projection && projection.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Projection {projection[0].year}–{projection[projection.length - 1].year}
            <span className="text-xs text-gray-400 ml-2">
              ({view === 'cii' ? 'CII bands tighten ~2%/yr' : 'FuelEU target tightens to -80% by 2050'})
            </span>
          </button>
          {expanded && (
            <div className="px-4 pb-4">
              {view === 'cii' ? (
                <CIIProjectionChart projection={projection} />
              ) : (
                <FuelEUProjectionChart projection={projection} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
