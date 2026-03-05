import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAnnualReport } from '../api/calculations';
import { getShip } from '../api/ships';
import MetricCard from '../components/compliance/MetricCard';
import CIIRatingBadge from '../components/compliance/CIIRatingBadge';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { formatNumber, formatCurrency } from '../utils/formatters';

export default function AnnualReport() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const year = parseInt(searchParams.get('year') || '2025');
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [shipName, setShipName] = useState('');
  const { t } = useTranslation(['compliance', 'report', 'common']);

  useEffect(() => {
    if (id) {
      getAnnualReport(id, year).then(setReport).catch(() => {});
      getShip(id).then((s) => setShipName(s.name));
    }
  }, [id, year]);

  if (!report) return <div className="text-center py-12 text-gray-400">{t('report:loadingReport')}</div>;

  const cii = report.cii as Record<string, unknown>;
  const fueleu = report.fueleu as Record<string, unknown>;
  const euets = report.eu_ets as Record<string, unknown>;
  const eedi = report.eedi as Record<string, unknown>;

  return (
    <div className="max-w-4xl mx-auto print:max-w-none">
      <Breadcrumbs items={[
        { label: t('common:nav.fleet'), to: '/' },
        { label: shipName || '…', to: `/ships/${id}` },
        { label: t('report:reportBreadcrumb', { year }) },
      ]} />
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <h2 className="text-2xl font-bold">{t('report:reportWithYear', { year })}</h2>
        <button onClick={() => window.print()} className="bg-maritime-600 text-white px-4 py-2 rounded-lg print:hidden">
          {t('common:actions.print')}
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">{t('compliance:report.eediSection')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title={t('compliance:eedi.attained')} value={formatNumber(eedi?.attained as number || 0)} subtitle="gCO₂/t·nm" tooltip={t('compliance:eedi.attainedTooltip')} />
            <MetricCard title={t('compliance:eedi.required')} value={formatNumber(eedi?.required as number || 0)} subtitle="gCO₂/t·nm" tooltip={t('compliance:eedi.requiredTooltip')} />
            <MetricCard title={t('compliance:eedi.compliant')} value={(eedi?.compliant as boolean) ? t('common:yes') : t('common:no')} tooltip={t('compliance:eedi.compliantTooltip')} />
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">{t('compliance:report.ciiSection')}</h3>
          <div className="flex items-center gap-4 mb-4">
            <CIIRatingBadge rating={cii?.rating as string || '—'} size="lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title={t('compliance:cii.attainedAer')} value={formatNumber(cii?.attained_aer as number || 0)} tooltip={t('compliance:cii.attainedAerTooltip')} />
            <MetricCard title={t('compliance:cii.requiredCii')} value={formatNumber(cii?.required_cii as number || 0)} tooltip={t('compliance:cii.requiredCiiTooltip')} />
            <MetricCard title={t('compliance:report.co2Emissions')} value={`${formatNumber(cii?.total_co2_tonnes as number || 0)} t`} tooltip={t('compliance:cii.totalCo2Tooltip')} />
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">{t('compliance:report.fueleuSection')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title={t('compliance:fueleu.ghgIntensity')} value={formatNumber(fueleu?.weighted_intensity as number || 0)} subtitle="gCO₂eq/MJ" tooltip={t('compliance:fueleu.ghgIntensityTooltip')} />
            <MetricCard title={t('compliance:fueleu.target')} value={formatNumber(fueleu?.target_intensity as number || 0)} subtitle="gCO₂eq/MJ" tooltip={t('compliance:fueleu.targetTooltip')} />
            <MetricCard title={t('compliance:fueleu.penalty')} value={formatCurrency(fueleu?.penalty_estimate_eur as number || 0)} tooltip={t('compliance:fueleu.penaltyTooltip')} />
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">{t('compliance:report.euetsSection')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title={t('compliance:euets.euasRequired')} value={formatNumber(euets?.euas_required as number || 0)} tooltip={t('compliance:euets.euasRequiredTooltip')} />
            <MetricCard title={t('compliance:euets.totalCost')} value={formatCurrency(euets?.cost_eur as number || 0)} tooltip={t('compliance:euets.totalCostTooltip')} />
            <MetricCard title={t('compliance:euets.phaseIn')} value={`${((euets?.phase_in_pct as number || 0) * 100).toFixed(0)}%`} tooltip={t('compliance:euets.phaseInTooltip')} />
          </div>
        </section>
      </div>
    </div>
  );
}
