export function formatRupiah(value) {
  return 'Rp' + Math.round(value).toLocaleString('id-ID');
}

/**
 * Format a date (API string or Date object) as YYYY-MM-DD using the
 * browser's local timezone. Never use `dateStr.slice(0, 10)` directly on
 * API date strings — Laravel serializes dates in UTC, so a naive slice
 * reads the UTC calendar day and shows the wrong (often previous) date
 * for any local timezone ahead of UTC (e.g. Asia/Jakarta, UTC+7).
 */
export function formatDateOnly(dateInput) {
  const d = new Date(dateInput);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}
