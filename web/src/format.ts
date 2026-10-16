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
