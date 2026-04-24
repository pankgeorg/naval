import { formatNumber } from '../../utils/formatters';

interface YearEntry {
  year: number;
  baseline: {
    fueleu: {
      weighted_intensity: number;
      target_intensity: number;
    };
  };
  scenario: {
    fueleu: {
      weighted_intensity: number;
      target_intensity: number;
    };
  };
}

interface Props {
  projection: YearEntry[];
}

export default function FuelEUProjectionChart({ projection }: Props) {
  if (!projection || projection.length === 0) return null;

  const years = projection.map((p) => p.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const allValues = projection.flatMap((p) => [
    p.baseline.fueleu.weighted_intensity,
    p.scenario.fueleu.weighted_intensity,
    p.baseline.fueleu.target_intensity,
    91.16,
  ]);
  const yMax = Math.max(...allValues) * 1.05;
  const yMin = Math.min(...projection.map((p) => p.baseline.fueleu.target_intensity)) * 0.9;

  const W = 1000;
  const H = 280;
  const padL = 50, padR = 80, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xScale = (year: number) =>
    padL + ((year - minYear) / Math.max(1, maxYear - minYear)) * chartW;
  const yScale = (v: number) =>
    padT + (1 - (v - yMin) / (yMax - yMin)) * chartH;

  // Green region: below the target line (compliant)
  // Red region: above the target line (non-compliant)
  const targetPts = projection.map((p) => `${xScale(p.year)},${yScale(p.baseline.fueleu.target_intensity)}`);
  const greenPoly = [
    `${padL},${yScale(yMin)}`,
    ...targetPts,
    `${padL + chartW},${yScale(yMin)}`,
  ].join(' ');
  const redPoly = [
    `${padL},${yScale(yMax)}`,
    ...targetPts,
    `${padL + chartW},${yScale(yMax)}`,
  ].join(' ');

  const baselinePath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year)},${yScale(p.baseline.fueleu.weighted_intensity)}`)
    .join(' ');
  const scenarioPath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year)},${yScale(p.scenario.fueleu.weighted_intensity)}`)
    .join(' ');
  const targetPath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year)},${yScale(p.baseline.fueleu.target_intensity)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <polygon points={redPoly} fill="#fecaca" opacity={0.6} />
      <polygon points={greenPoly} fill="#bbf7d0" opacity={0.6} />

      {/* Target line */}
      <path d={targetPath} stroke="#16a34a" strokeWidth={1.5} fill="none" strokeDasharray="4,3" />
      <text
        x={W - padR + 8}
        y={yScale(projection[projection.length - 1].baseline.fueleu.target_intensity) + 4}
        fontSize={10}
        fill="#16a34a"
      >
        target
      </text>

      {/* Baseline */}
      <path d={baselinePath} stroke="#111827" strokeWidth={2} fill="none" />
      {projection.map((p) => (
        <circle
          key={`b-${p.year}`}
          cx={xScale(p.year)}
          cy={yScale(p.baseline.fueleu.weighted_intensity)}
          r={3.5}
          fill="#111827"
        />
      ))}

      {/* Scenario */}
      <path d={scenarioPath} stroke="#111827" strokeWidth={2} fill="none" strokeDasharray="5,4" />
      {projection.map((p) => (
        <g key={`s-${p.year}`} transform={`translate(${xScale(p.year)}, ${yScale(p.scenario.fueleu.weighted_intensity)})`}>
          <line x1={-4} y1={-4} x2={4} y2={4} stroke="#111827" strokeWidth={2} strokeLinecap="round" />
          <line x1={-4} y1={4} x2={4} y2={-4} stroke="#111827" strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}

      {projection.map((p) => (
        <text
          key={`x-${p.year}`}
          x={xScale(p.year)}
          y={H - 8}
          textAnchor="middle"
          fontSize={11}
          fill="#6b7280"
        >
          {p.year}
        </text>
      ))}

      {[yMin, (yMin + yMax) / 2, yMax].map((v) => (
        <text
          key={`y-${v}`}
          x={padL - 6}
          y={yScale(v) + 4}
          textAnchor="end"
          fontSize={10}
          fill="#6b7280"
        >
          {formatNumber(v, 3)}
        </text>
      ))}
      <text x={padL - 6} y={padT - 6} textAnchor="end" fontSize={10} fill="#6b7280">gCO₂eq/MJ</text>
    </svg>
  );
}
