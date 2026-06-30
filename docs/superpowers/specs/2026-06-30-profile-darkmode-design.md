# Profile Management, Avatar, Dark Mode & Forgot Password

**Date:** 2026-06-30  
**Branch:** feat/specialist-tracks → feature/profile-darkmode  
**Status:** Approved

---

## Overview

Four features delivered in two sprints:

| Sprint | Scope |
|--------|-------|
| **A** | Dark/light mode + Profile page (display name, bio, change password, change email) + Avatar upload (base64, PostgreSQL) |
| **B** | Forgot password via Nodemailer + Gmail SMTP |

---

## Section 1 — Backend DB Schema + Endpoints

### Schema changes (game-api `prisma/schema.prisma`)

**Extend `User` model:**

```prisma
model User {
  id             String          @id @default(uuid())
  email          String          @unique
  passwordHash   String
  displayName    String?
  bio            String?
  avatarBase64   String?         // base64 JPEG, compressed to 200×200px ~40-60 KB
  createdAt      DateTime        @default(now())
  progress       Progress?
  refreshTokens  RefreshToken[]
  passwordResets PasswordReset[]
}
```

**New `PasswordReset` model:**

```prisma
model PasswordReset {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### New endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `PATCH` | `/users/me/profile` | cookie | Update displayName, bio |
| `PATCH` | `/users/me/avatar` | cookie | Upload avatar (base64 string in body) |
| `DELETE` | `/users/me/avatar` | cookie | Xóa avatar |
| `PATCH` | `/users/me/password` | cookie | Change password (currentPassword + newPassword) |
| `PATCH` | `/users/me/email` | cookie | Change email (currentPassword + newEmail) |
| `POST` | `/auth/forgot-password` | — | Gửi reset email |
| `POST` | `/auth/reset-password` | — | Đặt lại password bằng token |

### Updated `GET /users/me` response

```ts
{
  id: string
  email: string
  displayName: string | null
  bio: string | null
  avatarBase64: string | null
  createdAt: string
  progress: { completedMissions: object; stats: object }
}
```

### Security rules

- `PATCH /users/me/password` và `PATCH /users/me/email`: luôn yêu cầu `currentPassword` để xác nhận — không dùng lại token auth.
- `POST /auth/forgot-password`: luôn trả `200 OK` dù email không tồn tại (tránh user enumeration).
- Reset token: `crypto.randomBytes(32)` → raw token gửi qua email, DB lưu `bcrypt.hash(rawToken, 10)`. Expire 1 giờ, `used=true` sau khi dùng một lần.
- Avatar: validate là base64 hợp lệ, giới hạn 200 KB sau decode ở backend.

---

## Section 2 — Dark / Light Mode

### Approach

`next-themes` — system preference mặc định, người dùng có thể override, lưu vào `localStorage`.

### Implementation

**`src/app/providers.tsx`** — wrap `ThemeProvider`:

```tsx
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
```

**`tailwind.config.ts`:**

```ts
export default {
  darkMode: 'class',
  // ...
}
```

**Toggle component** (`src/components/ThemeToggle.tsx`):

```tsx
'use client'
import { useTheme } from 'next-themes'
// Sun icon → Light, Moon icon → Dark, Monitor icon → System
// Dùng shadcn DropdownMenu với 3 options
```

- Toggle đặt ở Header (góc phải, cạnh user menu).
- Không cần API call — hoàn toàn client-side.
- Tất cả màu sắc dùng CSS variable qua Tailwind: `bg-background`, `text-foreground`, `border-border`, v.v.

---

## Section 3 — Profile Page + Avatar

### Route: `/profile` (protected)

Layout chia 2 cột:

```
┌──────────────────────────────────────────────────────┐
│  Avatar (200×200)   │  Display Name                  │
│  [Đổi ảnh]          │  Bio (textarea, max 200 chars) │
│  [Xóa ảnh]          │  Email hiện tại                │
│                     │  [Lưu thay đổi]                │
├──────────────────────────────────────────────────────┤
│  Đổi mật khẩu                                        │
│  Mật khẩu hiện tại / Mật khẩu mới / Xác nhận        │
│  [Đổi mật khẩu]                                      │
├──────────────────────────────────────────────────────┤
│  Đổi email                                           │
│  Email mới / Mật khẩu hiện tại để xác nhận          │
│  [Đổi email]                                         │
└──────────────────────────────────────────────────────┘
```

### Avatar upload flow

1. `<input type="file" accept="image/*">` — ẩn, trigger bằng nút "Đổi ảnh"
2. Frontend dùng `<canvas>` để resize về 200×200px, export `toDataURL('image/jpeg', 0.8)` → ~40-60 KB
3. Gửi base64 string lên `PATCH /users/me/avatar`
4. Preview cập nhật ngay (optimistic)
5. Avatar hiển thị bằng `<img src={avatarBase64} />` — không cần URL

### State management

- `useProfileStore` (Zustand) hoặc dùng trực tiếp `useAuthStore` nếu User object được mở rộng để chứa `displayName`, `bio`, `avatarBase64`
- Cập nhật `useAuthStore.user` sau mỗi patch thành công để Header avatar sync

### Form validation (react-hook-form + zod)

```ts
// Profile
z.object({ displayName: z.string().max(50).optional(), bio: z.string().max(200).optional() })

