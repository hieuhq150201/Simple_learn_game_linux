'use client'
import { useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

const schema = z.object({ email: z.string().email('Email không hợp lệ') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  async function onSubmit(values: FormData) {
    await api.post('/auth/forgot-password', { email: values.email })
    setSent(true) // always show success regardless of whether email exists
  }

  return (
      <Card className="w-full max-w-md bg-gray-900 border-green-800 text-green-400">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono">QUÊN MẬT KHẨU</CardTitle>
          <CardDescription className="text-green-600">Nhập email và tao sẽ gửi link đặt lại mật khẩu</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-green-400 font-mono text-sm">
                ✓ Nếu email tồn tại, link đã được gửi vào hộp thư của mày.
              </p>
              <p className="text-gray-500 text-xs">Kiểm tra cả thư mục spam nhé.</p>
              <Link href="/login" className="block text-green-600 text-sm hover:text-green-400 font-mono">
                ← Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-600">Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="you@example.com"
                        className="bg-gray-800 border-green-800 text-green-400 placeholder-gray-600 focus:border-green-400" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <Button type="submit" disabled={form.formState.isSubmitting}
                  className="w-full bg-green-600 text-black hover:bg-green-400 font-mono font-bold">
                  {form.formState.isSubmitting ? 'Đang gửi...' : 'GỬI LINK ĐẶT LẠI'}
                </Button>
                <div className="text-center">
                  <Link href="/login" className="text-green-600 text-xs hover:text-green-400 font-mono">
                    ← Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
  )
}
