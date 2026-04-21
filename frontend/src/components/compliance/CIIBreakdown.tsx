import { useTranslation } from 'react-i18next';
import type { CIIResult } from '../../types/calculations';
import { formatNumber } from '../../utils/formatters';

interface Props {
  cii: CIIResult;
}

export default function CIIBreakdown({ cii }: Props) {
  const { t } = useTranslation('compliance');
  const hasCorrections = cii.corrections && cii.corrections.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold mb-4">{t('corrections.breakdownTitle')}</h3>

      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b">
            <td className="py-2 pr-3 text-gray-600">{t('corrections.breakdownUncorrected')}</td>
            <td className="py-2 text-right">{formatNumber(cii.uncorrected_co2_tonnes)} t</td>
          </tr>
          {hasCorrections ? (
            cii.corrections.map((c, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-2 pr-3 text-gray-500 pl-4">↳ {c.label}</td>
                <td className="py-2 text-right text-maritime-700">
                  −{formatNumber(c.co2_offset_tonnes)} t
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-gray-50">
              <td colSpan={2} className="py-2 text-gray-400 italic pl-4 text-xs">
                {t('corrections.breakdownNoCorrections')}
              </td>
            </tr>
          )}
          <tr className="border-b font-semibold">
            <td className="py-2 pr-3">{t('corrections.breakdownCorrected')}</td>
            <td className="py-2 text-right">{formatNumber(cii.total_co2_tonnes)} t</td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 pr-3 text-gray-600">{t('corrections.breakdownAttainedBefore')}</td>
            <td className="py-2 text-right">{formatNumber(cii.uncorrected_attained_aer)}</td>
          </tr>
          <tr className="font-semibold">
            <td className="py-2 pr-3">{t('corrections.breakdownAttainedAfter')}</td>
            <td className="py-2 text-right">{formatNumber(cii.attained_aer)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
