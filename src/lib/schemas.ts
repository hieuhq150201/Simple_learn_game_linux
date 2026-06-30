import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Nhập mật khẩu'),
})

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

export const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(200).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
  newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Email không hợp lệ'),
  currentPassword: z.string().min(1, 'Nhập mật khẩu'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
