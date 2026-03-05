export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function ciiRatingColor(rating: string): string {
  const colors: Record<string, string> = {
    A: 'bg-green-500',
    B: 'bg-lime-400',
    C: 'bg-yellow-400',
    D: 'bg-orange-500',
    E: 'bg-red-600',
  };
  return colors[rating] || 'bg-gray-400';
}

export function shipTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
