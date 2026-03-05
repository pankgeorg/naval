import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface Props {
  content: string;
}

export default function InfoTooltip({ content }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center print:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-400 hover:text-maritime-600 transition-colors focus:outline-none"
        aria-label="More info"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700 leading-relaxed">
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
          </div>
          {content}
        </div>
      )}
    </div>
  );
}
