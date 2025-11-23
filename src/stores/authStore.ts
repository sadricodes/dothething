import { create } from 'zustand'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ loading: false })
      return { error }
    }

    set({
      user: data.user,
      session: data.session,
      loading: false,
    })

    return { error: null }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      set({ loading: false })
      return { error }
    }

    set({
      user: data.user,
      session: data.session,
      loading: false,
    })

    return { error: null }
  },

  signOut: async () => {
    set({ loading: true })

    await supabase.auth.signOut()

    set({
      user: null,
      session: null,
      loading: false,
    })
  },

  initialize: async () => {
    set({ loading: true })

    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    set({
      user: session?.user ?? null,
      session,
      loading: false,
      initialized: true,
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
      })
    })
  },
}))
