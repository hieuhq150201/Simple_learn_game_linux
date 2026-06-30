# Auth & User System — Design Spec

**Ngày:** 2026-06-30
**Phạm vi:** Login, đăng ký, sync progress across devices
**Mục tiêu tương lai (chưa implement):** Content gating — giới hạn chương/mission theo gói đăng ký (xem mục cuối)

---

## 1. Kiến trúc tổng thể

### Hai repo độc lập

| Repo | Vai trò | Stack |
|------|---------|-------|
| `game/` (repo hiện tại) | React frontend | React + Tailwind + Vite |
| `game-api/` (repo mới) | REST API backend | NestJS + TypeScript + PostgreSQL |

### Stack backend

- **Framework:** NestJS + TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma (type-safe, migration rõ ràng, dễ thêm model sau)
- **Auth:** JWT — access token 15 phút + refresh token 30 ngày
- **Password:** bcrypt (salt rounds = 12)
- **Refresh token storage:** httpOnly cookie (tránh XSS)
- **Access token storage:** in-memory trên frontend (không localStorage)

### Flow auth

```
[Register / Login]
  → server trả access_token (JSON body) + refresh_token (httpOnly cookie)
  → frontend lưu access_token trong React state / memory

[Mỗi request API]
  → gửi kèm Authorization: Bearer <access_token>

[Khi access_token hết hạn (15 phút)]
  → frontend tự động gọi POST /auth/refresh
  → server đọc refresh_token từ cookie, trả access_token mới

[Logout]
  → server xóa refresh_token khỏi DB + clear cookie
  → frontend xóa access_token khỏi memory
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

## 5. Frontend Integration

### Hook mới: `useAuth`

```
src/hooks/useAuth.js
```

Quản lý:
- `user` state (null nếu chưa đăng nhập)
- `accessToken` trong memory (không persist)
- `login(email, password)` → gọi API → lưu token → fetch + merge progress
- `register(email, password)` → tương tự login
- `logout()` → gọi API → clear state
- `refreshToken()` → tự động gọi khi nhận 401

### Sync progress

Trong `useProgress.js` — sau khi `completeMission()`:
- Nếu user đang đăng nhập → gọi `PATCH /users/me/progress` với progress mới
- Nếu guest → chỉ lưu localStorage như hiện tại (không thay đổi behavior)

### Merge khi login

Khi user đăng nhập thành công:
1. Fetch progress từ server
2. Merge với localStorage: union của hai tập `completedMissions`, `stats` lấy max
3. Lưu kết quả merge vào cả localStorage lẫn server

### UI cần thêm

- `LoginModal.jsx` — form email + password, link sang register
- `RegisterModal.jsx` — form tạo tài khoản
- Header: hiện avatar/email + nút logout khi đã đăng nhập, nút "Đăng nhập" khi guest

---

## 6. Security Checklist

- [x] Password hash với bcrypt (rounds = 12)
- [x] Access token ngắn hạn (15 phút) — hạn chế thiệt hại nếu bị leak
- [x] Refresh token lưu httpOnly cookie — không accessible bằng JS
- [x] Refresh token lưu DB → có thể revoke
- [x] CORS chỉ cho phép origin của frontend
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

- OAuth (Google / GitHub) — có thể thêm sau khi email/password stable
- Email verification
- Forgot password / reset password flow
- Admin dashboard
- Payment / subscription
