export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="join flex justify-center mt-6">
      <button
        type="button"
        className="join-item btn btn-sm bg-white border-slate-200 hover:bg-slate-50"
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <button type="button" className="join-item btn btn-sm bg-slate-50 border-slate-200 text-slate-600 cursor-default">
        Page {page} of {totalPages}
      </button>
      <button
        type="button"
        className="join-item btn btn-sm bg-white border-slate-200 hover:bg-slate-50"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}
