# Mission UX & Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign màn hình làm bài với icon toolbar, Lottie animations, XP/star/streak gamification và local leaderboard multi-profile.

**Architecture:** Data layer (xpCalc + streakCalc utils + extended useProgress) được xây trước; Mission UI và Achievement components song song sau đó; Leaderboard độc lập sau khi data layer xong. App.tsx wire tất cả ở cuối.

**Tech Stack:** React 18, Next.js 15 App Router, TypeScript, Tailwind CSS + hp-* tokens, Vitest, lottie-react (new dep), Playwright

## Global Constraints

- Tất cả client components phải có `'use client'` ở đầu file
- Màu dùng semantic tokens: `text-hp-fg`, `bg-hp-card`, `border-hp-border`, `text-hp-muted`, `text-hp-subtle` — KHÔNG hardcode dark color
- KHÔNG dùng "mày/tao" trong bất kỳ copy text nào
- Lottie load bằng `dynamic(() => import('lottie-react'), { ssr: false })`
- `prefers-reduced-motion`: tắt Lottie + CSS keyframe animation, giữ transition nhẹ
- Backward-compatible: localStorage thiếu field mới → fallback về 0/default
- Test command: `npx vitest run` — phải pass trước khi commit
- Build command: `npm run build` — phải pass

---

## File Map

**Tạo mới:**
- `src/utils/xpCalc.ts` — pure functions: calcXP, calcLevel, calcStars
- `src/utils/streakCalc.ts` — pure functions: updateStreak, getStreakBroken
- `src/utils/xpCalc.test.ts` — Vitest unit tests
- `src/utils/streakCalc.test.ts` — Vitest unit tests
- `src/components/Mission/SlidePanel.tsx` — generic slide-in overlay panel
- `src/components/Mission/IconToolbar.tsx` — 3 icon buttons toggle slide panels
- `src/components/Achievement/StarRating.tsx` — 3 sao animate lần lượt
- `src/components/Achievement/XPBar.tsx` — thanh XP fill + level badge + count-up
- `src/components/Achievement/StreakBadge.tsx` — 🔥 N ngày, animate vỡ khi mất streak
- `src/components/Leaderboard/LeaderboardTable.tsx` — bảng xếp hạng
- `src/components/Leaderboard/ProfileSwitcher.tsx` — dropdown đổi profile
- `src/app/(protected)/leaderboard/page.tsx` — màn leaderboard
- `public/lottie/confetti-gold.json` — download từ LottieFiles
- `public/lottie/confetti-green.json` — download từ LottieFiles
- `public/lottie/thinking.json` — download từ LottieFiles
- `public/lottie/facepalm.json` — download từ LottieFiles
- `public/lottie/skull.json` — download từ LottieFiles

**Sửa:**
- `src/hooks/useProgress.ts` — extend ProgressState + completeMission signature
- `src/components/Mission/MissionPanel.tsx` — dùng IconToolbar, bỏ inline panels
- `src/components/Mission/MissionProgress.tsx` — thêm progress bar + star target
- `src/components/Mission/HintSystem.tsx` — rewrite 5 trạng thái
- `src/components/Achievement/MissionCompleteModal.tsx` — rewrite với Lottie + XP
- `src/App.tsx` — wire MissionCompleteModal, XP, streak, ProfileSwitcher
- `src/app/globals.css` — thêm CSS keyframes mới (shake, star-pop, xp-count)

---

## Task 1: Setup — Dependencies, Lottie Files, CSS Keyframes

**Files:**
- Modify: `package.json` (dep lottie-react)
- Modify: `src/app/globals.css`
- Create: `public/lottie/*.json` (5 files)

**Interfaces:**
- Produces: `lottie-react` available to import; CSS classes `animate-shake`, `animate-star-pop`, `animate-streak-break`

- [ ] **Step 1: Cài lottie-react**

```bash
cd /Users/dino/Documents/projects/game
npm install lottie-react
```

Expected: `lottie-react` xuất hiện trong `package.json` dependencies.

- [ ] **Step 2: Tải Lottie JSON files**

