import { describe, expect, it } from 'vitest'
import { calcStars, calcXP, calcLevel, xpForNextLevel } from './xpCalc'

describe('calcStars', () => {
  it('0 hints → 3 sao', () => expect(calcStars(0)).toBe(3))
  it('1 hint → 2 sao',  () => expect(calcStars(1)).toBe(2))
  it('2 hints → 2 sao', () => expect(calcStars(2)).toBe(2))
  it('3 hints → 1 sao', () => expect(calcStars(3)).toBe(1))
  it('10 hints → 1 sao', () => expect(calcStars(10)).toBe(1))
})

describe('calcXP', () => {
  it('ch1 m1 3 sao', () => expect(calcXP(1, 1, 3)).toBe(Math.round((100 + 20) * 1.5)))
  it('ch1 m1 2 sao', () => expect(calcXP(1, 1, 2)).toBe(Math.round((100 + 20) * 1.0)))
  it('ch1 m1 1 sao', () => expect(calcXP(1, 1, 1)).toBe(Math.round((100 + 20) * 0.7)))
  it('ch14 m15 3 sao', () => expect(calcXP(14, 15, 3)).toBe(Math.round((1400 + 300) * 1.5)))
})

describe('calcLevel', () => {
  it('0 XP → level 1', () => expect(calcLevel(0)).toBe(1))
  it('999 XP → level 1', () => expect(calcLevel(999)).toBe(1))
  it('1000 XP → level 2', () => expect(calcLevel(1000)).toBe(2))
  it('99000 XP → level 99', () => expect(calcLevel(99000)).toBe(99))
  it('200000 XP → level 99 (cap)', () => expect(calcLevel(200000)).toBe(99))
})

describe('xpForNextLevel', () => {
  it('level 1 cần 1000 XP', () => expect(xpForNextLevel(1)).toBe(1000))
  it('level 5 cần 6000 XP', () => expect(xpForNextLevel(5)).toBe(6000))
})
