'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { registerSchema, type RegisterInput } from '@/lib/schemas'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '' },
  })

  async function onSubmit(values: RegisterInput) {
    try {
      await register(values.email, values.password, values.displayName || undefined)
      router.push('/')
    } catch {
      form.setError('root', { message: 'Email đã được sử dụng hoặc có lỗi xảy ra' })
    }
  }

  return (
    <Card className="w-full max-w-md bg-gray-900 border-green-800 text-green-400">
      <CardHeader>
        <CardTitle className="text-green-400 font-mono">HACKER PATH</CardTitle>
        <CardDescription className="text-green-600">Tạo tài khoản để lưu progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-500">Tên hiển thị</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Tên của bạn (tùy chọn)"
                      className="bg-black border-green-800 text-green-400 placeholder:text-green-900 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-500">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="hacker@example.com"
                      className="bg-black border-green-800 text-green-400 placeholder:text-green-900 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-500">Mật khẩu</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Tối thiểu 8 ký tự"
                      className="bg-black border-green-800 text-green-400 placeholder:text-green-900 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-500">Nhập lại mật khẩu</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="bg-black border-green-800 text-green-400 placeholder:text-green-900 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-red-400 text-sm">{form.formState.errors.root.message}</p>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-800 hover:bg-green-700 text-black font-mono font-bold"
            >
              {isLoading ? 'Đang tạo tài khoản...' : '> ĐĂNG KÝ'}
            </Button>
            <p className="text-center text-green-700 text-sm">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-green-500 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
