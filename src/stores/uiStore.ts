import { create } from 'zustand'

interface UIState {
  loginModalOpen: boolean
  setLoginModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  loginModalOpen: false,
  setLoginModalOpen: (open) => set({ loginModalOpen: open }),
}))
