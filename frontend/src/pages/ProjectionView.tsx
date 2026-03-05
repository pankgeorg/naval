import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProjection } from '../api/calculations';
import { getShip } from '../api/ships';
import ProjectionChart from '../components/scenarios/ProjectionChart';
import Breadcrumbs from '../components/shared/Breadcrumbs';

export default function ProjectionView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['compliance', 'common']);
  const [data, setData] = useState<unknown[]>([]);
  const [assumptions, setAssumptions] = useState('constant');
  const [loading, setLoading] = useState(true);
  const [shipName, setShipName] = useState('');

  useEffect(() => {
    if (id) getShip(id).then((s) => setShipName(s.name));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getProjection(id, '2025,2026,2027,2028,2029,2030,2035,2040,2045,2050', assumptions)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, assumptions]);

  return (
    <div>
      <Breadcrumbs items={[
        { label: t('common:nav.fleet'), to: '/' },
        { label: shipName || '…', to: `/ships/${id}` },
        { label: t('compliance:projection.title') },
      ]} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('compliance:projection.title')}</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">{t('compliance:projection.assumptions')}:</label>
          <select
            value={assumptions}
            onChange={(e) => setAssumptions(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="constant">{t('compliance:projection.constantOps')}</option>
            <option value="improving_2pct_year">{t('compliance:projection.improving2pct')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('compliance:projection.loadingProjection')}</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ProjectionChart data={data as Parameters<typeof ProjectionChart>[0]['data']} />
        </div>
      )}
    </div>
  );
}
