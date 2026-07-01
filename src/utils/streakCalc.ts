export interface StreakState {
  currentStreak: number
  lastPlayDate: string // UTC "YYYY-MM-DD"
}

export function updateStreak(state: StreakState): StreakState {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (state.lastPlayDate === today) return state
  if (state.lastPlayDate === yesterday)
    return { currentStreak: state.currentStreak + 1, lastPlayDate: today }
  return { currentStreak: 1, lastPlayDate: today }
}

export function getStreakBroken(state: StreakState): boolean {
  if (state.currentStreak === 0) return false
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  return state.lastPlayDate < yesterday
}
