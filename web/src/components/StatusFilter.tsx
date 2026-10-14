import type { StatusCounts } from '../api/types'
import { REQUEST_STATUSES } from '../statuses'

interface StatusFilterProps {
  value: string // '' means "all statuses"
  counts: StatusCounts | null // null while the numbers are loading
  onChange: (value: string) => void
}

// A row of buttons: "All 12", "New 5", "In progress 4", "Done 3".
// They double as the status filter and as a small summary of the work.
export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  const options = [
    { value: '', label: 'All', count: counts?.total },
    ...REQUEST_STATUSES.map((item) => ({ ...item, count: counts?.[item.value] })),
  ]

  return (
    <div className="chips" role="group" aria-label="Filter by status">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="chip"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {/* The space keeps the accessible name readable: "New 5", not "New5". */}
          {option.count !== undefined && ' '}
          {option.count !== undefined && <span className="chip-count">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}
