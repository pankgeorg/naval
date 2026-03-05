interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({ columns, data, onRowClick }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className="text-left py-3 px-4 font-medium text-gray-500">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              className={`border-b border-gray-100 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4">
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-gray-400">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
