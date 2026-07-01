'use client'
import { TrophyIcon, type TrophyTier } from '@/components/Achievement/TrophyIcon'

interface BadgeToastProps {
  badge?: { emoji: string; name: string; description?: string; tier?: TrophyTier } | null
}

export default function BadgeToast({ badge }: BadgeToastProps): JSX.Element | null {
  if (!badge) return null

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 pl-3 pr-5 py-3 rounded-xl border border-yellow-600/40 bg-gray-950/98 shadow-xl shadow-black/60 animate-celebrate-in max-w-xs z-50">
      <TrophyIcon tier={badge.tier ?? 'gold'} size={44} unlocked />
      <div className="min-w-0">
        <p className="text-yellow-400 text-xs font-mono font-bold tracking-widest mb-0.5">THÀNH TỰU MỚI!</p>
        <p className="text-white text-sm font-semibold leading-tight">{badge.name}</p>
        {badge.description && (
          <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">{badge.description}</p>
        )}
      </div>
    </div>
  )
}
