'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { loginSchema, type LoginInput } from '@/lib/schemas'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginInput) {
    try {
      await login(values.email, values.password)
      router.push('/')
    } catch {
      form.setError('root', { message: 'Email hoặc mật khẩu không đúng' })
    }
  }

  return (
    <Card className="w-full max-w-md bg-gray-900 border-green-800 text-green-400">
      <CardHeader>
        <CardTitle className="text-green-400 font-mono">HACKER PATH</CardTitle>
        <CardDescription className="text-green-600">Đăng nhập để sync progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              {isLoading ? 'Đang đăng nhập...' : '> ĐĂNG NHẬP'}
            </Button>
            <p className="text-center text-green-700 text-sm">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-green-500 hover:underline">
                Đăng ký
              </Link>
            </p>
            <p className="text-center text-green-800 text-xs">
              Hoặc{' '}
              <Link href="/" className="text-green-700 hover:underline">
                chơi không cần đăng nhập
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
