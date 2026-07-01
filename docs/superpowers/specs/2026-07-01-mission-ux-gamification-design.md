# Mission UX & Gamification — Design Spec
**Date:** 2026-07-01  
**Status:** Approved  
**Scope:** Redesign màn hình làm bài, thêm hệ thống XP/sao/streak/leaderboard và animation phản hồi

---

## 1. Mục tiêu

Màn hình làm bài hiện tại nhét quá nhiều thông tin vào sidebar 280px (story, checklist, terms, hint, debrief) khiến người dùng dễ bỏ sót nội dung. Mục tiêu:

1. **Tổ chức lại layout** — sidebar tập trung vào task chính, thông tin phụ ẩn sau icon toolbar
2. **Phản hồi cảm xúc** — animation Lottie + CSS khi hoàn thành mission và khi đang bí
3. **Gamification đầy đủ** — XP, star rating, streak, local leaderboard multi-profile

---

## 2. Layout Redesign (Section 1)

### 2.1 Sidebar mới (280px)

```
┌─ sidebar 280px ──────────────────────────┐
│  [← Back]  Chương 1                      │
│  ─────────────────────────────────────── │
│  MISSION 3  ·  ⭐⭐⭐ (target)            │
│  Tìm file log và đọc 50 dòng cuối        │
│                                           │
│  Story text (2-3 dòng)                   │
│                                           │
│  CHECKLIST                                │
│  [✓] Vào /var/log                         │
│  [ ] Đọc 50 dòng cuối                    │
│  [ ] Lưu ra file                          │
│  [████████░░] 1/3 bước                   │
│                                           │
│  ─────────────────────────────────────── │
│  [📚 Terms] [🧠 Debrief] [⌨ Commands]   │
│  ─────────────────────────────────────── │
│  <HintSystem — xem §4>                   │
│                                           │
│  [Mission tiếp theo →]  [Về bản đồ]      │
└──────────────────────────────────────────┘
```

**Thay đổi so với hiện tại:**
- `TermsPanel`, `DebriefPanel`, `CommandCheatsheet` bị **xóa khỏi inline** → ẩn sau icon toolbar
- Thêm **progress bar nhỏ** bên dưới checklist (bước xong / tổng)
- Thêm **3 ngôi sao mờ** cạnh mission title — sáng dần khi đạt (tính lúc complete)

### 2.2 Slide Panel

Khi bấm icon (📚/🧠/⌨), `SlidePanel` trượt vào từ phải đè lên terminal:
- `position: absolute`, `right: 0`, `width: 320px`, `z-index: 40`
- CSS `translate-x` transition 200ms
- Nút ✕ góc trên phải, bấm ngoài cũng đóng
- Chỉ 1 panel mở tại 1 thời điểm

**New components:**
- `SlidePanel.tsx` — wrapper generic nhận `title` + `children`
- `IconToolbar.tsx` — 3 icon button, toggle state `activePanel: 'terms' | 'debrief' | 'commands' | null`

---

## 3. Mission Complete Modal (Section 2)

Full-screen overlay khi `missionCompleted === true`, thay thế celebrate box inline hiện tại.

### 3.1 Layout modal

```
┌─────────────────────────────────────────────┐
│  [Lottie: confetti — loại theo số sao]      │
│                                             │
│          MISSION HOÀN THÀNH!               │
│       <tên mission>                         │
│                                             │
│         ⭐ ⭐ ⭐  (fade-in lần lượt)         │
│                                             │
│   +250 XP   (CSS count-up 0 → 250, 800ms)  │
│   [░░░░░░░████░░░░░] Lv.4 · 1250/2000 XP   │
│                                             │
│   🔥 Streak: 3 ngày liên tiếp              │
│                                             │
│  [Mission tiếp theo →]   [Về bản đồ]       │
│            tự đóng sau 5s                  │
└─────────────────────────────────────────────┘
```

### 3.2 Lottie theo star

| Stars | Lottie file | Mô tả |
|-------|-------------|-------|
| 3 ⭐ | `public/lottie/confetti-gold.json` | Confetti vàng rực, mạnh |
| 2 ⭐ | `public/lottie/confetti-green.json` | Confetti xanh lá, nhẹ hơn |
| 1 ⭐ | CSS animation đơn giản | Không Lottie, tránh over-celebrate |

### 3.3 Star rating logic

```ts
function calcStars(hintsUsed: number): 1 | 2 | 3 {
  if (hintsUsed === 0) return 3
  if (hintsUsed <= 2) return 2
  return 1
}
```

### 3.4 Sequence animation

