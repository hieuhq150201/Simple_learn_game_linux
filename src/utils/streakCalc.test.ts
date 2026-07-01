import { describe, expect, it } from 'vitest'
import { updateStreak, getStreakBroken } from './streakCalc'

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)

describe('updateStreak', () => {
  it('lần đầu chơi → streak 1', () => {
    const result = updateStreak({ currentStreak: 0, lastPlayDate: '' })
    expect(result).toEqual({ currentStreak: 1, lastPlayDate: today })
  })

  it('chơi ngày hôm nay rồi → không thay đổi', () => {
    const state = { currentStreak: 3, lastPlayDate: today }
    expect(updateStreak(state)).toEqual(state)
  })

  it('chơi hôm qua → tăng streak', () => {
    const result = updateStreak({ currentStreak: 4, lastPlayDate: yesterday })
    expect(result).toEqual({ currentStreak: 5, lastPlayDate: today })
  })

  it('bỏ 2 ngày → reset về 1', () => {
    const result = updateStreak({ currentStreak: 10, lastPlayDate: twoDaysAgo })
    expect(result).toEqual({ currentStreak: 1, lastPlayDate: today })
  })
})

describe('getStreakBroken', () => {
  it('bỏ 2 ngày → broken', () =>
    expect(getStreakBroken({ currentStreak: 5, lastPlayDate: twoDaysAgo })).toBe(true))
  it('chơi hôm qua → không broken', () =>
    expect(getStreakBroken({ currentStreak: 5, lastPlayDate: yesterday })).toBe(false))
  it('streak 0 → không broken', () =>
    expect(getStreakBroken({ currentStreak: 0, lastPlayDate: twoDaysAgo })).toBe(false))
})
