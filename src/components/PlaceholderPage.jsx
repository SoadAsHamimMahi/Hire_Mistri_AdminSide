export default function PlaceholderPage({ title, description }) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-slate-600">{description}</p>}
        <p className="mt-4 text-sm text-slate-500">This page will be connected to real data in Phase 5.</p>
      </div>
    </div>
  )
}
