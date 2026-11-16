export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-panel px-4 py-8 text-center">
      <p className="font-medium text-white">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
    </div>
  )
}
