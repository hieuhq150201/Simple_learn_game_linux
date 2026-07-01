'use client'
import { useState, useEffect, useRef } from 'react'
import { chapters } from '@/data/chapters.js'

const NOTIF_READ_KEY = 'hacker-path-notif-read-at'

const ADMIN_MSGS = [
  {
    id: 'tip-hint',
    title: 'Mẹo: Dùng hint khi bí',
    body: 'Gõ `hint` trong terminal để nhận gợi ý theo 3 cấp độ — từ chung đến gần như đáp án.',
    ts: 2,
  },
  {
    id: 'welcome',
    title: 'Chào mừng đến Hacker Path! 🔒',
    body: 'Gõ lệnh thật, học kỹ năng thật. Hành trình của bạn bắt đầu từ chương 1.',
    ts: 1,
  },
]

function loadProgress() {
  try {
    const raw = localStorage.getItem('hacker-path-progress')
    return raw ? JSON.parse(raw) : { completedMissions: {} }
  } catch {
    return { completedMissions: {} }
  }
}

function deriveAchievements(completedMissions: Record<string, { completedAt: number }>) {
  const result: { id: string; title: string; body: string; ts: number }[] = []
  for (const chapter of chapters as any[]) {
    const missionIds = Array.from({ length: chapter.missionCount }, (_, i) => i + 1)
    const allDone = missionIds.every((i) => completedMissions[`${chapter.id}-${i}`])
    if (!allDone) continue
    const latestAt = Math.max(...missionIds.map((i) => completedMissions[`${chapter.id}-${i}`]?.completedAt ?? 0))
    result.push({
      id: `chapter-done-${chapter.id}`,
      title: `🏆 Hoàn thành Chương ${chapter.id}!`,
      body: `${chapter.title} — tất cả mission đã chinh phục.`,
      ts: latestAt,
    })
  }
  return result.sort((a, b) => b.ts - a.ts)
}

function getLastReadAt() {
  try { return parseInt(localStorage.getItem(NOTIF_READ_KEY) ?? '0', 10) } catch { return 0 }
}
function markAllRead() {
  localStorage.setItem(NOTIF_READ_KEY, String(Date.now()))
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; ts: number }[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  function refresh() {
    const progress = loadProgress()
    const achievements = deriveAchievements(progress.completedMissions)
    const all = [...achievements, ...ADMIN_MSGS].sort((a, b) => b.ts - a.ts)
    const lastRead = getLastReadAt()
    setNotifications(all)
    setUnreadCount(all.filter((n) => n.ts > lastRead).length)
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function togglePanel() {
    if (!open) {
      refresh()
      markAllRead()
      setUnreadCount(0)
    }
    setOpen((v) => !v)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={togglePanel}
        className="relative p-1.5 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 outline-none focus-visible:ring-1 focus-visible:ring-green-500"
        aria-label="Thông báo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] flex flex-col border border-hp-border rounded-xl bg-hp-card shadow-2xl shadow-black/20 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-hp-border shrink-0">
            <span className="text-green-600 dark:text-green-400 font-mono text-xs font-bold tracking-widest">THÔNG BÁO</span>
            <button onClick={() => setOpen(false)} className="text-hp-subtle hover:text-hp-fg text-lg leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-hp-subtle text-xs font-mono text-center py-8">Chưa có thông báo nào.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-hp-border hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <p className="text-hp-fg text-sm font-semibold leading-snug">{n.title}</p>
                  <p className="text-hp-muted text-xs mt-0.5 leading-relaxed">{n.body}</p>
                  {n.ts > 10 && (
                    <p className="text-hp-subtle text-[10px] mt-1 font-mono">
                      {new Date(n.ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
