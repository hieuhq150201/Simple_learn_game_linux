'use client'
import { useEffect, useState } from 'react'

export default function StreakBadge({ streak, broken = false }: { streak: number; broken?: boolean }): JSX.Element | null {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (broken && streak > 0) {
      setAnimate(true)
      const t = setTimeout(() => setAnimate(false), 700)
      return () => clearTimeout(t)
    }
  }, [broken, streak])

  if (streak === 0 && !broken) return null

  return (
    <div className={`flex items-center gap-1.5 ${animate ? 'animate-streak-break' : ''}`}>
      <span className="text-lg">🔥</span>
      <span className="font-mono font-bold text-sm text-orange-500">
        {streak} ngày liên tiếp
      </span>
      {broken && (
        <span className="text-hp-subtle text-xs">(streak đã bị mất)</span>
      )}
    </div>
  )
}
