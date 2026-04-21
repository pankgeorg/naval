import { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit, BarChart3, FileText, TrendingUp } from 'lucide-react';
import { getShip } from '../api/ships';
import { getVoyages } from '../api/voyages';
import { getEEDI, getCII, getFuelEU, getEUETS } from '../api/calculations';
import type { Ship } from '../types/ship';
import type { Voyage } from '../types/voyage';
import CIIRatingBadge from '../components/compliance/CIIRatingBadge';
import CIIBreakdown from '../components/compliance/CIIBreakdown';
import MetricCard from '../components/compliance/MetricCard';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import type { CIIResult } from '../types/calculations';
import { formatNumber, formatCurrency, shipTypeLabel } from '../utils/formatters';

const VALID_TABS = ['overview', 'eedi', 'cii', 'fueleu', 'euets', 'voyages'];
const currentYear = new Date().getFullYear();

export default function ShipDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['compliance', 'ship', 'voyage', 'common']);

  const hashTab = location.hash.replace('#', '');
  const initialTab = VALID_TABS.includes(hashTab) ? hashTab : 'overview';

  const [ship, setShip] = useState<Ship | null>(null);
  const [tab, setTab] = useState(initialTab);
  const [eedi, setEedi] = useState<Record<string, unknown> | null>(null);
  const [cii, setCii] = useState<Record<string, unknown> | null>(null);
  const [fueleu, setFueleu] = useState<Record<string, unknown> | null>(null);
  const [euets, setEuets] = useState<Record<string, unknown> | null>(null);
  const [voyages, setVoyages] = useState<Voyage[]>([]);

  const switchTab = (key: string) => {
    setTab(key);
    navigate(`#${key}`, { replace: true });
  };

  useEffect(() => {
    if (!id) return;
    getShip(id).then(setShip);
    getVoyages(id).then(setVoyages).catch(() => {});
    getEEDI(id).then(setEedi).catch(() => {});
    getCII(id, currentYear).then(setCii).catch(() => {});
    getFuelEU(id, currentYear).then(setFueleu).catch(() => {});
    getEUETS(id, currentYear).then(setEuets).catch(() => {});
  }, [id]);

  if (!ship) return <div className="text-center py-12 text-gray-400">{t('common:status.loading')}</div>;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'eedi', label: t('compliance:eedi.title') },
    { key: 'cii', label: t('compliance:cii.title') },
    { key: 'fueleu', label: t('compliance:fueleu.title') },
    { key: 'euets', label: t('compliance:euets.title') },
    { key: 'voyages', label: t('voyage:table.voyage', { defaultValue: 'Voyages' }) },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: t('common:nav.fleet'), to: '/' }, { label: ship.name }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{ship.name}</h2>
          <p className="text-gray-500">IMO {ship.imo_number} &middot; {shipTypeLabel(ship.ship_type)} &middot; {ship.flag_state}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/ships/${id}/edit`} className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm">
            <Edit className="w-4 h-4" /> {t('common:actions.edit')}
          </Link>
          <Link to={`/ships/${id}/voyages/new`} className="bg-maritime-600 text-white px-3 py-2 rounded-lg hover:bg-maritime-700 text-sm">
            {t('common:actions.newVoyage')}
          </Link>
          <Link to={`/ships/${id}/scenario`} className="border border-maritime-300 text-maritime-700 px-3 py-2 rounded-lg hover:bg-maritime-50 flex items-center gap-1 text-sm">
            <BarChart3 className="w-4 h-4" /> {t('compliance:scenario.title')}
          </Link>
          <Link to={`/ships/${id}/projection`} className="border border-maritime-300 text-maritime-700 px-3 py-2 rounded-lg hover:bg-maritime-50 flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4" /> {t('compliance:projection.title')}
          </Link>
          <Link to={`/ships/${id}/report?year=${currentYear}`} className="border border-maritime-300 text-maritime-700 px-3 py-2 rounded-lg hover:bg-maritime-50 flex items-center gap-1 text-sm">
            <FileText className="w-4 h-4" /> {t('compliance:report.title', { defaultValue: 'Report' })}
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => switchTab(tb.key)}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                tab === tb.key
                  ? 'border-maritime-600 text-maritime-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title={t('ship:fields.dwt')} value={formatNumber(ship.dwt, 0)} />
          <MetricCard title={t('ship:fields.grossTonnage')} value={formatNumber(ship.gt, 0)} />
          <MetricCard title={t('ship:fields.referenceSpeed')} value={`${ship.reference_speed_kn} kn`} />
          <MetricCard title={t('ship:fields.designDraught')} value={`${ship.design_draught_m} m`} />
          <MetricCard title={t('ship:fields.buildDate')} value={ship.build_date} />
          <MetricCard title={t('ship:engines')} value={ship.engines.length} />
          {cii && <MetricCard title={t('compliance:cii.ratingWithYear', { year: currentYear })} value={(cii as Record<string, string>).rating} tooltip={t('compliance:cii.ratingTooltip')} />}
          {euets && <MetricCard title={t('compliance:euets.totalCost')} value={formatCurrency((euets as Record<string, number>).cost_eur)} tooltip={t('compliance:euets.totalCostTooltip')} />}
        </div>
      )}

      {tab === 'eedi' && eedi && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title={t('compliance:eedi.attained')} value={formatNumber((eedi as Record<string, number>).attained)} subtitle="gCO₂/t·nm" tooltip={t('compliance:eedi.attainedTooltip')} />
          <MetricCard title={t('compliance:eedi.required')} value={formatNumber((eedi as Record<string, number>).required)} subtitle="gCO₂/t·nm" tooltip={t('compliance:eedi.requiredTooltip')} />
          <MetricCard title={t('compliance:eedi.referenceLine')} value={formatNumber((eedi as Record<string, number>).reference_line)} tooltip={t('compliance:eedi.referenceLineTooltip')} />
          <MetricCard title={t('compliance:eedi.phase')} value={(eedi as Record<string, number>).phase} tooltip={t('compliance:eedi.phaseTooltip')} />
          <MetricCard title={t('compliance:eedi.compliant')} value={(eedi as Record<string, boolean>).compliant ? t('common:yes') : t('common:no')} tooltip={t('compliance:eedi.compliantTooltip')} />
          <MetricCard title={t('compliance:eedi.gap')} value={`${formatNumber((eedi as Record<string, number>).gap_pct)}%`} tooltip={t('compliance:eedi.gapTooltip')} />
        </div>
      )}

      {tab === 'cii' && cii && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <CIIRatingBadge rating={(cii as Record<string, string>).rating} size="lg" />
            <div>
              <p className="font-semibold">{t('compliance:cii.rating')}: {(cii as Record<string, string>).rating}</p>
              <p className="text-sm text-gray-500">{t('compliance:scenario.year', { defaultValue: 'Year' })}: {(cii as Record<string, number>).year}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title={t('compliance:cii.attainedAer')} value={formatNumber((cii as Record<string, number>).attained_aer)} subtitle="gCO₂/t·nm" tooltip={t('compliance:cii.attainedAerTooltip')} />
            <MetricCard title={t('compliance:cii.requiredCii')} value={formatNumber((cii as Record<string, number>).required_cii)} subtitle="gCO₂/t·nm" tooltip={t('compliance:cii.requiredCiiTooltip')} />
            <MetricCard title={t('compliance:cii.totalCo2')} value={`${formatNumber((cii as Record<string, number>).total_co2_tonnes)} t`} tooltip={t('compliance:cii.totalCo2Tooltip')} />
            <MetricCard title={t('compliance:cii.totalDistance')} value={`${formatNumber((cii as Record<string, number>).total_distance_nm, 0)} nm`} tooltip={t('compliance:cii.totalDistanceTooltip')} />
          </div>
          <CIIBreakdown cii={cii as unknown as CIIResult} />
        </div>
      )}

      {tab === 'fueleu' && fueleu && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title={t('compliance:fueleu.ghgIntensity')} value={formatNumber((fueleu as Record<string, number>).weighted_intensity)} subtitle="gCO₂eq/MJ" tooltip={t('compliance:fueleu.ghgIntensityTooltip')} />
          <MetricCard title={t('compliance:fueleu.target')} value={formatNumber((fueleu as Record<string, number>).target_intensity)} subtitle="gCO₂eq/MJ" tooltip={t('compliance:fueleu.targetTooltip')} />
          <MetricCard title={t('compliance:fueleu.complianceBalance')} value={`${formatNumber((fueleu as Record<string, number>).compliance_balance_mj)} MJ`} tooltip={t('compliance:fueleu.complianceBalanceTooltip')} />
          <MetricCard title={t('compliance:fueleu.compliant')} value={(fueleu as Record<string, boolean>).compliant ? t('common:yes') : t('common:no')} tooltip={t('compliance:fueleu.compliantTooltip')} />
          <MetricCard title={t('compliance:fueleu.penalty')} value={formatCurrency((fueleu as Record<string, number>).penalty_estimate_eur)} tooltip={t('compliance:fueleu.penaltyTooltip')} />
        </div>
      )}

      {tab === 'euets' && euets && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title={t('compliance:euets.coveredCo2')} value={`${formatNumber((euets as Record<string, number>).total_covered_co2_t)} t`} tooltip={t('compliance:euets.coveredCo2Tooltip')} />
          <MetricCard title={t('compliance:euets.euasRequired')} value={formatNumber((euets as Record<string, number>).euas_required)} tooltip={t('compliance:euets.euasRequiredTooltip')} />
          <MetricCard title={t('compliance:euets.euaPrice')} value={formatCurrency((euets as Record<string, number>).eua_price_eur)} tooltip={t('compliance:euets.euaPriceTooltip')} />
          <MetricCard title={t('compliance:euets.totalCost')} value={formatCurrency((euets as Record<string, number>).cost_eur)} tooltip={t('compliance:euets.totalCostTooltip')} />
          <MetricCard title={t('compliance:euets.phaseIn')} value={`${((euets as Record<string, number>).phase_in_pct * 100).toFixed(0)}%`} tooltip={t('compliance:euets.phaseInTooltip')} />
          <MetricCard title={t('compliance:euets.ghgScope')} value={(euets as Record<string, string>).ghg_scope} tooltip={t('compliance:euets.ghgScopeTooltip')} />
        </div>
      )}

      {tab === 'voyages' && (
        <div>
          {voyages.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">{t('voyage:table.voyage')}</th>
                    <th className="text-left py-3 px-4">{t('voyage:table.status')}</th>
                    <th className="text-right py-3 px-4">{t('voyage:table.portCalls')}</th>
                    <th className="text-right py-3 px-4">{t('voyage:table.legs')}</th>
                    <th className="text-right py-3 px-4">{t('voyage:table.distance')}</th>
                    <th className="text-left py-3 px-4">{t('voyage:table.created')}</th>
                  </tr>
                </thead>
                <tbody>
                  {voyages.map((v) => (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link to={`/voyages/${v.id}`} className="text-maritime-600 hover:underline font-medium">
                          {v.voyage_number || v.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.status === 'completed' ? 'bg-green-100 text-green-700' :
                          v.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{v.port_calls.length}</td>
                      <td className="py-3 px-4 text-right">{v.legs.length}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(v.total_distance_nm || 0, 0)}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(v.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              {t('voyage:empty')}
              <br />
              <Link to={`/ships/${id}/voyages/new`} className="text-maritime-600 hover:underline">{t('voyage:createLink')}</Link>
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Link to={`/ships/${id}/voyages/new`} className="bg-maritime-600 text-white px-4 py-2 rounded-lg hover:bg-maritime-700 text-sm">
              {t('common:actions.newVoyage')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
