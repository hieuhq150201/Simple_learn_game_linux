'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ChangeEmailInput,
} from '@/lib/schemas'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateUser } = useAuthStore()

  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.replace('/login')
    }
  }, [isAuthenticated, user, router])

  // ── Forms ──────────────────────────────────────────────────────────────────

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      bio: user?.bio ?? '',
    },
  })

  const pwForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const emailForm = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: '', currentPassword: '' },
  })

  if (!user) return null

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    setAvatarError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      updateUser({ avatarUrl: data.avatarUrl })
    } catch {
      setAvatarError('Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setAvatarLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleAvatarDelete() {
    setAvatarLoading(true)
    setAvatarError(null)
    try {
      await api.delete('/users/me/avatar')
      updateUser({ avatarUrl: null })
    } catch {
      setAvatarError('Không thể xóa ảnh. Vui lòng thử lại.')
    } finally {
      setAvatarLoading(false)
    }
  }

  async function onProfileSubmit(data: UpdateProfileInput) {
    setProfileSuccess(false)
    setProfileError(null)
    try {
      await api.patch('/users/me/profile', data)
      updateUser({ displayName: data.displayName ?? null, bio: data.bio ?? null })
      setProfileSuccess(true)
    } catch {
      setProfileError('Cập nhật thất bại. Vui lòng thử lại.')
    }
  }

  async function onPasswordSubmit(data: ChangePasswordInput) {
    setPwSuccess(false)
    setPwError(null)
    try {
      await api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      setPwSuccess(true)
      pwForm.reset()
    } catch {
      setPwError('Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.')
    }
  }

  async function onEmailSubmit(data: ChangeEmailInput) {
    setEmailSuccess(false)
    setEmailError(null)
    try {
      await api.patch('/users/me/email', data)
      updateUser({ email: data.newEmail } as Parameters<typeof updateUser>[0])
      setEmailSuccess(true)
      emailForm.reset()
    } catch {
      setEmailError('Đổi email thất bại. Kiểm tra lại mật khẩu.')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav bar */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-green-600 hover:text-green-400 font-mono text-sm transition-colors">
          ← Về trang chủ
        </Link>
        <span className="text-gray-600 text-sm">|</span>
        <span className="text-green-400 font-mono text-sm font-bold">[TRANG CÁ NHÂN]</span>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {/* Desktop: 2 cột — avatar + info bên trái, password + email bên phải */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cột trái: avatar + thông tin */}
        <div className="space-y-6">

        {/* Avatar */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-green-400 text-base">Ảnh đại diện</CardTitle>
            <CardDescription className="text-gray-400">
              Ảnh sẽ được xử lý và tối ưu tự động
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl ?? undefined}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-green-800"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-3xl text-gray-500 select-none">
                👤
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="text-green-400 border-green-800 hover:bg-green-900/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
              >
                {avatarLoading ? 'Đang tải...' : 'Tải ảnh lên'}
              </Button>
              {user.avatarUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleAvatarDelete}
                  disabled={avatarLoading}
                >
                  Xóa ảnh
                </Button>
              )}
            </div>
          </CardContent>
          {avatarError && (
            <CardFooter>
              <p className="text-red-400 text-sm">{avatarError}</p>
            </CardFooter>
          )}
        </Card>

        {/* Profile info */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-green-400 text-base">Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Tên hiển thị</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên hiển thị..."
                          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-green-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Bio</FormLabel>
                      <FormControl>
                        <textarea
                          rows={3}
                          placeholder="Giới thiệu bản thân..."
                          className="flex w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {profileSuccess && (
                  <p className="text-green-400 text-sm">Cập nhật thành công!</p>
                )}
                {profileError && (
                  <p className="text-red-400 text-sm">{profileError}</p>
                )}
                <Button
                  type="submit"
                  className="bg-green-700 hover:bg-green-600 text-black font-bold"
                  disabled={profileForm.formState.isSubmitting}
                >
                  {profileForm.formState.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        </div>{/* end cột trái */}

        {/* Cột phải: password + email */}
        <div className="space-y-6">

        {/* Change password */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-green-400 text-base">Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...pwForm}>
              <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={pwForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Mật khẩu hiện tại</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-green-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pwForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-green-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pwForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Xác nhận mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-green-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {pwSuccess && (
                  <p className="text-green-400 text-sm">Đổi mật khẩu thành công!</p>
                )}
                {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
                <Button
                  type="submit"
                  className="bg-green-700 hover:bg-green-600 text-black font-bold"
                  disabled={pwForm.formState.isSubmitting}
                >
                  {pwForm.formState.isSubmitting ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change email */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-green-400 text-base">Đổi email</CardTitle>
            <CardDescription className="text-gray-400">
              Email hiện tại: <span className="text-green-400">{user.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email mới</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-green-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Mật khẩu hiện tại</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-green-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {emailSuccess && (
                  <p className="text-green-400 text-sm">Đổi email thành công!</p>
                )}
                {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
                <Button
                  type="submit"
                  className="bg-green-700 hover:bg-green-600 text-black font-bold"
                  disabled={emailForm.formState.isSubmitting}
                >
                  {emailForm.formState.isSubmitting ? 'Đang đổi...' : 'Đổi email'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        </div>{/* end cột phải */}
        </div>{/* end grid */}
      </div>
    </div>
  )
}
