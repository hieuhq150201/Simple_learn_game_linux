# Auth & User System — Frontend Spec

**Ngày:** 2026-06-30
**Repo:** `game/` — Next.js Frontend
**Spec backend:** xem repo `game-api/` → `docs/specs/2026-06-30-auth-design.md`

---

## 1. Kiến trúc tổng thể

| Repo | Vai trò | Stack |
|------|---------|-------|
| `game/` **(repo này)** | Frontend | Next.js + TypeScript + Tailwind + shadcn/ui |
| `game-api/` | REST API backend | NestJS + TypeScript + PostgreSQL + Prisma |

> Codebase hiện tại (React + Vite) sẽ migrate sang Next.js App Router. Auth được thiết kế cho Next.js ngay từ đầu. **Toàn bộ dùng TypeScript** — không có file `.js` mới.

### Stack chi tiết

| Layer | Thư viện | Lý do chọn |
|-------|----------|------------|
| Framework | Next.js 15 App Router | SSR, middleware auth, Server Components |
| Language | TypeScript (strict) | Type-safe end-to-end |
| Styling | Tailwind CSS | Giữ nguyên từ codebase hiện tại |
| UI Components | **shadcn/ui** | Copy-paste, own the code, Radix UI primitives, Tailwind-native, dark mode built-in |
| Client state | **Zustand** | ~3KB, stable với App Router — `authStore`, `uiStore` |
| Server state | **TanStack Query v6** | Caching, background sync — mọi API call tới `game-api/` |
| Forms | **React Hook Form + Zod** | Validation type-safe, ít re-render |
| URL state | **nuqs** | Sync chapter/mission với URL (deep-link) |

**Phân chia state:**
- **Zustand**: `authStore` (user, isAuthenticated, login, logout), `uiStore` (modal states)
- **TanStack Query**: mọi thứ fetch từ API — progress, user profile
- **localStorage**: guest mode progress (giữ nguyên behavior hiện tại)
- **URL (nuqs)**: chapter/mission hiện tại

### Flow auth (góc nhìn frontend)

```
[Login / Register]
  → gọi POST /auth/login hoặc /auth/register
  → game-api set httpOnly cookie → browser lưu tự động
  → fetch progress từ server → merge với localStorage → update store

[Mỗi request API]
  → fetch với credentials: 'include' → cookie tự gửi kèm
  → nhận 401 → tự động gọi POST /auth/refresh → retry request gốc

[Bảo vệ route]
  → middleware.ts chạy ở Edge Runtime
  → kiểm tra cookie access_token → redirect /login nếu hết hạn / không có

[Logout]
  → gọi POST /auth/logout → game-api clear cookie → clear authStore
```

### Cookie cross-origin

`game/` và `game-api/` khác domain ở production — **bắt buộc từ phía frontend**:

- Mọi fetch call: `credentials: 'include'`
- Dev local: dùng Next.js `rewrites` proxy để tránh cross-origin, hoặc `sameSite: 'lax'` khi cả hai chạy `localhost`

### Guest mode

App vẫn hoạt động đầy đủ với localStorage như hiện tại. Auth là optional — chỉ cần đăng nhập khi muốn sync progress. Không ép buộc đăng ký để chơi.

---

## 2. Cấu trúc Next.js

```
game/
├── middleware.ts                   — Edge Runtime: kiểm tra cookie, redirect /login
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          — trang đăng nhập (shadcn Card + Form)
│   │   └── register/page.tsx       — trang đăng ký
│   ├── (game)/
│   │   └── layout.tsx              — layout bọc trang cần login
│   └── layout.tsx                  — root layout: QueryClientProvider + Providers
├── stores/
│   ├── authStore.ts                — Zustand: user, isAuthenticated, login, logout
│   └── uiStore.ts                  — Zustand: loginModalOpen, ...
├── lib/
│   ├── api.ts                      — fetch wrapper: credentials include, handle 401 → refresh
│   └── queryClient.ts              — TanStack Query client config
├── hooks/
│   ├── useProgress.ts              — TanStack Query: fetch/mutate progress
│   └── useAuth.ts                  — wrapper tiện lợi quanh authStore
└── components/ui/                  — shadcn/ui components
```

### middleware.ts

Chạy trên mọi request ở Edge Runtime — kiểm tra cookie `access_token`:
- Hợp lệ → cho qua
- Hết hạn → gọi `/auth/refresh`, set cookie mới, retry
- Không có / refresh thất bại → redirect `/login`
- `/login`, `/register` luôn public

### Zustand authStore

```ts
interface AuthState {
  user: { id: string; email: string } | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
```

Không lưu token trong store — cookie do browser quản lý.

### TanStack Query — progress sync

```ts
// fetch progress khi đã login
useQuery({ queryKey: ['progress'], queryFn: () => api.get('/users/me') })

// sync sau khi complete mission
useMutation({ mutationFn: (data) => api.patch('/users/me/progress', data) })
```

- Guest: TanStack Query disabled, dùng localStorage như hiện tại
- Logged in: mỗi `completeMission()` trigger mutation, cache tự invalidate

### Merge khi login

1. `authStore.login()` thành công → fetch progress từ server
2. Merge với localStorage: union `completedMissions`, `stats` lấy `Math.max`
3. Lưu kết quả lên server + update localStorage

### UI cần thêm

- `app/(auth)/login/page.tsx` — shadcn `Card` + `Form` + `Input` + `Button`
- `app/(auth)/register/page.tsx` — tương tự, thêm confirm password
- Validation: Zod schema + React Hook Form
- Header: shadcn `DropdownMenu` — email + logout khi đã login, nút "Đăng nhập" khi guest

---

## 3. Security Checklist (Frontend)

- [x] Không lưu token trong localStorage / JS memory — httpOnly cookie do server set
- [x] `credentials: 'include'` trên mọi fetch
- [x] middleware.ts chặn route trước khi render — không có flash of unauthenticated content
- [x] Tự động refresh token khi nhận 401 — UX không bị gián đoạn
- [x] Logout clear authStore + gọi API để server revoke token
- [x] Form validation bằng Zod — không gửi request với data không hợp lệ

---

## 4. Dự định tương lai — Content Gating (Frontend)

Khi backend thêm `plan` vào User:
- Hiện lock icon + CTA upgrade trên chapter bị giới hạn
- Kiểm tra `user.plan` từ TanStack Query cache — không tự implement logic, trust backend
- Tích hợp payment flow trong sprint riêng

---

## 5. Out of Scope (sprint này)

- Migration React → Next.js — **sprint riêng, phải xong trước**
- OAuth (Google / GitHub)
- Email verification
- Forgot password / reset password
- Payment / subscription

---

## 6. Thứ tự sprint

1. **Sprint 0** — Migration React + Vite → Next.js App Router (setup TS strict, shadcn/ui, Zustand, TanStack Query)
2. **Sprint 1** — Backend `game-api/` hoàn thiện (song song hoặc trước)
3. **Sprint 2** — Frontend auth: middleware, authStore, login/register pages, progress sync
