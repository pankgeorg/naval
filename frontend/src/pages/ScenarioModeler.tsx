import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronDown, ChevronRight, Info, Loader2, RotateCcw } from 'lucide-react';
import { runScenario } from '../api/calculations';
import { getShip } from '../api/ships';
import SpeedSlider from '../components/scenarios/SpeedSlider';
import FuelMixSlider from '../components/scenarios/FuelMixSlider';
import ScenarioBandsPanel from '../components/scenarios/ScenarioBandsPanel';
import ScenarioCorrectionsEditor from '../components/scenarios/ScenarioCorrectionsEditor';
import MetricCard from '../components/compliance/MetricCard';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import NumberField from '../components/shared/NumberField';
import type { CIICorrectionInput } from '../types/ciiCorrection';
import { formatNumber, formatCurrency } from '../utils/formatters';

interface ScenarioMeta {
  total_voyages: number;
  total_legs: number;
  eu_covered_legs: number;
  has_fuel_data: boolean;
  using_override: boolean;
  ship: {
    name: string;
    ship_type: string;
    dwt: number;
    gt: number;
    capacity: number;
    capacity_type: string;
  };
  voyage_totals: {
    distance_nm: number;
    fuel_tonnes: number;
  };
}

export default function ScenarioModeler() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['compliance', 'scenario', 'common']);
  const [year, setYear] = useState(2026);
  const [speedChange, setSpeedChange] = useState(0);
  const [euaPrice, setEuaPrice] = useState(75);
  const [fuelMix, setFuelMix] = useState<Record<string, number>>({ vlsfo: 100 });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [shipName, setShipName] = useState('');
  // Annual totals overrides. `null` means use voyage-derived values.
  const [overrideDistance, setOverrideDistance] = useState<number | null>(null);
  const [overrideFuel, setOverrideFuel] = useState<number | null>(null);
  // Scenario-only CII corrections (not persisted).
  const [extraCorrections, setExtraCorrections] = useState<CIICorrectionInput[]>([]);
  const [correctionsOpen, setCorrectionsOpen] = useState(false);

  // Drag-sampling state: during rapid slider drags we run a sparse projection
  // (2 years) for responsiveness; a short while after the user stops, we fire
  // a follow-up with the full 6-year projection.
  const lastChangeRef = useRef<number>(0);
  const [settleTick, setSettleTick] = useState(0);

  useEffect(() => {
    if (id) getShip(id).then((s) => setShipName(s.name));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const now = Date.now();
    const msSinceLastChange = now - lastChangeRef.current;
    lastChangeRef.current = now;
    // "Dragging" = another change came in within the last 500 ms
    const dragging = msSinceLastChange < 500;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const mixNormalized: Record<string, number> = {};
        for (const [k, v] of Object.entries(fuelMix)) {
          if (v > 0) mixNormalized[k] = v / 100;
        }
        const fullYears = [year, 2030, 2035, 2040, 2045, 2050]
          .filter((y, i, arr) => arr.indexOf(y) === i && y >= year)
          .sort((a, b) => a - b);
        const projectionYears = dragging
          ? [fullYears[0], fullYears[fullYears.length - 1]]
          : fullYears;
        const data = await runScenario(id, {
          year,
          speed_change_pct: speedChange,
          fuel_mix: Object.keys(mixNormalized).length > 0 ? mixNormalized : null,
          eua_price: euaPrice,
          projection_years: projectionYears,
          override_distance_nm: overrideDistance,
          override_fuel_tonnes: overrideFuel,
          extra_corrections: extraCorrections.length > 0
            ? extraCorrections.map((c) => ({
                correction_type: c.correction_type,
                co2_offset_tonnes: c.co2_offset_tonnes,
              }))
            : null,
        });
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    // Settle timer: when no change for 700ms AND the last fetch was sparse,
    // re-fetch with the full projection.
    const settleTimer = dragging
      ? setTimeout(() => setSettleTick((n) => n + 1), 700)
      : null;

    return () => {
      clearTimeout(timer);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [id, year, speedChange, fuelMix, euaPrice, overrideDistance, overrideFuel, extraCorrections, settleTick]);

  const baseline = result?.baseline as Record<string, Record<string, unknown>> | undefined;
  const scenario = result?.scenario as Record<string, Record<string, unknown>> | undefined;
  const delta = result?.delta as Record<string, unknown> | undefined;
  const meta = result?.meta as ScenarioMeta | undefined;

  const hasEuCoverage = meta ? meta.eu_covered_legs > 0 : true;
  const hasVoyages = meta ? meta.total_voyages > 0 : true;
  const hasFuel = meta ? meta.has_fuel_data : true;
  // With an override the calc uses a synthetic intra-EU leg, so FuelEU / ETS
  // are meaningful even when the real voyage data has no EU coverage or fuel.
  const hasMeaningfulEu = (hasEuCoverage && hasFuel) || !!meta?.using_override;

  const fueleuValue = (data: Record<string, Record<string, unknown>> | undefined) =>
    hasMeaningfulEu
      ? formatNumber((data?.fueleu?.weighted_intensity as number) || 0, 3)
      : '—';

  const etsValue = (data: Record<string, Record<string, unknown>> | undefined) =>
    hasMeaningfulEu
      ? formatCurrency((data?.eu_ets?.cost_eur as number) || 0)
      : '—';

  // Percentage change helpers
  const ciiOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  const pctChange = (base: number, val: number) =>
    base !== 0 ? ((val - base) / Math.abs(base)) * 100 : 0;

  const trendFor = (pct: number, lowerIsBetter: boolean): 'up' | 'down' | 'neutral' => {
    if (Math.abs(pct) < 0.01) return 'neutral';
    const improved = lowerIsBetter ? pct < 0 : pct > 0;
    return improved ? 'down' : 'up';
  };

  const colorFor = (trend: 'up' | 'down' | 'neutral'): 'green' | 'red' | undefined =>
    trend === 'down' ? 'green' : trend === 'up' ? 'red' : undefined;

  const baseCii = (baseline?.cii?.rating as string) || '';
  const scenCii = (scenario?.cii?.rating as string) || '';
  const ciiDiff = ciiOrder[baseCii] !== undefined && ciiOrder[scenCii] !== undefined
    ? ciiOrder[baseCii] - ciiOrder[scenCii] : 0;
  const ciiGradeTrend: 'up' | 'down' | 'neutral' = ciiDiff > 0 ? 'down' : ciiDiff < 0 ? 'up' : 'neutral';

  const baseAer = (baseline?.cii?.attained_aer as number) || 0;
  const scenAer = (scenario?.cii?.attained_aer as number) || 0;
  const aerPct = pctChange(baseAer, scenAer);
  const aerTrend = trendFor(aerPct, true);
  const ciiTrend = ciiDiff !== 0 ? ciiGradeTrend : aerTrend;
  const ciiTrendValue = ciiDiff !== 0
    ? `${Math.abs(ciiDiff)} grade${Math.abs(ciiDiff) > 1 ? 's' : ''}`
    : Math.abs(aerPct) >= 0.05 ? `${Math.abs(aerPct).toFixed(1)}%` : undefined;

  const baseFueleu = (baseline?.fueleu?.weighted_intensity as number) || 0;
  const scenFueleu = (scenario?.fueleu?.weighted_intensity as number) || 0;
  const fueleuPct = pctChange(baseFueleu, scenFueleu);
  const fueleuIntensityTrend = trendFor(fueleuPct, true);

  // Compliance balance scales with fuel amount; positive = surplus, lower |deficit| is better.
  const baseFueleuBalance = (baseline?.fueleu?.compliance_balance_mj as number) || 0;
  const scenFueleuBalance = (scenario?.fueleu?.compliance_balance_mj as number) || 0;
  const fueleuBalancePct = pctChange(baseFueleuBalance, scenFueleuBalance);
  // "better" means: balance getting more positive, or less negative (closer to 0)
  const fueleuBalanceImproved = scenFueleuBalance > baseFueleuBalance
    ? (baseFueleuBalance < 0 || scenFueleuBalance > baseFueleuBalance) // more positive → better
    : false;
  const fueleuBalanceTrend: 'up' | 'down' | 'neutral' =
    Math.abs(scenFueleuBalance - baseFueleuBalance) < 0.01 ? 'neutral'
      : fueleuBalanceImproved ? 'down' : 'up';
  // Prefer intensity delta when it exists (fuel mix changed); otherwise fall back to balance
  const fueleuTrend = Math.abs(fueleuPct) >= 0.01 ? fueleuIntensityTrend : fueleuBalanceTrend;
  const fueleuTrendValue = Math.abs(fueleuPct) >= 0.05
    ? `${Math.abs(fueleuPct).toFixed(1)}%`
    : Math.abs(fueleuBalancePct) >= 0.05
      ? `balance ${fueleuBalancePct > 0 ? '+' : ''}${fueleuBalancePct.toFixed(1)}%`
      : undefined;

  const formatBalance = (mj: number) => {
    const sign = mj >= 0 ? '+' : '−';
    const abs = Math.abs(mj);
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(3)} TJ balance`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(2)} GJ balance`;
    return `${sign}${abs.toFixed(0)} MJ balance`;
  };

  const baseEts = (baseline?.eu_ets?.cost_eur as number) || 0;
  const scenEts = (scenario?.eu_ets?.cost_eur as number) || 0;
  const etsPct = pctChange(baseEts, scenEts);
  const etsTrend = trendFor(etsPct, true);

  return (
    <div>
      <Breadcrumbs items={[
        { label: t('common:nav.fleet'), to: '/' },
        { label: shipName || '…', to: `/ships/${id}` },
        { label: t('scenario:title') },
      ]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('scenario:title')}</h2>

      {/* Ship data strip */}
      {meta?.ship && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-gray-900">{meta.ship.name}</span>
          <span className="text-gray-500">
            <span className="text-gray-400">Type:</span> {meta.ship.ship_type.replace(/_/g, ' ')}
          </span>
          <span className="text-gray-500">
            <span className="text-gray-400">DWT:</span> {formatNumber(meta.ship.dwt, 0)} t
          </span>
          <span className="text-gray-500">
            <span className="text-gray-400">GT:</span> {formatNumber(meta.ship.gt, 0)}
          </span>
          <span className="text-gray-500">
            <span className="text-gray-400">CII capacity basis:</span>{' '}
            {formatNumber(meta.ship.capacity, 0)} {meta.ship.capacity_type.toUpperCase()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('scenario:year')}</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              {Array.from({ length: 26 }, (_, i) => 2025 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Annual totals — editable, pre-filled from voyages */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Annual totals</h4>
              {(overrideDistance !== null || overrideFuel !== null) && (
                <button
                  type="button"
                  onClick={() => { setOverrideDistance(null); setOverrideFuel(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  title="Reset to voyage-derived values"
                >
                  <RotateCcw className="w-3 h-3" /> reset
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Distance (nm)</label>
              <NumberField
                value={overrideDistance}
                onChange={setOverrideDistance}
                fallback={meta?.voyage_totals?.distance_nm ?? 0}
                step="1"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                {overrideDistance !== null ? 'override' : `from voyages: ${formatNumber(meta?.voyage_totals?.distance_nm || 0, 0)}`}
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fuel (t)</label>
              <NumberField
                value={overrideFuel}
                onChange={setOverrideFuel}
                fallback={meta?.voyage_totals?.fuel_tonnes ?? 0}
                step="0.1"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                {overrideFuel !== null ? 'override' : `from voyages: ${formatNumber(meta?.voyage_totals?.fuel_tonnes || 0, 1)}`}
              </p>
            </div>
            {meta?.using_override && (
              <p className="text-xs text-amber-600 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Using a synthetic intra-EU leg — coverage is 100%.
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SpeedSlider value={speedChange} onChange={setSpeedChange} />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('scenario:euaPrice')}</label>
            <input type="range" min={40} max={200} value={euaPrice} onChange={(e) => setEuaPrice(Number(e.target.value))} className="w-full" />
            <div className="text-center text-sm font-medium">{formatCurrency(euaPrice)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <FuelMixSlider
              fuelMix={fuelMix}
              onChange={setFuelMix}
              availableFuels={[
                { code: 'vlsfo', name: 'VLSFO' },
                { code: 'mgo', name: 'MGO' },
                { code: 'lng_lpdf', name: 'LNG (LPDF)' },
                { code: 'bio_methanol', name: 'Bio-Methanol' },
                { code: 'e_methanol', name: 'E-Methanol' },
                { code: 'green_nh3', name: 'Green NH₃' },
              ]}
            />
          </div>
        </div>

        <div className="lg:col-span-2 relative">
          {loading && baseline && scenario && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-xs text-gray-500 bg-white/80 rounded-full px-2 py-1 border border-gray-200">
              <Loader2 className="w-3 h-3 animate-spin" /> updating
            </div>
          )}
          {!baseline && !scenario && loading && (
            <div className="text-center py-12 text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('scenario:computing')}
            </div>
          )}
          {baseline && scenario && (
            <div
              className={`space-y-6 transition-[filter,opacity] duration-200 ${
                loading ? 'opacity-60 blur-[1.5px] pointer-events-none' : ''
              }`}
            >
              {/* Warnings */}
              {!hasVoyages && !meta?.using_override && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700">{t('scenario:noVoyages')}</p>
                </div>
              )}
              {hasVoyages && !hasFuel && !meta?.using_override && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700">{t('scenario:noFuelData')}</p>
                </div>
              )}
              {hasVoyages && hasFuel && !hasEuCoverage && !meta?.using_override && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-700">{t('scenario:noEuCoverage')}</p>
                </div>
              )}

              {(baseAer > 0 || scenAer > 0) && (
                <ScenarioBandsPanel
                  year={year}
                  baselineCii={baseline.cii as unknown as {
                    attained_aer: number; rating: string; required_cii: number;
                    band_boundaries: { A_upper: number; B_upper: number; C_upper: number; D_upper: number };
                  }}
                  scenarioCii={scenario.cii as unknown as {
                    attained_aer: number; rating: string; required_cii: number;
                    band_boundaries: { A_upper: number; B_upper: number; C_upper: number; D_upper: number };
                  }}
                  baselineFueleu={baseline.fueleu as unknown as {
                    weighted_intensity: number; target_intensity: number;
                    compliance_balance_mj: number; compliant: boolean; total_covered_energy_mj: number;
                  }}
                  scenarioFueleu={scenario.fueleu as unknown as {
                    weighted_intensity: number; target_intensity: number;
                    compliance_balance_mj: number; compliant: boolean; total_covered_energy_mj: number;
                  }}
                  projection={(result?.projection as Parameters<typeof ScenarioBandsPanel>[0]['projection']) || null}
                />
              )}

              {/* Scenario-only CII corrections — collapsible, local-only */}
              <div className="bg-white rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setCorrectionsOpen((o) => !o)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {correctionsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {t('compliance:corrections.title')}
                  {extraCorrections.length > 0 && (
                    <span className="text-xs bg-maritime-100 text-maritime-700 rounded-full px-2 py-0.5">
                      {extraCorrections.length}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-2">scenario-only</span>
                </button>
                {correctionsOpen && (
                  <div className="px-4 pb-4">
                    <ScenarioCorrectionsEditor
                      corrections={extraCorrections}
                      onChange={setExtraCorrections}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-3">{t('scenario:baseline')}</h3>
                  <div className="space-y-3">
                    <MetricCard
                      title={t('compliance:scenario.ciiRating')}
                      value={(baseline.cii?.rating as string) || '—'}
                      subtitle={baseAer > 0 ? `${formatNumber(baseAer, 3)} gCO₂/t·nm` : undefined}
                      tooltip={t('compliance:scenario.ciiRatingTooltip')}
                    />
                    <MetricCard
                      title={t('compliance:scenario.fueleuIntensity')}
                      value={fueleuValue(baseline)}
                      subtitle={hasMeaningfulEu ? `gCO₂eq/MJ · ${formatBalance(baseFueleuBalance)}` : undefined}
                      tooltip={t('compliance:scenario.fueleuIntensityTooltip')}
                    />
                    <MetricCard title={t('compliance:scenario.etsCost')} value={etsValue(baseline)} tooltip={t('compliance:scenario.etsCostTooltip')} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-maritime-600 text-sm mb-3">{t('scenario:scenario')}</h3>
                  <div className="space-y-3">
                    <MetricCard
                      title={t('compliance:scenario.ciiRating')}
                      value={(scenario.cii?.rating as string) || '—'}
                      subtitle={scenAer > 0 ? `${formatNumber(scenAer, 3)} gCO₂/t·nm` : undefined}
                      valueColor={colorFor(ciiTrend)}
                      trend={ciiTrendValue ? ciiTrend : undefined}
                      trendValue={ciiTrendValue}
                    />
                    <MetricCard
                      title={t('compliance:scenario.fueleuIntensity')}
                      value={fueleuValue(scenario)}
                      subtitle={hasMeaningfulEu ? `gCO₂eq/MJ · ${formatBalance(scenFueleuBalance)}` : undefined}
                      valueColor={hasMeaningfulEu ? colorFor(fueleuTrend) : undefined}
                      trend={hasMeaningfulEu && fueleuTrendValue ? fueleuTrend : undefined}
                      trendValue={hasMeaningfulEu ? fueleuTrendValue : undefined}
                    />
                    <MetricCard
                      title={t('compliance:scenario.etsCost')}
                      value={etsValue(scenario)}
                      valueColor={hasMeaningfulEu ? colorFor(etsTrend) : undefined}
                      trend={hasMeaningfulEu && Math.abs(etsPct) >= 0.01 ? etsTrend : undefined}
                      trendValue={hasMeaningfulEu && Math.abs(etsPct) >= 0.05 ? `${Math.abs(etsPct).toFixed(1)}%` : undefined}
                    />
                  </div>
                </div>
              </div>
              {delta && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2">{t('scenario:delta')}</h3>
                  <p className="text-sm">{t('scenario:ciiRatingChange')}: {delta.cii_rating_change as string}</p>
                  <p className="text-sm">{t('scenario:fueleuBalanceDelta')}: {hasMeaningfulEu ? `${formatNumber((delta.fueleu_balance_delta_mj as number) || 0, 3)} MJ` : '—'}</p>
                  <p className="text-sm">{t('scenario:etsCostDelta')}: {hasMeaningfulEu ? formatCurrency((delta.eu_ets_cost_delta_eur as number) || 0) : '—'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
