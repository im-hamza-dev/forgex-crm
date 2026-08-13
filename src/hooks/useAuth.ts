'use client'

import { useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { ROUTES } from '@/constants/routes'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    const supabase = createClient()

    const loadProfile = async (userId: string) => {
      console.log('[useAuth] loadProfile called with userId:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      console.log('[useAuth] loadProfile result:', { data, error })
      useAuthStore.getState().setProfile(data)
    }

    const init = async () => {
      console.log('[useAuth] init started')
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('[useAuth] getSession result:', { session, error })
      const currentUser = session?.user ?? null
      useAuthStore.getState().setUser(currentUser)
      if (currentUser) {
        await loadProfile(currentUser.id)
      } else {
        console.log('[useAuth] no user in session')
      }
      useAuthStore.getState().setLoading(false)
      console.log('[useAuth] init complete')
    }

    void init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] onAuthStateChange event:', event, 'session:', session?.user?.id)

        if (event === 'SIGNED_OUT') {
          useAuthStore.getState().reset()
          return
        }

        const nextUser = session?.user ?? null
        useAuthStore.getState().setUser(nextUser)

        if (nextUser) {
          await loadProfile(nextUser.id)
        } else {
          useAuthStore.getState().setProfile(null)
        }

        useAuthStore.getState().setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (err) {
      console.warn('signOut error:', err)
    } finally {
      useAuthStore.getState().reset()
      window.location.href = ROUTES.LOGIN
    }
  }, [])

  return { user, profile, isLoading, signOut }
}