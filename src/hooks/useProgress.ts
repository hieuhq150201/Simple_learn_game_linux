'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { badges, isBadgeUnlocked } from '../data/badges.js'
import { chapters } from '../data/chapters.js'
import { calcXP, calcLevel, calcStars, type Stars } from '../utils/xpCalc'
import { updateStreak, getStreakBroken } from '../utils/streakCalc'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

const STORAGE_KEY = 'hacker-path-progress'

interface MissionRecord {
  completedAt: number
  usedHint: boolean
  stars: Stars
  xpEarned: number
}

interface ProgressState {
  completedMissions: Record<string, MissionRecord>
  stats: { commandsRun: number; hintsUsed: number }
  xp: number
  level: number
  currentStreak: number
  lastPlayDate: string
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      completedMissions: parsed.completedMissions ?? {},
      stats: parsed.stats ?? { commandsRun: 0, hintsUsed: 0 },
      xp: parsed.xp ?? 0,
      level: parsed.level ?? 1,
      currentStreak: parsed.currentStreak ?? 0,
      lastPlayDate: parsed.lastPlayDate ?? '',
    }
  } catch {
    return { completedMissions: {}, stats: { commandsRun: 0, hintsUsed: 0 }, xp: 0, level: 1, currentStreak: 0, lastPlayDate: '' }
  }
}

function saveProgress(p: ProgressState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch { /* quota exceeded */ }
}

// Merge missions: giữ record có stars cao hơn
function mergeMissions(
  local: Record<string, MissionRecord>,
  server: Record<string, MissionRecord>,
): Record<string, MissionRecord> {
  const result = { ...local }
  for (const [key, serverRecord] of Object.entries(server)) {
    const localRecord = local[key]
    if (!localRecord || (serverRecord.stars ?? 0) > (localRecord.stars ?? 0)) {
      result[key] = serverRecord
    }
  }
  return result
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress)
  const { isAuthenticated } = useAuthStore()
  const syncedRef = useRef(false) // tránh sync nhiều lần khi re-render

  // Khi login: fetch progress từ server, merge với localStorage
  useEffect(() => {
    if (!isAuthenticated || syncedRef.current) return
    syncedRef.current = true

    api.get('/users/me').then((data: unknown) => {
      const serverProg = (data as { progress?: { completedMissions?: Record<string, MissionRecord>; xp?: number; level?: number; currentStreak?: number; lastPlayDate?: string; commandsRun?: number; hintsUsed?: number } }).progress
      if (!serverProg) {
        // Chưa có progress trên server → push local lên
        pushToServer(loadProgress())
        return
      }

      const local = loadProgress()
      const merged = mergeMissions(local.completedMissions, serverProg.completedMissions ?? {})
      const mergedXP = Object.values(merged).reduce((sum, m) => sum + (m.xpEarned ?? 0), 0)

      const next: ProgressState = {
        completedMissions: merged,
        stats: {
          commandsRun: Math.max(local.stats.commandsRun, serverProg.commandsRun ?? 0),
          hintsUsed: Math.max(local.stats.hintsUsed, serverProg.hintsUsed ?? 0),
        },
        xp: mergedXP,
        level: calcLevel(mergedXP),
        // Streak: server là source of truth (time-based)
        currentStreak: serverProg.currentStreak ?? local.currentStreak,
        lastPlayDate: serverProg.lastPlayDate ?? local.lastPlayDate,
      }
      saveProgress(next)
      setProgress(next)
      // Đẩy merged state ngược lại server để đồng bộ
      pushToServer(next)
    }).catch(() => { /* offline hoặc lỗi mạng — giữ localStorage */ })
  }, [isAuthenticated])

  // Reset syncedRef khi logout để lần login sau sync lại
  useEffect(() => {
    if (!isAuthenticated) syncedRef.current = false
  }, [isAuthenticated])

  const streakBroken = getStreakBroken({ currentStreak: progress.currentStreak, lastPlayDate: progress.lastPlayDate })

  const isMissionCompleted = useCallback(
    (chapterId: number, missionId: number) =>
      Boolean(progress.completedMissions[`${chapterId}-${missionId}`]),
    [progress]
  )

  const getMissionStars = useCallback(
    (chapterId: number, missionId: number): Stars | null =>
      progress.completedMissions[`${chapterId}-${missionId}`]?.stars ?? null,
    [progress]
  )

  const completeMission = useCallback(
    (chapterId: number, missionId: number, { usedHint = false, hintsUsed = 0 }: { usedHint?: boolean; hintsUsed?: number } = {}) => {
      setProgress((prev) => {
        const key = `${chapterId}-${missionId}`
        const existing = prev.completedMissions[key]
        const stars = calcStars(hintsUsed)

        const isImprovement = !existing || stars > existing.stars
        const xpEarned = isImprovement ? calcXP(chapterId, missionId, stars) : 0
        const newXP = prev.xp + xpEarned

        const streakState = updateStreak({ currentStreak: prev.currentStreak, lastPlayDate: prev.lastPlayDate })

        const next: ProgressState = {
          ...prev,
          completedMissions: {
            ...prev.completedMissions,
            [key]: { completedAt: Date.now(), usedHint, stars, xpEarned },
          },
          xp: newXP,
          level: calcLevel(newXP),
          currentStreak: streakState.currentStreak,
          lastPlayDate: streakState.lastPlayDate,
        }
        saveProgress(next)

        // Fire-and-forget sync nếu đã đăng nhập
        if (useAuthStore.getState().isAuthenticated) {
          pushToServer(next)
        }

        return next
      })
    },
    []
  )

  const incrementCommandsRun = useCallback(() => {
    setProgress((prev) => {
      const next: ProgressState = { ...prev, stats: { ...prev.stats, commandsRun: prev.stats.commandsRun + 1 } }
      saveProgress(next)
      return next
    })
  }, [])

  const incrementHintsUsed = useCallback(() => {
    setProgress((prev) => {
      const next: ProgressState = { ...prev, stats: { ...prev.stats, hintsUsed: prev.stats.hintsUsed + 1 } }
      saveProgress(next)
      return next
    })
  }, [])

  const isChapterUnlocked = useCallback(
    (chapterId: number, missionsInChapter: number) => {
      if (chapterId === 1) return true
      for (let i = 1; i <= missionsInChapter; i++) {
        if (!isMissionCompleted(chapterId - 1, i)) return false
      }
      return true
    },
    [isMissionCompleted]
  )

  const getBadges = useCallback(
    () => badges.map((badge: any) => ({ ...badge, unlocked: isBadgeUnlocked(badge, progress.completedMissions, chapters) })),
    [progress]
  )

  return {
    progress,
    xp: progress.xp,
    level: progress.level,
    currentStreak: progress.currentStreak,
    streakBroken,
    isMissionCompleted,
    getMissionStars,
    completeMission,
    incrementCommandsRun,
    incrementHintsUsed,
    isChapterUnlocked,
    getBadges,
  }
}

function pushToServer(p: ProgressState): void {
  api.patch('/users/me/progress', {
    completedMissions: p.completedMissions,
    xp: p.xp,
    level: p.level,
    currentStreak: p.currentStreak,
    lastPlayDate: p.lastPlayDate,
    commandsRun: p.stats.commandsRun,
    hintsUsed: p.stats.hintsUsed,
  }).catch(() => { /* ignore network errors */ })
}
