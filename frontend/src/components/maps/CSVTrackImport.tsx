import { useState } from 'react';
import { Upload } from 'lucide-react';

interface Props {
  onImport: (points: { latitude: number; longitude: number; sog_knots?: number }[]) => void;
}

export default function CSVTrackImport({ onImport }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const Papa = await import('papaparse');
    const result = Papa.default.parse(text, { header: true, skipEmptyLines: true });
    const points = (result.data as Record<string, string>[]).map((row) => ({
      latitude: parseFloat(row.latitude || row.lat || '0'),
      longitude: parseFloat(row.longitude || row.lon || '0'),
      sog_knots: row.sog ? parseFloat(row.sog) : undefined,
    }));
    onImport(points);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragOver ? 'border-maritime-500 bg-maritime-50' : 'border-gray-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Drag & drop CSV track file</p>
      <p className="text-xs text-gray-400 mt-1">Required: latitude, longitude. Optional: timestamp, sog</p>
      <label className="mt-3 inline-block">
        <span className="text-sm text-maritime-600 hover:underline cursor-pointer">Or browse files</span>
        <input type="file" accept=".csv" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }} />
      </label>
    </div>
  );
}
