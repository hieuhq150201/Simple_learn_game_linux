'use client'
import { useAuthStore } from '@/stores/authStore'

interface Badge {
  id: string
  emoji: string
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
  const unlockedBadges = badges.filter((b) => b.unlocked)

  return (
    <div className="w-full max-w-2xl mx-auto py-6 flex flex-col items-center gap-4">
      {/* Greeting */}
      <div className="text-center">
        <p className="text-gray-500 text-sm font-mono">WELCOME BACK,</p>
        <h1 className="text-green-400 font-mono font-bold text-2xl tracking-widest">{name.toUpperCase()}</h1>
      </div>

      {/* Progress bar */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-gray-400">{completedCount}/{totalMissions} missions</span>
          <span className="text-green-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats + badges */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500 font-mono">
        <span>⌨ {stats.commandsRun} lệnh</span>
        <span className="text-gray-700">·</span>
        <span>💡 {stats.hintsUsed} hint</span>
        {unlockedBadges.length > 0 && (
          <>
            <span className="text-gray-700">·</span>
            <span className="flex items-center gap-1">
              {unlockedBadges.map((b) => (
                <span key={b.id} title={`${b.name} — ${b.description}`} className="text-base select-none">
                  {b.emoji}
                </span>
              ))}
            </span>
          </>
        )}
        {/* locked badges dimmed */}
        {badges.filter((b) => !b.unlocked).map((b) => (
          <span key={b.id} title={`${b.name} — ${b.description} (Chưa mở khoá)`} className="text-base select-none opacity-20 grayscale">
            {b.emoji}
          </span>
        ))}
      </div>
    </div>
  )
}
