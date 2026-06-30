# Auth & User System — Design Spec

**Ngày:** 2026-06-30
**Phạm vi:** Login, đăng ký, sync progress across devices
**Mục tiêu tương lai (chưa implement):** Content gating — giới hạn chương/mission theo gói đăng ký (xem mục cuối)

---

## 1. Kiến trúc tổng thể

### Hai repo độc lập

| Repo | Vai trò | Stack |
|------|---------|-------|
| `game/` (repo hiện tại, migrate sang Next.js) | Frontend | Next.js + Tailwind + TypeScript |
| `game-api/` (repo mới) | REST API backend | NestJS + TypeScript + PostgreSQL |

> **Note:** Codebase hiện tại (React + Vite) sẽ được migrate sang Next.js App Router. Auth system được thiết kế cho Next.js ngay từ đầu — không cần refactor sau.

### Stack backend

- **Framework:** NestJS + TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma (type-safe, migration rõ ràng, dễ thêm model sau)
- **Auth:** JWT — access token 15 phút + refresh token 30 ngày
- **Password:** bcrypt (salt rounds = 12)
- **Refresh token storage:** httpOnly cookie (tránh XSS)
- **Access token storage:** httpOnly cookie ngắn hạn — Next.js middleware đọc được server-side, không cần lưu memory

### Flow auth

```
[Register / Login]
  → server trả access_token (httpOnly cookie, 15 phút)
               + refresh_token (httpOnly cookie, 30 ngày)
  → Next.js middleware tự đọc cookie ở mọi request — không cần lưu JS memory

[Mỗi request tới NestJS API]
  → Next.js Server Action / Route Handler đính access_token vào header
  → hoặc client gọi trực tiếp với credentials: 'include' (cookie tự gửi kèm)

[Khi access_token hết hạn]
  → Next.js middleware intercept 401, tự gọi POST /auth/refresh
  → nhận access_token mới, set lại cookie, retry request gốc

[Bảo vệ route]
  → middleware.ts kiểm tra cookie access_token
  → redirect về /login nếu không có hoặc hết hạn

[Logout]
  → server xóa refresh_token khỏi DB + clear cả hai cookie
```

### Guest mode (không đăng nhập)

App vẫn hoạt động đầy đủ với localStorage như hiện tại. Auth là optional — người dùng chỉ cần đăng nhập khi muốn sync progress. Không ép buộc đăng ký để chơi.

---

## 2. Database Schema (Prisma)

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  progress      Progress?
  refreshTokens RefreshToken[]
}

model Progress {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  completedMissions Json     // { "1-1": { completedAt, usedHint }, ... }
  stats             Json     // { commandsRun, hintsUsed }
  updatedAt         DateTime @updatedAt
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
}
```

**Ghi chú schema:**
- `completedMissions` và `stats` dùng `Json` để khớp với format localStorage hiện tại — không cần migration data phức tạp.
- `RefreshToken` lưu DB để có thể revoke từng session (logout một thiết bị, không logout hết).
- Khi thêm content gating sau: thêm field `plan` vào `User` (ví dụ `free | pro`) mà không cần đổi schema lớn.

---

## 3. API Endpoints

### Auth

| Method | Path | Body | Mô tả |
|--------|------|------|-------|
| `POST` | `/auth/register` | `{ email, password }` | Tạo tài khoản, trả access_token |
| `POST` | `/auth/login` | `{ email, password }` | Đăng nhập, trả access_token |
| `POST` | `/auth/refresh` | _(cookie)_ | Đổi refresh_token → access_token mới |
| `POST` | `/auth/logout` | _(cookie)_ | Revoke refresh_token, clear cookie |

### User & Progress

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/users/me` | ✅ | Lấy email + progress |
| `PATCH` | `/users/me/progress` | ✅ | Sync progress lên server |

**PATCH /users/me/progress — merge logic:**
- Server nhận `{ completedMissions, stats }` từ frontend
- Merge với data hiện tại trên DB: mission nào đã có trên server thì giữ nguyên (không overwrite về trạng thái cũ hơn)
- `stats.commandsRun` và `stats.hintsUsed` lấy giá trị lớn hơn giữa client và server

---

## 4. NestJS Module Structure

