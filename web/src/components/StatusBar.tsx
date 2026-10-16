import type { StatusCounts } from '../api/types'
import { REQUEST_STATUSES } from '../statuses'

// A thin bar split into the three statuses, plus a "x% done" caption.
// Shown above the status buttons as a quick picture of the workload.
export function StatusBar({ counts }: { counts: StatusCounts | null }) {
  if (!counts || counts.total === 0) return null

  const donePercent = Math.round((counts.done / counts.total) * 100)

  return (
    <div className="status-bar-wrap">
      <div
        className="status-bar"
        role="img"
        aria-label={REQUEST_STATUSES.map((item) => `${item.label}: ${counts[item.value]}`).join(', ')}
      >
        {REQUEST_STATUSES.map((item) =>
          counts[item.value] > 0 ? (
            <span
              key={item.value}
              className={`status-bar-part status-bar-${item.value}`}
              style={{ flexGrow: counts[item.value] }}
            />
          ) : null,
        )}
      </div>
      <p className="muted status-bar-caption">
        {donePercent}% done ({counts.done} of {counts.total})
      </p>
    </div>
  )
}
