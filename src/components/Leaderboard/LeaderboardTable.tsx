'use client'

interface ProfileEntry {
  id: string
  name: string
  xp: number
  level: number
  currentStreak: number
}

export default function LeaderboardTable({ profiles, activeId }: { profiles: ProfileEntry[]; activeId: string }): JSX.Element {
  const sorted = [...profiles].sort((a, b) => b.xp - a.xp)

  return (
    <div className="w-full border border-hp-border rounded-lg overflow-hidden">
      <div className="bg-hp-card border-b border-hp-border px-4 py-2.5 flex items-center gap-2">
        <span className="text-yellow-500">🏆</span>
        <span className="text-hp-fg font-mono font-bold text-sm tracking-widest">BẢNG XẾP HẠNG</span>
        <span className="text-hp-subtle text-xs ml-1">(thiết bị này)</span>
      </div>
      <ul>
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 px-4 py-3 border-b border-hp-border last:border-b-0 transition-colors ${
              p.id === activeId ? 'bg-green-500/5 border-l-2 border-l-green-500' : 'bg-hp-card hover:bg-gray-50 dark:hover:bg-gray-900/50'
            }`}
          >
            <span className="font-mono font-bold text-sm w-6 text-center text-hp-subtle">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-mono font-semibold text-sm truncate ${p.id === activeId ? 'text-green-500 dark:text-green-400' : 'text-hp-fg'}`}>
                {p.name} {p.id === activeId && <span className="text-[10px] text-green-500">(bạn)</span>}
              </p>
              <p className="text-hp-subtle text-[10px] font-mono">Lv.{p.level}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-yellow-600 dark:text-yellow-400 font-mono font-bold text-sm">{p.xp.toLocaleString()} XP</p>
              {p.currentStreak > 0 && (
                <p className="text-orange-500 text-[10px] font-mono">🔥 {p.currentStreak} ngày</p>
              )}
            </div>
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="px-4 py-8 text-center text-hp-subtle text-sm font-mono">
            Chưa có dữ liệu
          </li>
        )}
      </ul>
    </div>
  )
}
