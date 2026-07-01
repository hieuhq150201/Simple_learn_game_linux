'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import StarRating from './StarRating'
import XPBar from './XPBar'
import StreakBadge from './StreakBadge'
import type { Stars } from '../../utils/xpCalc'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface MissionCompleteModalProps {
  missionTitle: string
  stars: Stars
  xp: number
  xpEarned: number
  level: number
  streak: number
  streakBroken: boolean
  onNextMission?: () => void
  onBackToMap: () => void
}

const LOTTIE_MAP: Record<Stars, string | null> = {
  3: '/lottie/confetti-gold.json',
  2: '/lottie/confetti-green.json',
  1: null,
}

export default function MissionCompleteModal({
  missionTitle, stars, xp, xpEarned, level, streak, streakBroken, onNextMission, onBackToMap,
}: MissionCompleteModalProps): JSX.Element {
  const [lottieData, setLottieData] = useState<Record<string, unknown> | null>(null)
  const [showButtons, setShowButtons] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const lottieFile = LOTTIE_MAP[stars]
    if (lottieFile) {
      fetch(lottieFile).then((r) => r.json()).then(setLottieData).catch(() => {})
    }
    // Nút xuất hiện sau 2s
    const t = setTimeout(() => setShowButtons(true), 2000)
    return () => clearTimeout(t)
  }, [stars])

  // Countdown auto-close sau 5s (bắt đầu đếm khi nút xuất hiện)
  useEffect(() => {
    if (!showButtons) return
    if (countdown <= 0) { onBackToMap(); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [showButtons, countdown, onBackToMap])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onBackToMap() }}
    >
      {/* Lottie — full background */}
      {lottieData && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70">
          <Lottie animationData={lottieData} loop={false} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      <div className="relative w-full max-w-sm border border-green-500/40 rounded-xl bg-gray-950 shadow-2xl shadow-green-900/30 animate-celebrate-in flex flex-col items-center gap-5 px-7 py-8">
        <div className="text-center">
          <p className="text-green-400 font-mono text-[10px] tracking-[0.3em] mb-1">MISSION HOÀN THÀNH</p>
          <h2 className="text-white font-bold text-lg leading-snug">{missionTitle}</h2>
        </div>

        <StarRating count={stars} animate />

        <XPBar xp={xp} level={level} xpEarned={xpEarned} />

        <StreakBadge streak={streak} broken={streakBroken} />

        {showButtons ? (
          <div className="flex flex-col gap-2 w-full">
            {onNextMission && (
              <button
                onClick={onNextMission}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-mono font-bold text-sm py-2.5 rounded-lg transition-colors"
              >
                Mission tiếp theo →
              </button>
            )}
            <button
              onClick={onBackToMap}
              className="w-full border border-green-700/50 hover:border-green-500 text-green-400 font-mono text-sm py-2.5 rounded-lg transition-colors"
            >
              Về bản đồ chương <span className="text-hp-subtle text-xs">({countdown}s)</span>
            </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
