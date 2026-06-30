'use client'
import { create } from 'zustand'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await api.post('/auth/login', { email, password })
      if (data?.id) {
        set({ user: { id: data.id, email: data.email }, isAuthenticated: true })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await api.post('/auth/register', { email, password })
      if (data?.id) {
        set({ user: { id: data.id, email: data.email }, isAuthenticated: true })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {})
    set({ user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    try {
      const data = await api.get('/users/me')
      if (data?.id) {
        set({ user: { id: data.id, email: data.email }, isAuthenticated: true })
      }
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
