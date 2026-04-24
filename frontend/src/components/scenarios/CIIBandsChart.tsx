import { formatNumber } from '../../utils/formatters';

interface CIIData {
  attained_aer: number;
  rating: string;
  required_cii: number;
  band_boundaries: {
    A_upper: number;
    B_upper: number;
    C_upper: number;
    D_upper: number;
  };
}

interface Props {
  baseline: CIIData;
  scenario: CIIData;
  year: number;
}

const BAND_COLORS = {
  A: '#bbf7d0', // green-200
  B: '#d9f99d', // lime-200
  C: '#fef08a', // yellow-200
  D: '#fed7aa', // orange-200
  E: '#fecaca', // red-200
};

const BAND_TEXT = {
  A: '#14532d',
  B: '#365314',
  C: '#713f12',
  D: '#7c2d12',
  E: '#7f1d1d',
};

export default function CIIBandsChart({ baseline, scenario, year }: Props) {
  const b = baseline.band_boundaries;
  // Use the tighter of the two sets of boundaries (bands are year-specific; both results
  // use the same year so they should match; pick baseline as canonical).
  const minX = 0;
  const maxX = Math.max(
    b.D_upper * 1.3,
    baseline.attained_aer * 1.1,
    scenario.attained_aer * 1.1,
  );

  const W = 1000; // viewBox width
  const bandsY = 40;
  const bandsH = 56;
  const chartPadX = 24;
  const chartW = W - 2 * chartPadX;

  const scale = (v: number) => chartPadX + ((v - minX) / (maxX - minX)) * chartW;

  const bands: Array<{ key: 'A' | 'B' | 'C' | 'D' | 'E'; from: number; to: number }> = [
    { key: 'A', from: 0, to: b.A_upper },
    { key: 'B', from: b.A_upper, to: b.B_upper },
    { key: 'C', from: b.B_upper, to: b.C_upper },
    { key: 'D', from: b.C_upper, to: b.D_upper },
    { key: 'E', from: b.D_upper, to: maxX },
  ];

  const baseX = scale(baseline.attained_aer);
  const scenX = scale(scenario.attained_aer);
  const requiredX = scale(baseline.required_cii);

  const delta = scenario.attained_aer - baseline.attained_aer;
  const deltaPct = baseline.attained_aer !== 0
    ? (delta / baseline.attained_aer) * 100 : 0;
  const improved = delta < 0;
  const unchanged = Math.abs(deltaPct) < 0.05;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-700">
          CII Rating — Attained AER (gCO₂/t·nm), lower is better · {year}
        </h3>
      </div>
      <svg viewBox={`0 0 ${W} 150`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Bands */}
        {bands.map((band) => {
          const x1 = scale(band.from);
          const x2 = scale(band.to);
          const width = x2 - x1;
          return (
            <g key={band.key}>
              <rect
                x={x1}
                y={bandsY}
                width={width}
                height={bandsH}
                fill={BAND_COLORS[band.key]}
              />
              <text
                x={x1 + width / 2}
                y={bandsY + bandsH / 2 + 6}
                textAnchor="middle"
                style={{ fontSize: '18px' }}
                fontWeight={700}
                fill={BAND_TEXT[band.key]}
                opacity={0.7}
              >
                {band.key}
              </text>
            </g>
          );
        })}

        {/* Boundary tick labels below bands */}
        {[b.A_upper, b.B_upper, b.C_upper, b.D_upper].map((v) => (
          <g key={v}>
            <line x1={scale(v)} x2={scale(v)} y1={bandsY} y2={bandsY + bandsH} stroke="#fff" strokeWidth={1.5} />
            <text
              x={scale(v)}
              y={bandsY + bandsH + 14}
              textAnchor="middle"
              style={{ fontSize: '12px' }}
              fill="#6b7280"
            >
              {formatNumber(v, 3)}
            </text>
          </g>
        ))}

        {/* Required CII line */}
        <line
          x1={requiredX}
          x2={requiredX}
          y1={bandsY - 8}
          y2={bandsY + bandsH + 8}
          stroke="#374151"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <text
          x={requiredX}
          y={bandsY - 14}
          textAnchor="middle"
          style={{ fontSize: '11px' }}
          fill="#374151"
        >
          required {formatNumber(baseline.required_cii, 3)}
        </text>

        {/* Connector between baseline and scenario */}
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

        {/* Baseline marker: filled black dot */}
        <circle cx={baseX} cy={bandsY + bandsH / 2} r={6} fill="#111827" />
        {/* Scenario marker: black X */}
        <g transform={`translate(${scenX}, ${bandsY + bandsH / 2})`}>
          <line x1={-6} y1={-6} x2={6} y2={6} stroke="#111827" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={-6} y1={6} x2={6} y2={-6} stroke="#111827" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      </svg>

      <div className="flex items-center gap-4 text-xs text-gray-700 mt-2 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-900"></span>
          Baseline {formatNumber(baseline.attained_aer, 3)} gCO₂/t·nm ({baseline.rating})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-gray-900">✕</span>
          Scenario {formatNumber(scenario.attained_aer, 3)} gCO₂/t·nm ({scenario.rating})
        </span>
        {!unchanged && (
          <span className={`font-medium ${improved ? 'text-green-700' : 'text-red-700'}`}>
            {improved ? '▼' : '▲'} {formatNumber(Math.abs(delta), 3)} gCO₂/t·nm ({improved ? 'improved' : 'worsened'} {Math.abs(deltaPct).toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
}