1. Lottie bắt đầu ngay khi modal mount (0ms)
2. Stars fade-in lần lượt: sao 1 (300ms), sao 2 (600ms), sao 3 (900ms)
3. XP count-up bắt đầu tại 1000ms, duration 800ms
4. XP bar fill tại 1200ms, duration 600ms
5. Streak badge fade-in tại 1600ms
6. Nút tiếp theo xuất hiện tại 2000ms
7. Auto-close countdown bắt đầu sau 2000ms (tổng 5s từ lúc mount)

**New component:** `MissionCompleteModal.tsx` (rewrite từ celebrate box inline)  
**New component:** `StarRating.tsx` — 3 sao với prop `count`, animate  
**New component:** `XPBar.tsx` — thanh XP + level badge + count-up

---

## 4. Struggling State — Escalating Personality (Section 3)

`HintSystem` rewrite thành 5 trạng thái dựa trên `hintsUsedCount`:

| State | hintsUsedCount | Lottie | Tông giọng |
|-------|---------------|--------|------------|
| 0 — Fresh | 0 | — | Neutral, mời thử |
| 1 — Encouraged | 1 | — | CSS bounce, cổ vũ nhẹ |
| 2 — Curious | 2 | `thinking.json` (40px) | Bắt đầu nghi ngờ lịch sự |
| 3 — Last | 3 | `facepalm.json` (48px) | Ngông lịch sự, rõ là hint cuối |
| MAX — Locked | ≥ maxHints | `skull.json` (48px) | Thách thức, không phán xét |

### Copy text (không dùng mày/tao)

**State 0:**
> 💡 Bí rồi à? Không sao — gợi ý đây.

**State 1:**
> 💪 Ổn thôi, nhưng thật ra đang rất gần rồi đó. Thử thêm một lần nữa trước khi đọc nhé?

**State 2 (Lottie thinking):**
> 🤔 Gợi ý thứ 2 rồi đó. Không phán xét — nhưng đáp án đang ở ngay trước mặt thôi.

**State 3 (Lottie facepalm):**
> 😏 Gợi ý cuối đây. Tin là sau lần này sẽ hiểu — vì đơn giản là không còn lần nào nữa đâu 😄

**State MAX (Lottie skull):**
> ☠️ Hết hint rồi. Nhưng đáp án vẫn đang nằm ngay trong terminal — chỉ cần nhìn lại thôi. Hacker thật không bỏ cuộc đâu 👀

### Animation transition

Mỗi lần state thay đổi: box `shake` CSS 0.4s → fade sang state mới.  
Progress bar hint fill bằng CSS `width` transition 300ms.  
Chapter 10 (`noHints: true`): ẩn toàn bộ component, hiện text "☠ Elite — tự lực 100%".

---

## 5. Gamification Layer (Section 4)

### 5.1 XP System

```ts
function calcXP(chapterId: number, missionId: number, stars: 1 | 2 | 3): number {
  const base = chapterId * 100 + missionId * 20
  const multiplier = stars === 3 ? 1.5 : stars === 2 ? 1.0 : 0.7
  return Math.round(base * multiplier)
}

function calcLevel(totalXP: number): number {
  return Math.min(99, Math.floor(totalXP / 1000) + 1)
}
```

Header hiển thị compact: `[Lv.4 ░░░░░█████ 3420 XP]`

### 5.2 Star Rating per Mission

Lưu vào `completedMissions`:
```ts
interface MissionRecord {
  completedAt: number
  usedHint: boolean
  stars: 1 | 2 | 3      // NEW
  xpEarned: number       // NEW
}
```

Replay để cải thiện sao: chỉ update nếu `newStars > existingStars`. XP không cộng thêm khi replay.

### 5.3 Streak

```ts
interface StreakState {
  currentStreak: number
  lastPlayDate: string    // UTC "YYYY-MM-DD"
}

function updateStreak(state: StreakState): StreakState {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (state.lastPlayDate === today) return state
  if (state.lastPlayDate === yesterday)
    return { currentStreak: state.currentStreak + 1, lastPlayDate: today }
  return { currentStreak: 1, lastPlayDate: today }  // reset
}
```

Mất streak → `StreakBadge` hiện animation "vỡ" (CSS keyframe) khi load lại.

### 5.4 Local Leaderboard

```ts
interface Profile {
  id: string
  name: string
  xp: number
  level: number
  currentStreak: number
  completedMissions: Record<string, MissionRecord>
  commandsRun: number
  hintsUsed: number
  createdAt: number
}
```

Lưu tại `hacker-path-profiles` (mảng tối đa 5 profile).  
`hacker-path-active-profile` lưu `id` đang active.

**Màn hình `/leaderboard`:**
```
┌──────────────────────────────────────────┐
│  🏆 BẢNG XẾP HẠNG (thiết bị này)        │
│  ─────────────────────────────────────── │
│  #1  Hacker_Lê      ⭐ 12,450 XP  🔥 7  │
│  #2  root_nguyen    ⭐  8,200 XP  🔥 3  │
│  #3  terminal_girl  ⭐  5,100 XP  🔥 1  │
│                                          │
│  [+ Thêm người chơi]                    │
└──────────────────────────────────────────┘
```

