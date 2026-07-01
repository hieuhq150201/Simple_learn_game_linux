'use client'
import { useEffect, useRef, useState } from 'react'
import { xpForNextLevel } from '../../utils/xpCalc'

export default function XPBar({ xp, level, xpEarned }: { xp: number; level: number; xpEarned: number }): JSX.Element {
  const prevXP = xp - xpEarned
  const nextLevelXP = xpForNextLevel(level)
  const prevLevelXP = xpForNextLevel(level - 1)
  const rangeXP = nextLevelXP - prevLevelXP

  const prevPct = Math.min(100, Math.round(((prevXP - prevLevelXP) / rangeXP) * 100))
  const newPct  = Math.min(100, Math.round(((xp - prevLevelXP) / rangeXP) * 100))

  const countRef = useRef<HTMLSpanElement>(null)
  const [barPct, setBarPct] = useState(prevPct)

  useEffect(() => {
    // Count-up animation
    const target = xpEarned
    let current = 0
    const step = Math.ceil(target / 30)
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      if (countRef.current) countRef.current.textContent = `+${current}`
      if (current >= target) clearInterval(timer)
    }, 25)

    // Bar fill animation (delay 200ms)
    const fillTimer = setTimeout(() => setBarPct(newPct), 200)

    return () => { clearInterval(timer); clearTimeout(fillTimer) }
  }, [xpEarned, newPct])

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-yellow-500 font-bold">
          ⚡ <span ref={countRef}>+0</span> XP
        </span>
        <span className="text-hp-subtle">Lv.{level} · {xp.toLocaleString()} XP</span>
      </div>
      <div className="w-full h-2.5 bg-hp-card rounded-full overflow-hidden border border-hp-border">
        <div
          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className="text-hp-subtle text-[10px] font-mono text-right">
        {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP để lên Lv.{level + 1}
      </p>
    </div>
  )
}
