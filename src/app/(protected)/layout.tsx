'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, fetchMe } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // fetchMe on every full-page load; only then can we know if user is authed
    fetchMe().finally(() => setChecked(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (checked && !isAuthenticated) router.replace('/login')
  }, [checked, isAuthenticated, router])

  if (!checked || !isAuthenticated) return null
  return <>{children}</>
}
