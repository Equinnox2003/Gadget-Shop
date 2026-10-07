export function peso(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return (
    '₱' +
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function columnsForWidth(width: number): number {
  if (width >= 1100) return 4;
  if (width >= 700) return 3;
  return 2;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}
