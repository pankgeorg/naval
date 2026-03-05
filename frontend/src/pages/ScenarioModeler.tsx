import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { runScenario } from '../api/calculations';
import { getShip } from '../api/ships';
import SpeedSlider from '../components/scenarios/SpeedSlider';
import FuelMixSlider from '../components/scenarios/FuelMixSlider';
import MetricCard from '../components/compliance/MetricCard';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { formatNumber, formatCurrency } from '../utils/formatters';

export default function ScenarioModeler() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['compliance', 'scenario', 'common']);
  const [year, setYear] = useState(2025);
  const [speedChange, setSpeedChange] = useState(0);
  const [euaPrice, setEuaPrice] = useState(75);
  const [fuelMix, setFuelMix] = useState<Record<string, number>>({ vlsfo: 100 });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [shipName, setShipName] = useState('');

  useEffect(() => {
    if (id) getShip(id).then((s) => setShipName(s.name));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const mixNormalized: Record<string, number> = {};
        for (const [k, v] of Object.entries(fuelMix)) {
          if (v > 0) mixNormalized[k] = v / 100;
        }
        const data = await runScenario(id, {
          year,
          speed_change_pct: speedChange,
          fuel_mix: Object.keys(mixNormalized).length > 0 ? mixNormalized : null,
          eua_price: euaPrice,
        });
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [id, year, speedChange, fuelMix, euaPrice]);

  const baseline = result?.baseline as Record<string, Record<string, unknown>> | undefined;
  const scenario = result?.scenario as Record<string, Record<string, unknown>> | undefined;
  const delta = result?.delta as Record<string, unknown> | undefined;

  return (
    <div>
      <Breadcrumbs items={[
        { label: t('common:nav.fleet'), to: '/' },
        { label: shipName || '…', to: `/ships/${id}` },
        { label: t('scenario:title') },
      ]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('scenario:title')}</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('scenario:year')}</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              {Array.from({ length: 26 }, (_, i) => 2025 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
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

        <div className="col-span-2">
          {loading && <div className="text-center py-12 text-gray-400">{t('scenario:computing')}</div>}
          {!loading && baseline && scenario && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-3">{t('scenario:baseline')}</h3>
                  <div className="space-y-3">
                    <MetricCard title={t('compliance:scenario.ciiRating')} value={(baseline.cii?.rating as string) || '—'} tooltip={t('compliance:scenario.ciiRatingTooltip')} />
                    <MetricCard title={t('compliance:scenario.fueleuIntensity')} value={formatNumber((baseline.fueleu?.weighted_intensity as number) || 0)} subtitle="gCO₂eq/MJ" tooltip={t('compliance:scenario.fueleuIntensityTooltip')} />
                    <MetricCard title={t('compliance:scenario.etsCost')} value={formatCurrency((baseline.eu_ets?.cost_eur as number) || 0)} tooltip={t('compliance:scenario.etsCostTooltip')} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-maritime-600 text-sm mb-3">{t('scenario:scenario')}</h3>
                  <div className="space-y-3">
                    <MetricCard title={t('compliance:scenario.ciiRating')} value={(scenario.cii?.rating as string) || '—'} />
                    <MetricCard title={t('compliance:scenario.fueleuIntensity')} value={formatNumber((scenario.fueleu?.weighted_intensity as number) || 0)} subtitle="gCO₂eq/MJ" />
                    <MetricCard title={t('compliance:scenario.etsCost')} value={formatCurrency((scenario.eu_ets?.cost_eur as number) || 0)} />
                  </div>
                </div>
              </div>
              {delta && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2">{t('scenario:delta')}</h3>
                  <p className="text-sm">{t('scenario:ciiRatingChange')}: {delta.cii_rating_change as string}</p>
                  <p className="text-sm">{t('scenario:fueleuBalanceDelta')}: {formatNumber((delta.fueleu_balance_delta_mj as number) || 0)} MJ</p>
                  <p className="text-sm">{t('scenario:etsCostDelta')}: {formatCurrency((delta.eu_ets_cost_delta_eur as number) || 0)}</p>
                </div>
              )}
            </div>
          )}
          {!loading && !result && (
            <div className="text-center py-12 text-gray-400">
              {t('scenario:adjustPrompt')}
              <br />
              {t('scenario:requiresVoyageData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
