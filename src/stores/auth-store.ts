import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type AuthProfile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  profile: AuthProfile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: AuthProfile | null) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, profile: null, isLoading: false }),
}))
