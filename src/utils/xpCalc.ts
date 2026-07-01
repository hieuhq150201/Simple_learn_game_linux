export type Stars = 1 | 2 | 3

export function calcStars(hintsUsed: number): Stars {
  if (hintsUsed === 0) return 3
  if (hintsUsed <= 2) return 2
  return 1
}

export function calcXP(chapterId: number, missionId: number, stars: Stars): number {
  const base = chapterId * 100 + missionId * 20
  const multiplier = stars === 3 ? 1.5 : stars === 2 ? 1.0 : 0.7
  return Math.round(base * multiplier)
}

export function calcLevel(totalXP: number): number {
  return Math.min(99, Math.floor(totalXP / 1000) + 1)
}

export function xpForNextLevel(level: number): number {
  if (level === 1) return 1000
  return (level + 1) * 1000
}