// Change password
z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { path: ['confirmPassword'] })

// Change email
z.object({ newEmail: z.string().email(), currentPassword: z.string().min(1) })
```

---

## Section 4 — Forgot Password (Sprint B)

### Flow

```
[/login] → click "Quên mật khẩu?"
  → [/forgot-password] nhập email
  → Backend: tạo reset token (random 32 bytes), hash bcrypt, lưu DB (expire 1h)
  → Gửi email chứa link: /reset-password?token=<raw_token>
  → [/reset-password?token=xxx] nhập password mới
  → Backend: verify token hash, đặt password mới, xóa (used=true) token
  → Redirect về /login với toast "Đặt lại mật khẩu thành công"
```

### Backend endpoints

**`POST /auth/forgot-password`**

```ts
// DTO
class ForgotPasswordDto {
  @IsEmail() email: string
}

// Logic
1. Tìm user theo email (nếu không có → trả 200 OK luôn, không báo)
2. Vô hiệu hóa token cũ chưa dùng của user này
3. rawToken = crypto.randomBytes(32).toString('hex')
4. Lưu PasswordReset { tokenHash: bcrypt.hash(rawToken), userId, expiresAt: now+1h }
5. Gửi email chứa link: `${FRONTEND_URL}/reset-password?token=${rawToken}`
6. Trả 200 { message: 'Nếu email tồn tại, link đã được gửi' }
```

**`POST /auth/reset-password`**

```ts
// DTO
class ResetPasswordDto {
  @IsString() token: string
  @MinLength(8) @MaxLength(72) newPassword: string
}

// Logic
1. Tìm PasswordReset record chưa used, chưa expired
2. bcrypt.compare(token, record.tokenHash) — nếu sai → 400
3. Hash newPassword, update User.passwordHash
4. Đánh dấu PasswordReset.used = true
5. Xóa toàn bộ RefreshToken của user (buộc đăng nhập lại)
6. Trả 200 { message: 'Đặt lại mật khẩu thành công' }
```

### Email template

```html
Tiêu đề: [Hacker Path] Đặt lại mật khẩu

<p>Mày vừa yêu cầu đặt lại mật khẩu cho tài khoản Hacker Path.</p>
<p>Link này hết hạn sau <strong>1 giờ</strong>.</p>
<a href="${resetUrl}">ĐẶT LẠI MẬT KHẨU</a>
<p>Nếu không phải mày yêu cầu, bỏ qua email này.</p>
```

### Nodemailer config

**Env vars cần thêm** (`.env` + `env.schema.ts`):

```
MAIL_USER=your-gmail@gmail.com
MAIL_PASS=xxxx-xxxx-xxxx-xxxx    # Gmail App Password (không phải password thường)
MAIL_FROM="Hacker Path <noreply@hacklab.dev>"
```

**`MailModule`** — injectable `MailService`:

```ts
@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  })

  async sendPasswordReset(to: string, resetUrl: string) {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: '[Hacker Path] Đặt lại mật khẩu',
      html: `...`, // template trên
    })
  }
}
```

### Frontend pages

- **`/forgot-password`** — 1 input email + submit, hiện message sau khi gửi: "Nếu email tồn tại, link đã được gửi vào hộp thư của mày."
- **`/reset-password`** — đọc `?token` từ URL, 2 inputs (password + confirm), redirect về `/login` khi xong

Cả hai page là public (không cần auth).

---

## Sprint Plan

### Sprint A — Dark mode + Profile (khoảng 2-3 ngày)

**Backend (game-api):**
1. Prisma migration thêm `displayName`, `bio`, `avatarBase64` vào `User`
2. `UpdateProfileDto`, `UpdateAvatarDto`, `ChangePasswordDto`, `ChangeEmailDto`
3. 5 endpoint mới trong `UsersController` / `UsersService`
4. Update `GET /users/me` response

**Frontend (game/):**
1. Cài `next-themes`, config `ThemeProvider` trong `providers.tsx`
2. `ThemeToggle` component → Header
3. Mở rộng `User` type trong `authStore` thêm `displayName`, `bio`, `avatarBase64`
4. `/profile` page với 3 form sections + avatar upload

### Sprint B — Forgot Password (khoảng 1-2 ngày)

**Backend (game-api):**
1. Prisma migration tạo `PasswordReset` model
2. Cài `nodemailer`, tạo `MailModule` + `MailService`
3. Thêm `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` vào `env.schema.ts`
4. 2 endpoint mới: `POST /auth/forgot-password` + `POST /auth/reset-password`

**Frontend (game/):**
1. `/forgot-password` page
2. `/reset-password` page
3. Link "Quên mật khẩu?" trong `/login`

---

## Gates trước khi merge

**game-api:**
```bash
npm run build && npm test && npx tsc --noEmit
```

**game/ (frontend):**
```bash
npm run build && npx tsc --noEmit
# + Playwright smoke test: dark mode toggle, profile update, avatar upload, forgot password flow
```