```
game-api/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts     — /auth/*
│   │   ├── auth.service.ts        — register, login, refresh, logout logic
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts    — validate access_token
│   │   │   └── jwt-refresh.strategy.ts — validate refresh_token từ cookie
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts    — /users/me
│   │   └── users.service.ts       — get profile, sync progress
│   ├── prisma/
│   │   ├── prisma.module.ts       — global module
│   │   └── prisma.service.ts      — PrismaClient wrapper
│   └── main.ts                    — bootstrap, CORS, cookie-parser
├── prisma/
│   └── schema.prisma
├── .env                           — DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
└── package.json
```

---

## 5. Frontend Integration (Next.js)

### Cấu trúc Next.js liên quan đến auth

```
game/
├── middleware.ts                  — kiểm tra cookie, redirect nếu chưa login
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         — trang đăng nhập
│   │   └── register/page.tsx      — trang đăng ký
│   ├── (game)/
│   │   └── layout.tsx             — layout bọc các trang cần login
│   └── layout.tsx                 — root layout, AuthProvider
├── lib/
│   └── api.ts                     — fetch wrapper tự gắn cookie, handle 401 refresh
└── contexts/
    └── AuthContext.tsx            — user state, login/logout actions
```

### middleware.ts

Chạy trên mọi request ở Edge Runtime — kiểm tra cookie `access_token`:
- Nếu hợp lệ → cho qua
- Nếu hết hạn → gọi `/auth/refresh`, set cookie mới, retry
- Nếu không có / refresh thất bại → redirect về `/login`
- Route `/login`, `/register` luôn public (bypass middleware)

### AuthContext

Cung cấp cho toàn app:
- `user` — `{ id, email }` hoặc `null` (guest)
- `login(email, password)` → gọi API → server set cookie → fetch + merge progress
- `register(email, password)` → tương tự login
- `logout()` → gọi API → server clear cookie → clear local state

Không cần lưu token trong state — cookie tự động gửi kèm mọi request.

### Sync progress

Trong progress context — sau khi `completeMission()`:
- Nếu user đang đăng nhập → gọi `PATCH /users/me/progress`
- Nếu guest → chỉ lưu localStorage (behavior không đổi)

### Merge khi login

1. Fetch progress từ server
2. Merge với localStorage: union `completedMissions`, `stats` lấy max
3. Lưu kết quả vào cả localStorage lẫn server

### UI cần thêm

- `app/(auth)/login/page.tsx` — form email + password
- `app/(auth)/register/page.tsx` — form tạo tài khoản
- Header: hiện email + nút logout khi đã đăng nhập, nút "Đăng nhập" khi guest

---

## 6. Security Checklist

- [x] Password hash với bcrypt (rounds = 12)
- [x] Password hash với bcrypt (rounds = 12)
- [x] Access token ngắn hạn (15 phút) — hạn chế thiệt hại nếu bị leak
- [x] Cả access token lẫn refresh token đều httpOnly cookie — không accessible bằng JS
- [x] Refresh token lưu DB → có thể revoke từng session
- [x] Next.js middleware chặn route trước khi render — không có flash of unauthenticated content
- [x] CORS chỉ cho phép origin của Next.js frontend
- [x] Rate limiting trên `/auth/login` và `/auth/register` (chống brute force)
- [x] Validate input với class-validator (NestJS built-in)

---

## 7. Dự định tương lai — Content Gating (chưa implement)

Khi có nhu cầu giới hạn nội dung theo gói:

- Thêm `plan: enum('free', 'pro')` vào model `User`
- Free: chơi được Ch1-5; Pro: mở toàn bộ 14 chương
- Backend thêm guard kiểm tra `plan` trước khi trả chapter data
- Frontend hiện lock icon + CTA upgrade trên các chương bị giới hạn
- Tích hợp payment (Stripe hoặc tương đương) trong sprint riêng

Schema hiện tại (`User.plan`) có thể thêm sau mà không cần refactor auth.

---

## 8. Out of Scope (sprint này)

- Migration React → Next.js — sprint riêng, trước hoặc song song với auth
- OAuth (Google / GitHub) — có thể thêm sau khi email/password stable
- Email verification
- Forgot password / reset password flow
- Admin dashboard
- Payment / subscription
