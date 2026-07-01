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
    <Card className="w-full max-w-md bg-hp-card border-hp-border">
      <CardHeader>
        <CardTitle className="text-green-700 dark:text-green-400 font-mono">HACKER PATH</CardTitle>
        <CardDescription className="text-hp-muted">Đăng nhập để sync progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-hp-fg">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="hacker@example.com"
                      className="bg-hp-surface border-hp-border text-hp-fg placeholder:text-hp-subtle focus-visible:border-green-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-hp-fg">Mật khẩu</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="bg-hp-surface border-hp-border text-hp-fg placeholder:text-hp-subtle focus-visible:border-green-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-red-500 dark:text-red-400 text-sm">{form.formState.errors.root.message}</p>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600 text-white font-mono font-bold"
            >
              {isLoading ? 'Đang đăng nhập...' : '> ĐĂNG NHẬP'}
            </Button>
            <div className="text-center mt-2">
              <Link href="/forgot-password" className="text-green-600 dark:text-green-500 text-xs hover:text-green-500 dark:hover:text-green-400 font-mono">
                Quên mật khẩu?
              </Link>
            </div>
            <p className="text-center text-hp-muted text-sm">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-green-600 dark:text-green-400 hover:underline font-semibold">
                Đăng ký
              </Link>
            </p>
            <p className="text-center text-hp-subtle text-xs">
              Hoặc{' '}
              <Link href="/" className="text-hp-muted hover:text-hp-fg">
                chơi không cần đăng nhập
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
