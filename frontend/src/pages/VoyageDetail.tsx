import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getVoyage } from '../api/voyages';
import { getShip } from '../api/ships';
import type { Voyage } from '../types/voyage';
import MetricCard from '../components/compliance/MetricCard';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { formatNumber } from '../utils/formatters';

export default function VoyageDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['voyage', 'common']);
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [shipName, setShipName] = useState('');

  useEffect(() => {
    if (id) getVoyage(id).then((v) => {
      setVoyage(v);
      getShip(v.ship_id).then((s) => setShipName(s.name));
    });
  }, [id]);

  if (!voyage) return <div className="text-center py-12 text-gray-400">{t('common:status.loading')}</div>;

  return (
    <div>
      <Breadcrumbs items={[
        { label: t('common:nav.fleet'), to: '/' },
        { label: shipName || '…', to: `/ships/${voyage.ship_id}` },
        { label: t('voyage:detailTitle', { number: voyage.voyage_number || voyage.id.slice(0, 8) }) },
      ]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {t('voyage:detailTitle', { number: voyage.voyage_number || voyage.id.slice(0, 8) })}
      </h2>
      <p className="text-gray-500 mb-6">{t('voyage:status')}: {voyage.status}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title={t('voyage:totalDistance')} value={`${formatNumber(voyage.total_distance_nm || 0, 0)} nm`} />
        <MetricCard title={t('voyage:portCalls')} value={voyage.port_calls.length} />
        <MetricCard title={t('voyage:legs')} value={voyage.legs.length} />
        <MetricCard title={t('voyage:status')} value={voyage.status} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">{t('voyage:legs')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">{t('voyage:table.leg')}</th>
              <th className="text-left py-2 px-3">{t('voyage:table.type')}</th>
              <th className="text-right py-2 px-3">{t('voyage:table.distance')}</th>
              <th className="text-right py-2 px-3">{t('voyage:table.etsCoverage')}</th>
              <th className="text-right py-2 px-3">{t('voyage:table.fueleuCoverage')}</th>
            </tr>
          </thead>
          <tbody>
            {voyage.legs.map((leg, i) => (
              <tr key={leg.id} className="border-b border-gray-50">
                <td className="py-2 px-3">{i + 1}</td>
                <td className="py-2 px-3">{leg.leg_type}</td>
                <td className="py-2 px-3 text-right">{formatNumber(leg.distance_nm || 0, 1)}</td>
                <td className="py-2 px-3 text-right">{((leg.eu_ets_coverage || 0) * 100).toFixed(0)}%</td>
                <td className="py-2 px-3 text-right">{((leg.fueleu_coverage || 0) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
