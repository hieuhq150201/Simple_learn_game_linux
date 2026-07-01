'use client'
import { useCallback, useState } from 'react'
import { badges, isBadgeUnlocked } from '../data/badges.js'
import { chapters } from '../data/chapters.js'
import { calcXP, calcLevel, calcStars, type Stars } from '../utils/xpCalc'
import { updateStreak, getStreakBroken } from '../utils/streakCalc'

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

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress)

  // Tính streakBroken một lần khi load
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

        // Không cộng XP nếu replay và sao không tốt hơn
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