Vào [lottiefiles.com](https://lottiefiles.com), tìm và tải về các animation free (chọn file JSON <150KB):
- Search "confetti explosion" → lưu `public/lottie/confetti-gold.json`
- Search "confetti green" → lưu `public/lottie/confetti-green.json`
- Search "thinking man" → lưu `public/lottie/thinking.json`
- Search "facepalm" → lưu `public/lottie/facepalm.json`
- Search "skull" hoặc "game over" → lưu `public/lottie/skull.json`

Verify: `ls public/lottie/` hiện đủ 5 file `.json`.

- [ ] **Step 3: Thêm CSS keyframes vào globals.css**

Mở `src/app/globals.css`, thêm vào cuối file:

```css
/* Animation keyframes cho gamification */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

@keyframes star-pop {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  70%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes streak-break {
  0%   { transform: scale(1); opacity: 1; }
  30%  { transform: scale(1.15); }
  60%  { transform: scale(0.8) rotate(10deg); opacity: 0.6; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes xp-fill {
  from { width: var(--xp-from); }
  to   { width: var(--xp-to); }
}

@media (prefers-reduced-motion: reduce) {
  .animate-shake,
  .animate-star-pop,
  .animate-streak-break {
    animation: none !important;
  }
}
```

- [ ] **Step 4: Đăng ký animation trong tailwind.config.js**

Mở `tailwind.config.js`, trong `extend.keyframes` thêm:

```js
shake:          { '0%, 100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-6px)' }, '40%': { transform: 'translateX(6px)' }, '60%': { transform: 'translateX(-4px)' }, '80%': { transform: 'translateX(4px)' } },
'star-pop':     { '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' }, '70%': { transform: 'scale(1.25) rotate(5deg)', opacity: '1' }, '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
'streak-break': { '0%': { transform: 'scale(1)', opacity: '1' }, '30%': { transform: 'scale(1.15)' }, '60%': { transform: 'scale(0.8) rotate(10deg)', opacity: '0.6' }, '100%': { transform: 'scale(0)', opacity: '0' } },
```

Trong `extend.animation` thêm:

```js
'shake':         'shake 0.4s ease-in-out',
'star-pop':      'star-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
'streak-break':  'streak-break 0.6s ease-in forwards',
```

- [ ] **Step 5: Verify build không lỗi**

```bash
npm run build
```

Expected: build thành công, không có TypeScript error.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json public/lottie/ src/app/globals.css tailwind.config.js
git commit -m "feat(setup): thêm lottie-react, Lottie JSON files, CSS keyframes gamification"
```

---

## Task 2: Pure Utility Functions — xpCalc + streakCalc

**Files:**
- Create: `src/utils/xpCalc.ts`
- Create: `src/utils/streakCalc.ts`
- Create: `src/utils/xpCalc.test.ts`
- Create: `src/utils/streakCalc.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // xpCalc.ts
  export type Stars = 1 | 2 | 3
  export function calcStars(hintsUsed: number): Stars
  export function calcXP(chapterId: number, missionId: number, stars: Stars): number
  export function calcLevel(totalXP: number): number
  export function xpForNextLevel(level: number): number

  // streakCalc.ts
  export interface StreakState { currentStreak: number; lastPlayDate: string }
  export function updateStreak(state: StreakState): StreakState
  export function getStreakBroken(state: StreakState): boolean
  ```

- [ ] **Step 1: Viết failing tests cho xpCalc**

Tạo `src/utils/xpCalc.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test — phải FAIL**

```bash
npx vitest run src/utils/xpCalc.test.ts
```

Expected: FAIL "Cannot find module './xpCalc'"

- [ ] **Step 3: Implement xpCalc.ts**

Tạo `src/utils/xpCalc.ts`:

```ts
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
  return level * 1000
}
```

- [ ] **Step 4: Chạy test — phải PASS**

```bash
npx vitest run src/utils/xpCalc.test.ts
```

Expected: tất cả PASS.

- [ ] **Step 5: Viết failing tests cho streakCalc**

Tạo `src/utils/streakCalc.test.ts`:

```ts
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
```

- [ ] **Step 6: Chạy test — phải FAIL**

```bash
npx vitest run src/utils/streakCalc.test.ts
```

Expected: FAIL "Cannot find module './streakCalc'"

- [ ] **Step 7: Implement streakCalc.ts**

Tạo `src/utils/streakCalc.ts`:

```ts
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
```

- [ ] **Step 8: Chạy toàn bộ test — phải PASS**

```bash
npx vitest run
```

Expected: tất cả test file pass.

- [ ] **Step 9: Commit**

```bash
git add src/utils/xpCalc.ts src/utils/xpCalc.test.ts src/utils/streakCalc.ts src/utils/streakCalc.test.ts
git commit -m "feat(utils): xpCalc + streakCalc với unit tests"
```

---

## Task 3: Extend useProgress.ts — XP, Level, Streak, Stars

**Files:**
- Modify: `src/hooks/useProgress.ts`

**Interfaces:**
- Consumes: `calcXP`, `calcLevel`, `calcStars`, `Stars` từ `./xpCalc`; `updateStreak`, `getStreakBroken`, `StreakState` từ `./streakCalc`
- Produces:
  ```ts
  interface MissionRecord {
    completedAt: number
    usedHint: boolean
    stars: Stars         // NEW
    xpEarned: number     // NEW
  }

  // useProgress() returns thêm:
  {
    xp: number
    level: number
    currentStreak: number
    streakBroken: boolean   // true nếu mất streak từ lần trước
    getMissionStars: (chapterId: number, missionId: number) => Stars | null
    completeMission: (chapterId, missionId, { usedHint, hintsUsed }: { usedHint?: boolean; hintsUsed?: number }) => void
  }
  ```

- [ ] **Step 1: Rewrite useProgress.ts**

Thay toàn bộ nội dung `src/hooks/useProgress.ts`:

```ts
'use client'
import { useCallback, useState } from 'react'
import { badges, isBadgeUnlocked } from '../data/badges.js'
import { chapters } from '../data/chapters.js'
import { calcXP, calcLevel, calcStars, type Stars } from '../utils/xpCalc'
import { updateStreak, getStreakBroken, type StreakState } from '../utils/streakCalc'

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
```

- [ ] **Step 2: Update App.tsx — truyền hintsUsed vào completeMission**

Mở `src/App.tsx`, tìm dòng gọi `progress.completeMission`:

```ts
// TRƯỚC:
onMissionComplete: ({ usedHint }) => {
  progress.completeMission(chapter.id, mission.id, { usedHint });
```

Sửa thành:

```ts
// SAU:
onMissionComplete: ({ usedHint }) => {
  progress.completeMission(chapter.id, mission.id, { usedHint, hintsUsed: hintsUsedCount });
```

Lưu ý: `hintsUsedCount` đã được tính sẵn trong `MissionScreen` ở ngay trên dòng này.

- [ ] **Step 3: Chạy build kiểm tra TypeScript**

```bash
npm run build
```

Expected: build pass, không TypeScript error.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useProgress.ts src/App.tsx
git commit -m "feat(progress): extend useProgress với XP, level, streak, stars per mission"
```

---

## Task 4: SlidePanel + IconToolbar Components

**Files:**
- Create: `src/components/Mission/SlidePanel.tsx`
- Create: `src/components/Mission/IconToolbar.tsx`

**Interfaces:**
- Produces:
  ```ts
  // SlidePanel.tsx
  interface SlidePanelProps {
    open: boolean
    title: string
    onClose: () => void
    children: React.ReactNode
  }
  export default function SlidePanel(props: SlidePanelProps): JSX.Element

  // IconToolbar.tsx
  type PanelKey = 'terms' | 'debrief' | 'commands'
  interface IconToolbarProps {
    activePanel: PanelKey | null
    onToggle: (key: PanelKey) => void
    hasTerms: boolean
    hasDebrief: boolean
  }
  export default function IconToolbar(props: IconToolbarProps): JSX.Element
  ```

- [ ] **Step 1: Tạo SlidePanel.tsx**

```tsx
'use client'
import { useEffect } from 'react'

interface SlidePanelProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function SlidePanel({ open, title, onClose, children }: SlidePanelProps): JSX.Element {
  // Đóng khi bấm Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-[320px] z-40 flex flex-col bg-hp-card border-l border-hp-border shadow-2xl transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-hp-border shrink-0">
          <span className="text-hp-fg font-semibold text-sm">{title}</span>
          <button
            onClick={onClose}
            className="text-hp-subtle hover:text-hp-fg text-xl leading-none"
            aria-label="Đóng panel"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Tạo IconToolbar.tsx**

```tsx
'use client'

type PanelKey = 'terms' | 'debrief' | 'commands'

interface IconToolbarProps {
  activePanel: PanelKey | null
  onToggle: (key: PanelKey) => void
  hasTerms: boolean
  hasDebrief: boolean
}

const BUTTONS: { key: PanelKey; label: string; icon: string; title: string }[] = [
  { key: 'terms',    label: '📚', icon: '📚', title: 'Thuật ngữ' },
  { key: 'debrief',  label: '🧠', icon: '🧠', title: 'Phân tích kỹ thuật' },
  { key: 'commands', label: '⌨',  icon: '⌨',  title: 'Lệnh cơ bản' },
]

export default function IconToolbar({ activePanel, onToggle, hasTerms, hasDebrief }: IconToolbarProps): JSX.Element {
  return (
    <div className="flex items-center gap-1 border-t border-b border-hp-border py-1.5">
      {BUTTONS.map(({ key, label, title }) => {
        if (key === 'terms' && !hasTerms) return null
        if (key === 'debrief' && !hasDebrief) return null
        const active = activePanel === key
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            title={title}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              active
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                : 'text-hp-muted hover:text-hp-fg hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
            }`}
          >
            <span>{label}</span>
            <span className="hidden sm:inline">{title}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Build kiểm tra**

```bash
npm run build
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/Mission/SlidePanel.tsx src/components/Mission/IconToolbar.tsx
git commit -m "feat(mission): SlidePanel + IconToolbar components"
```

---

## Task 5: MissionProgress Refactor — Progress Bar + Star Target

**Files:**
- Modify: `src/components/Mission/MissionProgress.tsx`

**Interfaces:**
- Consumes: `Steps[]`, `completedSteps: Set<string>`, `starTarget?: Stars | null` (sao đã đạt được nếu mission đã xong)
- Produces: component hiển thị checklist + progress bar + 3 ngôi sao

- [ ] **Step 1: Rewrite MissionProgress.tsx**

```tsx
'use client'
import type { Stars } from '../../utils/xpCalc'

interface MissionStep {
  id: string
  description: string
}

interface MissionProgressProps {
  steps: MissionStep[]
  completedSteps: Set<string>
  starTarget?: Stars | null
}

export default function MissionProgress({ steps, completedSteps, starTarget }: MissionProgressProps): JSX.Element {
  const doneCount = steps.filter((s) => completedSteps.has(s.id)).length
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div className="flex flex-col gap-2">
      {/* Checklist */}
      <ul className="flex flex-col gap-1.5">
        {steps.map((step) => {
          const done = completedSteps.has(step.id)
          return (
            <li key={step.id} className={`flex items-start gap-2 text-sm ${done ? 'text-green-500 dark:text-green-400' : 'text-hp-muted'}`}>
              <span className="shrink-0 font-mono">{done ? '[✓]' : '[ ]'}</span>
              <span>{step.description}</span>
            </li>
          )
        })}
      </ul>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-hp-border">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-hp-subtle text-[10px] font-mono shrink-0">{doneCount}/{steps.length}</span>
      </div>

      {/* Star target — hiện khi mission đã xong */}
      {starTarget != null && (
        <div className="flex items-center gap-1 justify-end">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`text-base transition-opacity ${n <= starTarget ? 'opacity-100' : 'opacity-20'}`}
            >
              ⭐
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build kiểm tra**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Mission/MissionProgress.tsx
git commit -m "feat(mission): MissionProgress thêm progress bar + star display"
```

---

## Task 6: HintSystem Rewrite — 5 Escalating States

**Files:**
- Modify: `src/components/Mission/HintSystem.tsx`

**Interfaces:**
- Consumes: `onRequestHint: () => void`, `hintsUsedCount: number`, `maxHints: number`
- Produces: component với 5 trạng thái, Lottie lazy-loaded

- [ ] **Step 1: Rewrite HintSystem.tsx**

```tsx
'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface HintSystemProps {
  onRequestHint: () => void
  hintsUsedCount: number
  maxHints: number
}

type HintState = 'fresh' | 'encouraged' | 'curious' | 'last' | 'locked'

function getHintState(used: number, max: number): HintState {
  if (used >= max) return 'locked'
  if (used === 0) return 'fresh'
  if (used === 1) return 'encouraged'
  if (used === max - 1) return 'last'
  return 'curious'
}

const STATE_CONFIG: Record<HintState, {
  emoji: string
  lottieFile?: string
  lottieSize: number
  text: string
  subtext?: string
  btnLabel: string
  btnClass: string
  boxClass: string
}> = {
  fresh: {
    emoji: '💡',
    lottieSize: 0,
    text: 'Bí rồi à? Không sao — gợi ý đây.',
    btnLabel: 'Xem gợi ý đầu tiên',
    btnClass: 'border-yellow-400/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-400/10',
    boxClass: 'border-yellow-400/20',
  },
  encouraged: {
    emoji: '💪',
    lottieSize: 0,
    text: 'Ổn thôi, nhưng thật ra đang rất gần rồi đó.',
    subtext: 'Thử thêm một lần nữa trước khi đọc nhé?',
    btnLabel: 'Xem gợi ý tiếp theo',
    btnClass: 'border-green-400/40 text-green-600 dark:text-green-400 hover:bg-green-400/10',
    boxClass: 'border-green-400/20',
  },
  curious: {
    emoji: '🤔',
    lottieFile: '/lottie/thinking.json',
    lottieSize: 44,
    text: 'Gợi ý thứ 2 rồi đó. Không phán xét —',
    subtext: 'nhưng đáp án đang ở ngay trước mặt thôi.',
    btnLabel: 'Xem gợi ý tiếp theo',
    btnClass: 'border-orange-400/40 text-orange-600 dark:text-orange-400 hover:bg-orange-400/10',
    boxClass: 'border-orange-400/20',
  },
  last: {
    emoji: '😏',
    lottieFile: '/lottie/facepalm.json',
    lottieSize: 52,
    text: 'Gợi ý cuối đây. Tin là sau lần này sẽ hiểu —',
    subtext: 'vì đơn giản là không còn lần nào nữa đâu 😄',
    btnLabel: 'Gợi ý cuối — và là cuối thật',
    btnClass: 'border-red-400/40 text-red-500 dark:text-red-400 hover:bg-red-400/10',
    boxClass: 'border-red-400/20',
  },
  locked: {
    emoji: '☠️',
    lottieFile: '/lottie/skull.json',
    lottieSize: 52,
    text: 'Hết hint rồi. Nhưng đáp án vẫn đang nằm',
    subtext: 'ngay trong terminal — chỉ cần nhìn lại thôi. Hacker thật không bỏ cuộc đâu 👀',
    btnLabel: 'Đã dùng hết hint',
    btnClass: 'opacity-40 cursor-not-allowed border-hp-border text-hp-subtle',
    boxClass: 'border-hp-border',
  },
}

export default function HintSystem({ onRequestHint, hintsUsedCount, maxHints }: HintSystemProps): JSX.Element {
  const [animating, setAnimating] = useState(false)
  const [lottieData, setLottieData] = useState<Record<string, unknown> | null>(null)

  const state = getHintState(hintsUsedCount, maxHints)
  const cfg = STATE_CONFIG[state]

  // Lazy load Lottie JSON khi cần
  const loadLottie = async (file: string) => {
    try {
      const res = await fetch(file)
      const data = await res.json()
      setLottieData(data)
    } catch { /* fallback to emoji */ }
  }

  function handleHint() {
    if (state === 'locked') return
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)
    if (cfg.lottieFile) loadLottie(cfg.lottieFile)
    onRequestHint()
  }

  return (
    <div className={`rounded-md border p-3 flex flex-col gap-2 transition-colors ${cfg.boxClass} ${animating ? 'animate-shake' : ''}`}>
      <div className="flex items-start gap-2">
        {cfg.lottieFile && lottieData ? (
          <div style={{ width: cfg.lottieSize, height: cfg.lottieSize, flexShrink: 0 }}>
            <Lottie animationData={lottieData} loop style={{ width: cfg.lottieSize, height: cfg.lottieSize }} />
          </div>
        ) : (
          <span className="text-lg shrink-0">{cfg.emoji}</span>
        )}
        <div>
          <p className="text-hp-fg text-xs leading-relaxed">{cfg.text}</p>
          {cfg.subtext && <p className="text-hp-muted text-xs leading-relaxed">{cfg.subtext}</p>}
        </div>
      </div>

      {/* Progress bar hints */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-0.5">
          {Array.from({ length: maxHints }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < hintsUsedCount ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <span className="text-hp-subtle text-[10px] font-mono shrink-0">{hintsUsedCount}/{maxHints}</span>
      </div>

      <button
        onClick={handleHint}
        disabled={state === 'locked'}
        className={`w-full py-1.5 rounded border text-xs font-mono transition-colors ${cfg.btnClass}`}
      >
        {cfg.btnLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Build kiểm tra**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Mission/HintSystem.tsx
git commit -m "feat(mission): HintSystem rewrite — 5 trạng thái leo thang + Lottie inline"
```

---

## Task 7: MissionPanel Refactor — Icon Toolbar, Slide Panels

**Files:**
- Modify: `src/components/Mission/MissionPanel.tsx`

**Interfaces:**
- Consumes: thêm `missionStars?: Stars | null` prop
- Produces: sidebar dùng `IconToolbar` + `SlidePanel`, bỏ inline `TermsPanel`/`DebriefPanel`

- [ ] **Step 1: Rewrite MissionPanel.tsx**

```tsx
'use client'
import { useState } from 'react'
import MissionProgress from './MissionProgress'
import HintSystem from './HintSystem'
import DebriefPanel from './DebriefPanel'
import TermsPanel from './TermsPanel'
import CommandCheatsheet from './CommandCheatsheet'
import SlidePanel from './SlidePanel'
import IconToolbar from './IconToolbar'
import type { Stars } from '../../utils/xpCalc'

type PanelKey = 'terms' | 'debrief' | 'commands'

interface MissionPanelProps {
  mission: any
  completedSteps: Set<string>
  hintsUsedCount: number
  onRequestHint: () => void
  missionCompleted: boolean
  missionStars?: Stars | null
  onNextMission?: () => void
  onBackToMap?: () => void
}

export default function MissionPanel({
  mission, completedSteps, hintsUsedCount, onRequestHint,
  missionCompleted, missionStars, onNextMission, onBackToMap,
}: MissionPanelProps): JSX.Element {
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null)

  function togglePanel(key: PanelKey) {
    setActivePanel((prev) => (prev === key ? null : key))
  }

  return (
    <div className="relative flex flex-col lg:h-full border border-hp-border rounded-lg bg-hp-card lg:overflow-hidden">
      {/* Main scrollable content */}
      <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
        {/* Mission header */}
        <div>
          <h2 className="text-indigo-400 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
            Mission {mission.id}
          </h2>
          <h3 className="text-hp-fg font-semibold mt-1">{mission.title}</h3>
        </div>

        <p className="text-hp-muted text-sm leading-relaxed">{mission.story}</p>

        <div>
          <h4 className="text-hp-subtle text-[10px] uppercase tracking-wide mb-2">Checklist</h4>
          <MissionProgress
            steps={mission.steps}
            completedSteps={completedSteps}
            starTarget={missionCompleted ? missionStars : null}
          />
        </div>

        {/* Icon toolbar */}
        <IconToolbar
          activePanel={activePanel}
          onToggle={togglePanel}
          hasTerms={Boolean(mission.terms?.length)}
          hasDebrief={missionCompleted && Boolean(mission.debrief?.length)}
        />

        {/* Hint / completion */}
        {missionCompleted ? (
          <div className="animate-celebrate-in border border-green-400/40 rounded-md p-3 text-center">
            <p className="text-green-500 dark:text-green-400 font-semibold text-sm">
              Mission hoàn thành! 🎉
            </p>
            <div className="flex flex-col gap-2 mt-3">
              {onNextMission && (
                <button
                  onClick={onNextMission}
                  className="text-sm text-white bg-green-600 hover:bg-green-500 rounded-md py-2 font-semibold transition-colors"
                >
                  Mission tiếp theo →
                </button>
              )}
              {onBackToMap && (
                <button
                  onClick={onBackToMap}
                  className="text-sm text-hp-fg border border-hp-border hover:border-indigo-400/60 rounded-md py-2 transition-colors"
                >
                  Về bản đồ chương
                </button>
              )}
            </div>
          </div>
        ) : mission.noHints ? (
          <p className="text-hp-muted text-xs text-center py-2 border border-hp-border rounded-md">
            ☠ Elite — tự lực 100%, không có hint.
          </p>
        ) : (
          <HintSystem
            onRequestHint={onRequestHint}
            hintsUsedCount={hintsUsedCount}
            maxHints={mission.hints?.length ?? 3}
          />
        )}
      </div>

      {/* Slide panels — overlay trên terminal */}
      <SlidePanel open={activePanel === 'terms'} title="📚 Thuật ngữ" onClose={() => setActivePanel(null)}>
        <TermsPanel terms={mission.terms} />
      </SlidePanel>
      <SlidePanel open={activePanel === 'debrief'} title="🧠 Phân tích kỹ thuật" onClose={() => setActivePanel(null)}>
        <DebriefPanel debrief={mission.debrief} />
      </SlidePanel>
      <SlidePanel open={activePanel === 'commands'} title="⌨ Lệnh cơ bản" onClose={() => setActivePanel(null)}>
        <CommandCheatsheet embedded />
      </SlidePanel>
    </div>
  )
}
```

- [ ] **Step 2: Thêm prop `embedded` cho CommandCheatsheet**

Mở `src/components/Mission/CommandCheatsheet.tsx`, thêm prop `embedded?: boolean`:

```tsx
export default function CommandCheatsheet({ embedded = false }: { embedded?: boolean }): JSX.Element {
  const [open, setOpen] = useState(embedded) // embedded thì mở sẵn

  if (embedded) {
    // Trong slide panel: hiển thị thẳng, không có accordion
    return (
      <ul className="space-y-2">
        {COMMANDS.map(({ cmd, desc }) => (
          <li key={cmd} className="flex gap-2 text-xs leading-relaxed">
            <code className="shrink-0 font-mono text-green-600 dark:text-green-400">{cmd}</code>
            <span className="text-hp-muted">{desc}</span>
          </li>
        ))}
      </ul>
    )
  }

  // Standalone (không dùng nữa nhưng giữ để backward compat)
  return (
    <div className="border border-hp-border rounded-lg bg-hp-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-hp-fg transition-colors hover:text-indigo-400"
      >
        <span>⌨ Lệnh cơ bản</span>
        <span className="text-xs text-hp-subtle">{open ? 'Đóng ▲' : 'Mở ▼'}</span>
      </button>
      {open && (
        <ul className="max-h-64 overflow-y-auto border-t border-hp-border px-3 py-2 space-y-1.5">
          {COMMANDS.map(({ cmd, desc }) => (
            <li key={cmd} className="flex gap-2 text-xs leading-relaxed">
              <code className="shrink-0 font-mono text-green-600 dark:text-green-400">{cmd}</code>
              <span className="text-hp-muted">{desc}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Xóa CommandCheatsheet khỏi App.tsx layout**

Mở `src/App.tsx`, tìm và xóa dòng:
```tsx
import CommandCheatsheet from './components/Mission/CommandCheatsheet';
```
và trong JSX xóa:
```tsx
<CommandCheatsheet />
```
(phần `<div className="flex flex-col gap-3 min-h-0">` không còn cần CommandCheatsheet bên dưới nữa — nó đã vào trong SlidePanel)

- [ ] **Step 4: Build kiểm tra**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Mission/MissionPanel.tsx src/components/Mission/CommandCheatsheet.tsx src/App.tsx
git commit -m "feat(mission): MissionPanel dùng IconToolbar + SlidePanel, bỏ inline panels"
```

---

## Task 8: StarRating + XPBar + StreakBadge Components

**Files:**
- Create: `src/components/Achievement/StarRating.tsx`
- Create: `src/components/Achievement/XPBar.tsx`
- Create: `src/components/Achievement/StreakBadge.tsx`

**Interfaces:**
- Produces:
  ```ts
  // StarRating.tsx
  export default function StarRating({ count, animate }: { count: Stars; animate?: boolean }): JSX.Element

  // XPBar.tsx
  export default function XPBar({ xp, level, xpEarned }: { xp: number; level: number; xpEarned: number }): JSX.Element

  // StreakBadge.tsx
  export default function StreakBadge({ streak, broken }: { streak: number; broken?: boolean }): JSX.Element
  ```

- [ ] **Step 1: Tạo StarRating.tsx**

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { Stars } from '../../utils/xpCalc'

export default function StarRating({ count, animate = false }: { count: Stars; animate?: boolean }): JSX.Element {
  const [visible, setVisible] = useState(animate ? 0 : count)

  useEffect(() => {
    if (!animate) return
    const timers = [1, 2, 3].map((n) =>
      setTimeout(() => setVisible(n as Stars), (n - 1) * 300 + 300)
    )
    return () => timers.forEach(clearTimeout)
  }, [animate, count])

  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-2xl transition-all duration-200 ${
            n <= visible ? 'animate-star-pop opacity-100' : 'opacity-10 scale-75'
          }`}
          style={{ animationDelay: animate ? `${(n - 1) * 0.3}s` : '0s' }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Tạo XPBar.tsx**

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { xpForNextLevel, calcLevel } from '../../utils/xpCalc'

export default function XPBar({ xp, level, xpEarned }: { xp: number; level: number; xpEarned: number }): JSX.Element {
  const prevXP = xp - xpEarned
  const nextLevelXP = xpForNextLevel(level)
  const prevLevelXP = xpForNextLevel(level - 1)
  const rangeXP = nextLevelXP - prevLevelXP

  const prevPct = Math.min(100, Math.round(((prevXP - prevLevelXP) / rangeXP) * 100))
  const newPct  = Math.min(100, Math.round(((xp - prevLevelXP) / rangeXP) * 100))

  const countRef = useRef<HTMLSpanElement>(null)
  const [barPct, setBarPct] = useState(prevPct)

  useEffect(() => {
    // Count-up animation
    const target = xpEarned
    let current = 0
    const step = Math.ceil(target / 30)
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      if (countRef.current) countRef.current.textContent = `+${current}`
      if (current >= target) clearInterval(timer)
    }, 25)

    // Bar fill animation (delay 200ms)
    const fillTimer = setTimeout(() => setBarPct(newPct), 200)

    return () => { clearInterval(timer); clearTimeout(fillTimer) }
  }, [xpEarned, newPct])

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-yellow-500 dark:text-yellow-400 font-bold">
          ⚡ <span ref={countRef}>+0</span> XP
        </span>
        <span className="text-hp-subtle">Lv.{level} · {xp.toLocaleString()} XP</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-hp-border">
        <div
          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className="text-hp-subtle text-[10px] font-mono text-right">
        {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP để lên Lv.{level + 1}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Tạo StreakBadge.tsx**

```tsx
'use client'
import { useEffect, useState } from 'react'

export default function StreakBadge({ streak, broken = false }: { streak: number; broken?: boolean }): JSX.Element | null {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (broken && streak > 0) {
      setAnimate(true)
      const t = setTimeout(() => setAnimate(false), 700)
      return () => clearTimeout(t)
    }
  }, [broken, streak])

  if (streak === 0 && !broken) return null

  return (
    <div className={`flex items-center gap-1.5 ${animate ? 'animate-streak-break' : ''}`}>
      <span className="text-lg">🔥</span>
      <span className="font-mono font-bold text-sm text-orange-500 dark:text-orange-400">
        {streak} ngày liên tiếp
      </span>
      {broken && (
        <span className="text-hp-subtle text-xs">(streak đã bị mất)</span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Build kiểm tra**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Achievement/StarRating.tsx src/components/Achievement/XPBar.tsx src/components/Achievement/StreakBadge.tsx
git commit -m "feat(achievement): StarRating, XPBar, StreakBadge components"
```

---

## Task 9: MissionCompleteModal Rewrite — Lottie + Animation Sequence

**Files:**
- Create: `src/components/Achievement/MissionCompleteModal.tsx` (thay thế celebrate box inline trong MissionPanel)

**Interfaces:**
- Consumes: `MissionCompleteModalProps` bên dưới
- Produces: full-screen modal với Lottie confetti + star rating + XP bar

- [ ] **Step 1: Tạo MissionCompleteModal.tsx**

```tsx
'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import StarRating from './StarRating'
import XPBar from './XPBar'
import StreakBadge from './StreakBadge'
import type { Stars } from '../../utils/xpCalc'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface MissionCompleteModalProps {
  missionTitle: string
  stars: Stars
  xp: number
  xpEarned: number
  level: number
  streak: number
  streakBroken: boolean
  onNextMission?: () => void
  onBackToMap: () => void
}

const LOTTIE_MAP: Record<Stars, string | null> = {
  3: '/lottie/confetti-gold.json',
  2: '/lottie/confetti-green.json',
  1: null,
}

export default function MissionCompleteModal({
  missionTitle, stars, xp, xpEarned, level, streak, streakBroken, onNextMission, onBackToMap,
}: MissionCompleteModalProps): JSX.Element {
  const [lottieData, setLottieData] = useState<Record<string, unknown> | null>(null)
  const [showButtons, setShowButtons] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const lottieFile = LOTTIE_MAP[stars]
    if (lottieFile) {
      fetch(lottieFile).then((r) => r.json()).then(setLottieData).catch(() => {})
    }
    // Nút xuất hiện sau 2s
    const t = setTimeout(() => setShowButtons(true), 2000)
    return () => clearTimeout(t)
  }, [stars])

  // Countdown auto-close sau 5s (bắt đầu đếm khi nút xuất hiện)
  useEffect(() => {
    if (!showButtons) return
    if (countdown <= 0) { onBackToMap(); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [showButtons, countdown, onBackToMap])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onBackToMap() }}
    >
      {/* Lottie — full background */}
      {lottieData && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70">
          <Lottie animationData={lottieData} loop={false} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      <div className="relative w-full max-w-sm border border-green-500/40 rounded-xl bg-gray-950 shadow-2xl shadow-green-900/30 animate-celebrate-in flex flex-col items-center gap-5 px-7 py-8">
        <div className="text-center">
          <p className="text-green-400 font-mono text-[10px] tracking-[0.3em] mb-1">MISSION HOÀN THÀNH</p>
          <h2 className="text-white font-bold text-lg leading-snug">{missionTitle}</h2>
        </div>

        <StarRating count={stars} animate />

        <XPBar xp={xp} level={level} xpEarned={xpEarned} />

        <StreakBadge streak={streak} broken={streakBroken} />

        {showButtons ? (
          <div className="flex flex-col gap-2 w-full">
            {onNextMission && (
              <button
                onClick={onNextMission}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-mono font-bold text-sm py-2.5 rounded-lg transition-colors"
              >
                Mission tiếp theo →
              </button>
            )}
            <button
              onClick={onBackToMap}
              className="w-full border border-green-700/50 hover:border-green-500 text-green-400 font-mono text-sm py-2.5 rounded-lg transition-colors"
            >
              Về bản đồ chương <span className="text-hp-subtle text-xs">({countdown}s)</span>
            </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build kiểm tra**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Achievement/MissionCompleteModal.tsx
git commit -m "feat(achievement): MissionCompleteModal với Lottie confetti + XP animation + stars"
```

---

## Task 10: Leaderboard — ProfileSwitcher + Table + Page

**Files:**
- Create: `src/components/Leaderboard/LeaderboardTable.tsx`
- Create: `src/components/Leaderboard/ProfileSwitcher.tsx`
- Create: `src/app/(protected)/leaderboard/page.tsx`
- Modify: `src/components/Layout/Header.tsx` — thêm ProfileSwitcher

**Interfaces:**
- Produces:
  ```ts
  // LeaderboardTable
  interface ProfileEntry { id: string; name: string; xp: number; level: number; currentStreak: number }
  export default function LeaderboardTable({ profiles, activeId }: { profiles: ProfileEntry[]; activeId: string }): JSX.Element

  // ProfileSwitcher
  export default function ProfileSwitcher(): JSX.Element
  ```

- [ ] **Step 1: Tạo LeaderboardTable.tsx**

```tsx
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
```

- [ ] **Step 2: Tạo ProfileSwitcher.tsx**

```tsx
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
```

- [ ] **Step 3: Tạo leaderboard page**

Tạo `src/app/(protected)/leaderboard/page.tsx`:

```tsx
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
      const list: any[] = raw ? JSON.parse(raw) : []
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
```

- [ ] **Step 4: Thêm ProfileSwitcher vào Header**

Mở `src/components/Layout/Header.tsx`, import và thêm `ProfileSwitcher`:

```tsx
import ProfileSwitcher from '@/components/Leaderboard/ProfileSwitcher'
// ...trong JSX, trước NotificationBell:
<ProfileSwitcher />
<NotificationBell />
<ThemeToggle />
```

- [ ] **Step 5: Build kiểm tra**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Leaderboard/ src/app/\(protected\)/leaderboard/ src/components/Layout/Header.tsx
git commit -m "feat(leaderboard): ProfileSwitcher + LeaderboardTable + trang leaderboard"
```

---

## Task 11: Wire App.tsx — MissionCompleteModal + XP Level Header

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `MissionCompleteModal`, `useProgress` (extended), `getMissionStars`, `calcStars`

- [ ] **Step 1: Update App.tsx — thêm MissionCompleteModal + level badge header**

Mở `src/App.tsx`.

**Thêm import:**
```tsx
import MissionCompleteModal from './components/Achievement/MissionCompleteModal'
import { calcStars } from './utils/xpCalc'
```

**Trong `MissionScreen` function, thêm state:**
```tsx
const [showCompleteModal, setShowCompleteModal] = useState(false)
```

**Sửa `onMissionComplete` callback:**
```tsx
onMissionComplete: ({ usedHint }) => {
  progress.completeMission(chapter.id, mission.id, { usedHint, hintsUsed: hintsUsedCount });
  setShowCompleteModal(true);
  onMissionComplete?.();
},
```

**Truyền `missionStars` vào MissionPanel:**
```tsx
<MissionPanel
  mission={mission}
  completedSteps={completedSteps}
  hintsUsedCount={hintsUsedCount}
  missionCompleted={missionCompleted}
  missionStars={progress.getMissionStars(chapter.id, mission.id)}
  onRequestHint={() => handleSubmit('hint')}
  onNextMission={onNextMission ? () => { setShowCompleteModal(false); onNextMission(); } : undefined}
  onBackToMap={onBack}
/>
```

**Thêm MissionCompleteModal render (trong return của MissionScreen, sau div wrapper):**
```tsx
{showCompleteModal && missionCompleted && (
  <MissionCompleteModal
    missionTitle={mission.title}
    stars={calcStars(hintsUsedCount)}
    xp={progress.xp}
    xpEarned={calcXP(chapter.id, mission.id, calcStars(hintsUsedCount))}
    level={progress.level}
    streak={progress.currentStreak}
    streakBroken={progress.streakBroken}
    onNextMission={onNextMission ? () => { setShowCompleteModal(false); onNextMission(); } : undefined}
    onBackToMap={() => { setShowCompleteModal(false); onBack(); }}
  />
)}
```

Cần thêm `calcXP` vào import: `import { calcStars, calcXP } from './utils/xpCalc'`

**Thêm level badge vào Header (trong `App.tsx` render):**

Tìm dòng `<Header title={...} />` và sửa thành:

```tsx
<Header title={activeChapterId ? `Chương ${activeChapterId}` : 'Bản đồ chương'} xp={progress.xp} level={progress.level} />
```

**Cập nhật Header.tsx để nhận prop `xp` + `level`:**

Mở `src/components/Layout/Header.tsx`, sửa interface:
```tsx
interface HeaderProps {
  title: string
  xp?: number
  level?: number
}
```

Trong JSX, trước `<ProfileSwitcher />`:
```tsx
{level != null && (
  <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-yellow-600 dark:text-yellow-500 border border-yellow-600/20 rounded px-1.5 py-0.5">
    Lv.{level} · {xp?.toLocaleString()} XP
  </span>
)}
```

- [ ] **Step 2: Build kiểm tra**

```bash
npm run build
```

- [ ] **Step 3: Chạy toàn bộ tests**

```bash
npx vitest run
```

Expected: tất cả pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/Layout/Header.tsx
git commit -m "feat(app): wire MissionCompleteModal + XP level badge header"
```

---

## Task 12: Playwright Smoke Tests

**Files:**
- Create: `check-ui.mjs` (tạm thời ở project root, xóa sau khi chạy xong)

- [ ] **Step 1: Đảm bảo dev server đang chạy**

```bash
# Terminal riêng:
npm run dev
```

- [ ] **Step 2: Tạo và chạy smoke test script**

Tạo `check-ui.mjs`:

```js
import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';

async function smoke() {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('JS ERROR:', e.message.slice(0, 100)));
  await page.setViewportSize({ width: 1440, height: 900 });

  // Setup: skip welcome, vào chương 1 mission 1
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('hacker-path-seen-welcome', '1');
    localStorage.setItem('theme', 'light');
  });
  await page.reload({ waitUntil: 'load' });

  // Bấm Bắt đầu chương 1
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Bắt đầu'));
    btn?.click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/smoke-01-mission.png' });
  console.log('✓ 01 mission screen loaded');

  // Check: sidebar có IconToolbar
  const toolbar = await page.$('[title="Thuật ngữ"]');
  console.log(toolbar ? '✓ 02 IconToolbar present' : '✗ 02 IconToolbar MISSING');

  // Mở Terms panel
  if (toolbar) {
    await toolbar.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/smoke-02-terms-panel.png' });
    console.log('✓ 03 Terms SlidePanel opened');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Bấm hint 3 lần — test HintSystem states
  for (let i = 1; i <= 3; i++) {
    const hintBtn = await page.$('button[class*="rounded"][class*="border"]:has-text("gợi ý")');
    if (hintBtn) { await hintBtn.click(); await page.waitForTimeout(500); }
    await page.screenshot({ path: `/tmp/smoke-0${i+3}-hint${i}.png` });
    console.log(`✓ 0${i+3} hint ${i} state`);
  }

  // Check dark mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/smoke-07-dark.png' });
  console.log('✓ 07 dark mode');

  // Check leaderboard page
  await page.goto(`${BASE}/leaderboard`, { waitUntil: 'load' });
  await page.screenshot({ path: '/tmp/smoke-08-leaderboard.png' });
  console.log('✓ 08 leaderboard page');

  await browser.close();
  console.log('\nDone. Xem /tmp/smoke-*.png');
}

smoke().catch(console.error);
```

```bash
node check-ui.mjs
```

Expected output:
```
✓ 01 mission screen loaded
✓ 02 IconToolbar present
✓ 03 Terms SlidePanel opened
✓ 04 hint 1 state
✓ 05 hint 2 state
✓ 06 hint 3 state
✓ 07 dark mode
✓ 08 leaderboard page
Done. Xem /tmp/smoke-*.png
```

- [ ] **Step 3: Xem từng screenshot, xác nhận không có JS error**

Mở từng file `/tmp/smoke-*.png` và kiểm tra:
- Mission screen: sidebar có toolbar icons, không bị overflow
- Terms panel: slide vào đúng, có nội dung
- Hint states: text thay đổi đúng theo hint 1/2/3
- Dark mode: màu sắc đúng
- Leaderboard: bảng hiển thị (có thể trống nếu chưa có profile)

- [ ] **Step 4: Xóa script tạm, commit cuối**

```bash
rm check-ui.mjs
npx vitest run
npm run build
```

Expected: tất cả test pass, build clean.

```bash
git add -A
git commit -m "test(smoke): verify mission UX + gamification via Playwright"
```

- [ ] **Step 5: Push**

```bash
git push
```
