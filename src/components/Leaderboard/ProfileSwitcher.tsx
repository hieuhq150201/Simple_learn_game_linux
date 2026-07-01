'use client'
import { useEffect, useRef, useState } from 'react'

interface Profile {
  id: string
  name: string
  xp: number
  level: number
  currentStreak: number
  createdAt: number
}

const PROFILES_KEY = 'hacker-path-profiles'
const ACTIVE_KEY   = 'hacker-path-active-profile'
const PROGRESS_KEY = 'hacker-path-progress'

function loadProfiles(): Profile[] {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '[]') } catch { return [] }
}
function loadActiveId(): string {
  return localStorage.getItem(ACTIVE_KEY) ?? ''
}
function saveProfiles(p: Profile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(p))
}

export default function ProfileSwitcher(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeId, setActiveId] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setProfiles(loadProfiles())
    setActiveId(loadActiveId())
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function switchProfile(id: string) {
    localStorage.setItem(ACTIVE_KEY, id)
    setActiveId(id)
    setOpen(false)
    window.location.reload() // reload để useProgress re-init đúng profile
  }

  function addProfile() {
    const name = newName.trim()
    if (!name) return
    if (profiles.some((p) => p.name === name)) {
      alert('Tên này đã tồn tại, chọn tên khác nhé.')
      return
    }
    if (profiles.length >= 5) {
      alert('Tối đa 5 người chơi trên 1 thiết bị.')
      return
    }
    // Lưu progress hiện tại vào profile hiện tại trước khi switch
    const currentProgress = localStorage.getItem(PROGRESS_KEY)
    const updatedProfiles = profiles.map((p) =>
      p.id === activeId ? { ...p, ...(currentProgress ? JSON.parse(currentProgress) : {}) } : p
    )
    const newProfile: Profile = { id: crypto.randomUUID(), name, xp: 0, level: 1, currentStreak: 0, createdAt: Date.now() }
    const next = [...updatedProfiles, newProfile]
    saveProfiles(next)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ completedMissions: {}, stats: { commandsRun: 0, hintsUsed: 0 }, xp: 0, level: 1, currentStreak: 0, lastPlayDate: '' }))
    switchProfile(newProfile.id)
  }

  const active = profiles.find((p) => p.id === activeId)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono text-hp-muted hover:text-hp-fg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span>👤</span>
        <span className="max-w-[80px] truncate">{active?.name ?? 'Hacker'}</span>
        <span className="text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-hp-card border border-hp-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-hp-border">
            <p className="text-hp-subtle text-[10px] font-mono tracking-widest">NGƯỜI CHƠI</p>
          </div>
          <ul>
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => switchProfile(p.id)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${p.id === activeId ? 'text-green-600 dark:text-green-400' : 'text-hp-fg'}`}
                >
                  <span className="text-sm">👤</span>
                  <span className="text-xs font-mono truncate flex-1">{p.name}</span>
                  {p.id === activeId && <span className="text-[10px] text-green-500">✓</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-hp-border px-3 py-2">
            {adding ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addProfile(); if (e.key === 'Escape') setAdding(false) }}
                  placeholder="Tên người chơi"
                  className="flex-1 text-xs px-2 py-1 rounded border border-hp-border bg-hp-surface text-hp-fg font-mono outline-none focus:border-green-500"
                />
                <button onClick={addProfile} className="text-xs text-green-600 font-mono px-1">OK</button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full text-left text-xs text-hp-muted hover:text-hp-fg font-mono py-0.5 transition-colors"
              >
                + Thêm người chơi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
