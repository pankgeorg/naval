import { formatNumber } from '../../utils/formatters';

interface YearEntry {
  year: number;
  baseline: {
    cii: {
      attained_aer: number;
      required_cii: number;
      band_boundaries: { A_upper: number; B_upper: number; C_upper: number; D_upper: number };
    };
  };
  scenario: {
    cii: {
      attained_aer: number;
      required_cii: number;
      band_boundaries: { A_upper: number; B_upper: number; C_upper: number; D_upper: number };
    };
  };
}

interface Props {
  projection: YearEntry[];
}

const BAND_COLORS = {
  A: '#bbf7d0',
  B: '#d9f99d',
  C: '#fef08a',
  D: '#fed7aa',
  E: '#fecaca',
};

export default function CIIProjectionChart({ projection }: Props) {
  if (!projection || projection.length === 0) return null;

  const years = projection.map((p) => p.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Y-axis is AER (lower = better, drawn at top)
  const allValues = projection.flatMap((p) => [
    p.baseline.cii.attained_aer,
    p.scenario.cii.attained_aer,
    p.baseline.cii.band_boundaries.D_upper,
  ]);
  const yMax = Math.max(...allValues) * 1.1;
  const yMin = 0;

  const W = 1000;
  const H = 280;
  const padL = 50, padR = 80, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xScale = (year: number) =>
    padL + ((year - minYear) / Math.max(1, maxYear - minYear)) * chartW;
  const yScale = (v: number) =>
    padT + (1 - (v - yMin) / (yMax - yMin)) * chartH; // inverted so low AER is at top

  // Build polygons (one per band letter) across all years
  const buildBand = (getLow: (y: YearEntry) => number, getHigh: (y: YearEntry) => number) => {
    const pts: string[] = [];
    // top edge left→right using getLow
    projection.forEach((p) => pts.push(`${xScale(p.year)},${yScale(getLow(p))}`));
    // bottom edge right→left using getHigh
    [...projection].reverse().forEach((p) => pts.push(`${xScale(p.year)},${yScale(getHigh(p))}`));
    return pts.join(' ');
  };

  // Band regions (from top/best to bottom/worst in AER terms; in pixel terms top=lower AER):
  // A: 0..A_upper → best → drawn at top
  const bandA = buildBand(() => yMin, (p) => p.baseline.cii.band_boundaries.A_upper);
  const bandB = buildBand(
    (p) => p.baseline.cii.band_boundaries.A_upper,
    (p) => p.baseline.cii.band_boundaries.B_upper,
  );
  const bandC = buildBand(
    (p) => p.baseline.cii.band_boundaries.B_upper,
    (p) => p.baseline.cii.band_boundaries.C_upper,
  );
  const bandD = buildBand(
    (p) => p.baseline.cii.band_boundaries.C_upper,
    (p) => p.baseline.cii.band_boundaries.D_upper,
  );
  const bandE = buildBand((p) => p.baseline.cii.band_boundaries.D_upper, () => yMax);

  const baselinePath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year)},${yScale(p.baseline.cii.attained_aer)}`)
    .join(' ');
  const scenarioPath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year)},${yScale(p.scenario.cii.attained_aer)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <polygon points={bandA} fill={BAND_COLORS.A} />
      <polygon points={bandB} fill={BAND_COLORS.B} />
      <polygon points={bandC} fill={BAND_COLORS.C} />
      <polygon points={bandD} fill={BAND_COLORS.D} />
      <polygon points={bandE} fill={BAND_COLORS.E} />

      {/* Rating letters at the right edge */}
      {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
        const last = projection[projection.length - 1].baseline.cii.band_boundaries;
        const yCenter =
          letter === 'A' ? yScale(last.A_upper / 2)
            : letter === 'B' ? yScale((last.A_upper + last.B_upper) / 2)
              : letter === 'C' ? yScale((last.B_upper + last.C_upper) / 2)
                : letter === 'D' ? yScale((last.C_upper + last.D_upper) / 2)
                  : yScale(Math.min(yMax, last.D_upper + (yMax - last.D_upper) / 2));
        return (
          <text
            key={letter}
            x={W - padR + 8}
            y={yCenter + 4}
            fontSize={14}
            fontWeight={700}
            fill="#374151"
            opacity={0.6}
          >
            {letter}
          </text>
        );
      })}

      {/* Baseline line */}
      <path d={baselinePath} stroke="#111827" strokeWidth={2} fill="none" />
      {projection.map((p) => (
        <circle
          key={`b-${p.year}`}
          cx={xScale(p.year)}
          cy={yScale(p.baseline.cii.attained_aer)}
          r={3.5}
          fill="#111827"
        />
      ))}

      {/* Scenario line (dashed) */}
      <path d={scenarioPath} stroke="#111827" strokeWidth={2} fill="none" strokeDasharray="5,4" />
      {projection.map((p) => (
        <g key={`s-${p.year}`} transform={`translate(${xScale(p.year)}, ${yScale(p.scenario.cii.attained_aer)})`}>
          <line x1={-4} y1={-4} x2={4} y2={4} stroke="#111827" strokeWidth={2} strokeLinecap="round" />
          <line x1={-4} y1={4} x2={4} y2={-4} stroke="#111827" strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}

      {/* X-axis year labels */}
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

      {/* Y-axis AER ticks */}
      {[yMin, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].map((v) => (
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
      <text x={padL - 6} y={padT - 6} textAnchor="end" fontSize={10} fill="#6b7280">AER</text>
    </svg>
  );
}
