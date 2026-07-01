'use client'
import { useEffect, useState } from 'react'
import LeaderboardTable from '@/components/Leaderboard/LeaderboardTable'
import Link from 'next/link'

interface ProfileEntry { id: string; name: string; xp: number; level: number; currentStreak: number }

export default function LeaderboardPage() {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hacker-path-profiles')
      const list: ProfileEntry[] = raw ? JSON.parse(raw) : []
      // Sync XP từ progress hiện tại vào profile active
      const progress = localStorage.getItem('hacker-path-progress')
      const parsed = progress ? JSON.parse(progress) : {}
      const active = localStorage.getItem('hacker-path-active-profile') ?? ''
      const synced = list.map((p) =>
        p.id === active ? { ...p, xp: parsed.xp ?? 0, level: parsed.level ?? 1, currentStreak: parsed.currentStreak ?? 0 } : p
      )
      setProfiles(synced)
      setActiveId(active)
    } catch {}
  }, [])

  return (
    <main className="min-h-screen bg-hp-surface p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-hp-muted hover:text-hp-fg text-sm font-mono transition-colors">← Về bản đồ</Link>
        </div>
        <LeaderboardTable profiles={profiles} activeId={activeId} />
      </div>
    </main>
  )
}
