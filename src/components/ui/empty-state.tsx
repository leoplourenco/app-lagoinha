export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-8 text-center">
      <p className="font-medium text-sky-50">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-sky-100/70">{description}</p>
      ) : null}
    </div>
  )
}
