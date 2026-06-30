import { create } from 'zustand'
import { api } from '@/lib/api'

interface User { id: string; email: string }

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  fetchMe: async () => {
    try {
      const data = await api.get('/auth/me')
      if (data?.user) {
        set({ user: data.user, isAuthenticated: true })
      }
    } catch {
      // unauthenticated — silently ignore
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await api.post('/auth/login', { email, password })
      if (!data?.user) throw new Error('Login failed')
      set({ user: data.user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await api.post('/auth/register', { email, password })
      if (!data?.user) throw new Error('Register failed')
      set({ user: data.user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await api.post('/auth/logout')
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
