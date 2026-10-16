export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

// "Anna Petrenko" -> "AP", "olena" -> "O". Used when there is no photo.
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const letters = parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]
  return letters.toUpperCase()
}

const UNITS: [limit: number, seconds: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60, 1, 'second'],
  [3600, 60, 'minute'],
  [86400, 3600, 'hour'],
  [604800, 86400, 'day'],
]

// "2 hours ago", "yesterday". Older than a week falls back to the plain date,
// because "5 weeks ago" is less useful than the real day.
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [limit, size, unit] of UNITS) {
    if (seconds < limit) return formatter.format(-Math.round(seconds / size), unit)
  }
  return formatDate(iso)
}
