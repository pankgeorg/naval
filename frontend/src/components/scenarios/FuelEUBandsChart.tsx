import { formatNumber } from '../../utils/formatters';

interface FuelEUData {
  weighted_intensity: number;
  target_intensity: number;
  compliance_balance_mj: number;
  compliant: boolean;
  total_covered_energy_mj: number;
}

interface Props {
  baseline: FuelEUData;
  scenario: FuelEUData;
  year: number;
}

// Year → reduction % from 91.16 baseline (FUELEU_TARGETS in backend constants).
// Duplicated here so the chart can render year markers on the axis without an extra API call.
const FUELEU_BASELINE = 91.16;
const FUELEU_REDUCTION_BY_YEAR: Array<{ year: number; pct: number }> = [
  { year: 2025, pct: 2 },
  { year: 2030, pct: 6 },
  { year: 2035, pct: 14.5 },
  { year: 2040, pct: 31 },
  { year: 2045, pct: 62 },
  { year: 2050, pct: 80 },
];
const targetFor = (pct: number) => FUELEU_BASELINE * (1 - pct / 100);

export default function FuelEUBandsChart({ baseline, scenario, year }: Props) {
  // Domain: from 2050 target (most stringent) to slightly above the highest intensity.
  const topIntensity = Math.max(baseline.weighted_intensity, scenario.weighted_intensity, FUELEU_BASELINE) * 1.02;
  const minX = targetFor(80) * 0.9;
  const maxX = topIntensity;

  const W = 1000;
  const bandsY = 40;
  const bandsH = 56;
  const chartPadX = 24;
  const chartW = W - 2 * chartPadX;

  const scale = (v: number) => chartPadX + ((v - minX) / (maxX - minX)) * chartW;

  // Build bands from strictest target (left / compliant through 2050) to laxest (right).
  // Each "band" is bounded by two successive year targets.
  const targetsAsc = [...FUELEU_REDUCTION_BY_YEAR]
    .sort((a, b) => targetFor(a.pct) - targetFor(b.pct));

  type Band = { from: number; to: number; label: string; color: string };
  const bands: Band[] = [];
  // Region to the left of the strictest target → "compliant through 2050+"
  bands.push({
    from: minX,
    to: targetFor(targetsAsc[0].pct),
    label: `≤${targetsAsc[0].year}`,
    color: '#bbf7d0',
  });
  const colors = ['#d9f99d', '#fef08a', '#fed7aa', '#fca5a5', '#fecaca'];
  for (let i = 0; i < targetsAsc.length - 1; i++) {
    bands.push({
      from: targetFor(targetsAsc[i].pct),
      to: targetFor(targetsAsc[i + 1].pct),
      label: `${targetsAsc[i].year}`,
      color: colors[Math.min(i, colors.length - 1)],
    });
  }
  // Right of the laxest target (2025) → red: non-compliant even today
  bands.push({
    from: targetFor(targetsAsc[targetsAsc.length - 1].pct),
    to: maxX,
    label: `>${targetsAsc[targetsAsc.length - 1].year}`,
    color: '#fca5a5',
  });

  const baseX = scale(baseline.weighted_intensity);
  const scenX = scale(scenario.weighted_intensity);

  const currentTarget = baseline.target_intensity;
  const currentTargetX = scale(currentTarget);

  const delta = scenario.weighted_intensity - baseline.weighted_intensity;
  const deltaPct = baseline.weighted_intensity !== 0
    ? (delta / baseline.weighted_intensity) * 100 : 0;
  const improved = delta < 0;
  const unchanged = Math.abs(deltaPct) < 0.05;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-700">
          FuelEU Intensity (gCO₂eq/MJ), lower is better · {year}
        </h3>
      </div>
      <svg viewBox={`0 0 ${W} 150`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {bands.map((band, i) => {
          const x1 = scale(band.from);
          const x2 = scale(band.to);
          const w = x2 - x1;
          if (w <= 0) return null;
          return (
            <g key={i}>
              <rect x={x1} y={bandsY} width={w} height={bandsH} fill={band.color} />
              {w > 50 && (
                <text
                  x={x1 + w / 2}
                  y={bandsY + bandsH / 2 + 5}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#374151"
                  opacity={0.7}
                >
                  {band.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Boundary labels (year targets) below */}
        {targetsAsc.map((t) => (
          <g key={t.year}>
            <line x1={scale(targetFor(t.pct))} x2={scale(targetFor(t.pct))} y1={bandsY} y2={bandsY + bandsH} stroke="#fff" strokeWidth={1.5} />
            <text
              x={scale(targetFor(t.pct))}
              y={bandsY + bandsH + 14}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {formatNumber(targetFor(t.pct), 3)}
            </text>
          </g>
        ))}

        {/* Current-year target emphasized */}
        <line
          x1={currentTargetX}
          x2={currentTargetX}
          y1={bandsY - 8}
          y2={bandsY + bandsH + 8}
          stroke="#374151"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <text
          x={currentTargetX}
          y={bandsY - 14}
          textAnchor="middle"
          fontSize={10}
          fill="#374151"
        >
          {year} target {formatNumber(currentTarget, 3)}
        </text>

        {!unchanged && (
          <line
            x1={baseX}
            x2={scenX}
            y1={bandsY + bandsH / 2}
            y2={bandsY + bandsH / 2}
            stroke="#111827"
            strokeWidth={1}
            strokeDasharray="2,3"
            opacity={0.5}
          />
        )}
        <circle cx={baseX} cy={bandsY + bandsH / 2} r={6} fill="#111827" />
        <g transform={`translate(${scenX}, ${bandsY + bandsH / 2})`}>
          <line x1={-6} y1={-6} x2={6} y2={6} stroke="#111827" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={-6} y1={6} x2={6} y2={-6} stroke="#111827" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </svg>

      <div className="flex items-center gap-4 text-xs text-gray-700 mt-2 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-900"></span>
          Baseline {formatNumber(baseline.weighted_intensity, 3)} gCO₂eq/MJ · {baseline.compliant ? 'compliant' : 'deficit'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-gray-900">✕</span>
          Scenario {formatNumber(scenario.weighted_intensity, 3)} gCO₂eq/MJ · {scenario.compliant ? 'compliant' : 'deficit'}
        </span>
        {!unchanged && (
          <span className={`font-medium ${improved ? 'text-green-700' : 'text-red-700'}`}>
            {improved ? '▼' : '▲'} {Math.abs(deltaPct).toFixed(1)}% intensity
          </span>
        )}
      </div>
    </div>
  );
}
