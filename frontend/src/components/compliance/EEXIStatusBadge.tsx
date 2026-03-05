import { Check, X } from 'lucide-react';

interface Props {
  compliant: boolean;
}

export default function EEXIStatusBadge({ compliant }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        compliant
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {compliant ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      EEXI {compliant ? 'Compliant' : 'Non-Compliant'}
    </span>
  );
}
