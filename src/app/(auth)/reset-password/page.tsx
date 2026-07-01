'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp', path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

import { api } from '@/lib/api'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!token) router.replace('/login')
  }, [token, router])

  async function onSubmit(values: FormData) {
    try {
      await api.post('/auth/reset-password', { token, newPassword: values.newPassword })
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Token không hợp lệ hoặc đã hết hạn'
      form.setError('root', { message: msg })
    }
  }

  return (
      <Card className="w-full max-w-md bg-gray-900 border-green-800 text-green-400">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono">ĐẶT LẠI MẬT KHẨU</CardTitle>
          <CardDescription className="text-green-600">Nhập mật khẩu mới của mày</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="text-center space-y-2">
              <p className="text-green-400 font-mono">✓ Đặt lại mật khẩu thành công!</p>
              <p className="text-gray-500 text-xs">Đang chuyển về trang đăng nhập...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <p className="text-red-400 text-sm font-mono">{form.formState.errors.root.message}</p>
                )}
                <FormField control={form.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-600">Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Tối thiểu 8 ký tự"
                        className="bg-gray-800 border-green-800 text-green-400 placeholder-gray-600 focus:border-green-400" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-600">Xác nhận mật khẩu</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Nhập lại mật khẩu"
                        className="bg-gray-800 border-green-800 text-green-400 placeholder-gray-600 focus:border-green-400" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <Button type="submit" disabled={form.formState.isSubmitting}
                  className="w-full bg-green-600 text-black hover:bg-green-400 font-mono font-bold">
                  {form.formState.isSubmitting ? 'Đang xử lý...' : 'ĐẶT LẠI MẬT KHẨU'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordContent /></Suspense>
}
