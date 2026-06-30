'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, register, logout, fetchMe } = useAuthStore()

  useEffect(() => {
    // fetch user info một lần khi app load — nếu có cookie hợp lệ sẽ auto-populate
    if (!isAuthenticated && !isLoading) {
      fetchMe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { user, isAuthenticated, isLoading, login, register, logout }
}
