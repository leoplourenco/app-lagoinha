import { cn } from '../../lib/utils'

export function BrandMark({
  size = 'md',
  showWordmark = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
}) {
  const box =
    size === 'lg' ? 'h-40 w-40' : size === 'sm' ? 'h-28 w-28' : 'h-32 w-32'

  return (
    <div className="flex flex-col items-center text-center">
      <img
        src={showWordmark ? '/brand/logo-dark.png' : '/brand/logo-icon.png'}
        alt="Lagoinha"
        className={cn(box, 'object-contain')}
      />
    </div>
  )
}