`ProfileSwitcher` trên header (cạnh avatar) — dropdown chọn profile.

### 5.5 localStorage schema

```ts
// key: hacker-path-progress (extend, backward-compatible)
{
  completedMissions: Record<string, MissionRecord>,
  xp: number,              // NEW — default 0
  level: number,           // NEW — default 1
  currentStreak: number,   // NEW — default 0
  lastPlayDate: string,    // NEW — default ""
  commandsRun: number,
  hintsUsed: number,
}

// key: hacker-path-profiles (NEW)
Profile[]

// key: hacker-path-active-profile (NEW)
string  // profile id
```

---

## 6. Kiến trúc & Component Map (Section 5)

### Nhóm 1 — Mission UI (refactor)
```
src/components/Mission/
  MissionPanel.tsx          refactor: icon toolbar thay inline panels
  MissionProgress.tsx       thêm progress bar + star target
  HintSystem.tsx            rewrite: 5 trạng thái + Lottie inline
  SlidePanel.tsx            NEW
  IconToolbar.tsx           NEW
```

### Nhóm 2 — Achievement & Feedback
```
src/components/Achievement/
  MissionCompleteModal.tsx  rewrite từ celebrate box
  StarRating.tsx            NEW
  XPBar.tsx                 NEW
  StreakBadge.tsx           NEW
  TrophyIcon.tsx            giữ nguyên
  ChapterCompleteModal.tsx  giữ nguyên
```

### Nhóm 3 — Gamification Data
```
src/hooks/useProgress.ts    extend: xp, level, streak, stars
src/utils/xpCalc.ts         NEW
src/utils/streakCalc.ts     NEW
```

### Nhóm 4 — Leaderboard
```
src/app/(protected)/leaderboard/page.tsx   NEW
src/components/Leaderboard/
  LeaderboardTable.tsx      NEW
  ProfileSwitcher.tsx       NEW
```

### Lottie files (`public/lottie/`)
```
confetti-gold.json    mission complete 3 sao
confetti-green.json   mission complete 2 sao
thinking.json         hint state 2
facepalm.json         hint state 3
skull.json            hint state MAX
streak-break.json     mất streak
```

Tất cả Lottie load bằng:
```ts
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
```

---

## 7. Edge Cases & Error Handling (Section 6)

| Tình huống | Xử lý |
|---|---|
| Lottie không load (offline) | Fallback: CSS animation + emoji |
| Replay mission đã xong | Chỉ update nếu `newStars > existingStars`, không cộng XP |
| Chapter 10 `noHints: true` | Ẩn HintSystem hoàn toàn |
| Timezone khác nhau | Dùng UTC ISO string để so sánh streak |
| localStorage đầy / lỗi | `try/catch` toàn bộ, fallback state mặc định |
| Tên profile trùng nhau | Validate unique khi tạo, error inline |
| XP overflow | Cap level 99, hiển thị "MAX" |
| `prefers-reduced-motion` | Tắt Lottie + CSS animation, chỉ giữ transition nhẹ |
| Profile bị xóa localStorage | Tạo lại default profile tự động |

```ts
function safeRead<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') ?? fallback }
  catch { return fallback }
}
```

---

## 8. Testing

- `check-chapter.mjs` + `playtest-chapter.mjs` — giữ nguyên, không đụng mission logic
- **Playwright smoke tests:**
  - Complete 1 mission → modal hiện, XP tăng, star đúng số
  - Bấm hint 3 lần → HintSystem qua đủ 5 state
  - Mở 3 slide panel lần lượt → chỉ 1 panel mở, đóng đúng
  - Leaderboard: tạo 2 profile, switch, XP đúng từng profile
  - `prefers-reduced-motion`: tất cả Lottie bị skip, không crash
- Build phải pass: `npm run build`

---

## 9. Agent Plan

Sau khi spec approved, dispatch 4 agent song song trên git worktree riêng:

| Agent | Model | Phạm vi |
|-------|-------|---------|
| A | `sonnet` | Nhóm 1 — Mission UI refactor |
| B | `sonnet` | Nhóm 2 — Achievement & Feedback |
| C | `haiku` | Nhóm 3 — Gamification data layer |
| D | `haiku` | Nhóm 4 — Leaderboard UI |

Main agent: phối hợp, verify output, merge, chạy Playwright test cuối.

---

## 10. Rollout

Toàn bộ tính năng mới backward-compatible. localStorage cũ không có `xp`/`streak`/`stars` → fallback `0` tự động. Không cần migration script.
