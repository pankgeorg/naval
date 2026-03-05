import { useState, useEffect } from 'react';
import { getPorts } from '../../api/ports';
import { MapPin } from 'lucide-react';

interface Port {
  id: string;
  name: string;
  unlocode: string;
  country_iso: string;
  is_eu_eea: boolean;
}

interface Props {
  onSelect: (port: Port) => void;
  placeholder?: string;
}

export default function PortSearchCombobox({ onSelect, placeholder = 'Search ports...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Port[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      const timer = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      try {
        const data = await getPorts({ q: query, size: '10' });
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-maritime-500 focus:border-maritime-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((port) => (
            <button
              key={port.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
              onClick={() => {
                onSelect(port);
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
            >
              <MapPin className={`w-4 h-4 ${port.is_eu_eea ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="font-medium">{port.name}</span>
              <span className="text-gray-400">{port.unlocode}</span>
              <span className="text-gray-400 ml-auto">{port.country_iso}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
