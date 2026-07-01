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
    setSent(true)
  }

  return (
    <Card className="w-full max-w-md bg-hp-card border-hp-border">
      <CardHeader>
        <CardTitle className="text-green-700 dark:text-green-400 font-mono">QUÊN MẬT KHẨU</CardTitle>
        <CardDescription className="text-hp-muted">Nhập email và tao sẽ gửi link đặt lại mật khẩu</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-green-600 dark:text-green-400 font-mono text-sm">
              ✓ Nếu email tồn tại, link đã được gửi vào hộp thư của bạn.
            </p>
            <p className="text-hp-subtle text-xs">Vui lòng kiểm tra cả thư mục spam.</p>
            <Link href="/login" className="block text-green-600 dark:text-green-500 text-sm hover:text-green-500 dark:hover:text-green-400 font-mono">
              ← Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-hp-fg">Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="you@example.com"
                      className="bg-hp-surface border-hp-border text-hp-fg placeholder:text-hp-subtle focus-visible:border-green-500" />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )} />
              <Button type="submit" disabled={form.formState.isSubmitting}
                className="w-full bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600 text-white font-mono font-bold">
                {form.formState.isSubmitting ? 'Đang gửi...' : 'GỬI LINK ĐẶT LẠI'}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-green-600 dark:text-green-500 text-xs hover:text-green-500 dark:hover:text-green-400 font-mono">
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
