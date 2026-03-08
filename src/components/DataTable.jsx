export default function DataTable({ columns, data, loading, emptyMessage = 'No data' }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-slate-900" />
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
            {columns.map((col) => (
              <th key={col.key} className="text-left font-semibold px-4 py-3 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || row.id || i} className="border-b border-slate-100 hover:bg-slate-50/60">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-middle text-slate-700">
                  {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
