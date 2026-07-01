'use client'
import { useAuthStore } from '@/stores/authStore'
import { TrophyIcon, type TrophyTier } from '@/components/Achievement/TrophyIcon'

interface Badge {
  id: string
  tier?: TrophyTier
  name: string
  description: string
  unlocked: boolean
}

interface ProgressHeroProps {
  progressPercent: number
  completedCount: number
  totalMissions: number
  badges: Badge[]
  stats: { commandsRun: number; hintsUsed: number }
}

export default function ProgressHero({ progressPercent, completedCount, totalMissions, badges, stats }: ProgressHeroProps) {
  const { user } = useAuthStore()
  const name = user?.displayName || user?.email?.split('@')[0] || 'Hacker'
  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div className="w-full max-w-2xl mx-auto py-6 flex flex-col items-center gap-5">
      {/* Greeting */}
      <div className="text-center">
        <p className="text-hp-subtle text-sm font-mono">WELCOME BACK,</p>
        <h1 className="text-green-500 dark:text-green-400 font-mono font-bold text-2xl tracking-widest">{name.toUpperCase()}</h1>
      </div>

      {/* Progress bar */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-hp-muted">{completedCount}/{totalMissions} missions</span>
          <span className="text-green-600 dark:text-green-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-hp-border">
          <div
            className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-hp-muted font-mono">
        <span>⌨ {stats.commandsRun} lệnh</span>
        <span className="text-hp-border">·</span>
        <span>💡 {stats.hintsUsed} hint</span>
        <span className="text-hp-border">·</span>
        <span className="text-yellow-600 dark:text-yellow-600">🏆 {unlockedCount}/{badges.length} thành tựu</span>
      </div>

      {/* Trophy showcase */}
      <div className="w-full">
        <p className="text-hp-subtle text-[10px] font-mono tracking-widest text-center mb-3">THÀNH TỰU</p>
        <div className="flex flex-wrap justify-center gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center gap-1 cursor-default"
              title={`${badge.name} — ${badge.description}${badge.unlocked ? '' : ' (Chưa mở khoá)'}`}
            >
              <TrophyIcon
                tier={badge.tier ?? 'bronze'}
                size={36}
                unlocked={badge.unlocked}
              />
              <span
                className={`text-[9px] font-mono leading-tight text-center max-w-[52px] truncate ${
                  badge.unlocked ? 'text-hp-muted' : 'text-hp-subtle opacity-50'
                }`}
              >
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
