interface PagerProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

// "Showing 11-20 of 42" with Previous / Next buttons.
// Nothing is shown when everything fits on one page.
export function Pager({ page, pageSize, total, onChange }: PagerProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize && page === 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav className="pager" aria-label="Pagination">
      <span className="muted">{total === 0 ? 'No results' : `Showing ${from}-${to} of ${total}`}</span>
      <div className="actions">
        <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <span aria-current="page">
          Page {page} of {lastPage}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  )
}
