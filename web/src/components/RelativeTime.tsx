import { formatDate, timeAgo } from '../format'

// Shows "2 hours ago"; hovering shows the exact date and time.
export function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatDate(iso)}>
      {timeAgo(iso)}
    </time>
  )
}
