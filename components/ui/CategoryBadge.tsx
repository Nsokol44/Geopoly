// components/ui/CategoryBadge.tsx
import type { StoryCategory } from '@/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/utils'

export function CategoryBadge({ category }: { category: StoryCategory }) {
  const color = CATEGORY_COLORS[category] ?? '#F59E0B'
  const label = CATEGORY_LABELS[category] ?? category

  return (
    <span
      className="inline-block text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-sm border"
      style={{ color, background: `${color}18`, borderColor: `${color}44` }}
    >
      {label}
    </span>
  )
}
