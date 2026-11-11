const pad = (n: number) => String(n).padStart(2, '0');

/** Missing measurements render as "—", never as a valid-looking number. */
export const num = (n: number | null, digits: number, unit = '') => (n == null ? '—' : n.toFixed(digits) + unit);

export const duration = (totalSec: number) =>
  `${pad(Math.floor(totalSec / 3600))}:${pad(Math.floor(totalSec / 60) % 60)}:${pad(totalSec % 60)}`;

export const clock = (d: Date, withSeconds = false) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}${withSeconds ? ':' + pad(d.getSeconds()) : ''}`;

export const dayLabel = (d: Date, now = new Date()) => {
  const midnight = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(now) - midnight(d)) / 86_400_000);
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return days === 0 ? `HÔM NAY · ${date}` : days === 1 ? `HÔM QUA · ${date}` : date;
};
