'use client'

import { useCallback, useEffect } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { ROUTES } from '@/constants/routes'

let authListenerStarted = false

async function loadProfile(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  useAuthStore.getState().setProfile(data)
}

function startAuthListener() {
  if (authListenerStarted) return
  authListenerStarted = true

  const supabase = createClient()

  void supabase.auth.getSession().then(({ data: { session } }) => {
    const currentUser = session?.user ?? null
    useAuthStore.getState().setUser(currentUser)
    if (currentUser) {
      void loadProfile(currentUser.id).finally(() => {
        useAuthStore.getState().setLoading(false)
      })
    } else {
      useAuthStore.getState().setLoading(false)
    }
  })

  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.getState().reset()
      return
    }

    if (event === 'TOKEN_REFRESHED') {
      useAuthStore.getState().setUser(session?.user ?? null)
      return
    }

    const nextUser = session?.user ?? null
    useAuthStore.getState().setUser(nextUser)

    if (nextUser) {
      void loadProfile(nextUser.id).finally(() => {
        useAuthStore.getState().setLoading(false)
      })
    } else {
      useAuthStore.getState().setProfile(null)
      useAuthStore.getState().setLoading(false)
    }
  })
}

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    startAuthListener()
  }, [])

  const refreshProfile = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) return
    await loadProfile(currentUser.id)
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

  return { user, profile, isLoading, signOut, refreshProfile }
}
