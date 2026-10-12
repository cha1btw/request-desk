import type { RequestStatus } from './api/types'

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export function statusLabel(status: RequestStatus): string {
  return REQUEST_STATUSES.find((item) => item.value === status)?.label ?? status
}
