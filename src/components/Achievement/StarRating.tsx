'use client'
import { useEffect, useState } from 'react'
import type { Stars } from '../../utils/xpCalc'

export default function StarRating({ count, animate = false }: { count: Stars; animate?: boolean }): JSX.Element {
  const [visible, setVisible] = useState(animate ? 0 : count)

  useEffect(() => {
    if (!animate) return
    const timers = [1, 2, 3].map((n) =>
      setTimeout(() => setVisible(n as Stars), (n - 1) * 300 + 300)
    )
    return () => timers.forEach(clearTimeout)
  }, [animate, count])

  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-2xl transition-all duration-200 ${
            n <= visible ? 'animate-star-pop opacity-100' : 'opacity-10 scale-75'
          }`}
          style={{ animationDelay: animate ? `${(n - 1) * 0.3}s` : '0s' }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}
