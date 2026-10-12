import type { RequestStatus } from '../api/types'
import { statusLabel } from '../statuses'

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>
}
