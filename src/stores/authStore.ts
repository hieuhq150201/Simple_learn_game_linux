import { create } from 'zustand'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  updateUser: (partial: Partial<User>) => void
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  updateUser: (partial) => {
    const current = get().user
    if (current) set({ user: { ...current, ...partial } })
  },

  fetchMe: async () => {
    try {
      const data = await api.get('/users/me')
      if (data?.id) {
        set({
          user: {
            id: data.id,
            email: data.email,
            displayName: data.displayName ?? null,
            bio: data.bio ?? null,
            avatarUrl: data.avatarUrl ?? null,
          },
          isAuthenticated: true,
        })
      }
    } catch {
      // unauthenticated — silently ignore
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await api.post('/auth/login', { email, password })
      if (!data?.id) throw new Error('Login failed')
      set({
        user: {
          id: data.id,
          email: data.email,
          displayName: data.displayName ?? null,
          bio: data.bio ?? null,
          avatarUrl: data.avatarUrl ?? null,
        },
        isAuthenticated: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await api.post('/auth/register', { email, password })
      if (!data?.id) throw new Error('Register failed')
      set({
        user: {
          id: data.id,
          email: data.email,
          displayName: data.displayName ?? null,
          bio: data.bio ?? null,
          avatarUrl: data.avatarUrl ?? null,
        },
        isAuthenticated: true,
      })
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
