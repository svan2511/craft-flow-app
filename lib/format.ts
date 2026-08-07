export function formatRupees(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatRupeesCompact(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Compact Indian short form for tight UI (₹5K, ₹1.5L, ₹2Cr). */
export function formatRupeesShort(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(1)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `₹${Math.round(num / 1000)}K`;
  }
  return `₹${num}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayLabel(): string {
  const now = new Date();
  return `${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • ${now.toLocaleDateString('en-IN', { weekday: 'long' })}`;
}
