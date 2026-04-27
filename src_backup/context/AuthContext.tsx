import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type CustomerRow } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  customerProfile: CustomerRow | null
  loading: boolean
  signOut: () => Promise<void>
  refreshCustomerProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [customerProfile, setCustomerProfile] = useState<CustomerRow | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCustomerProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      setCustomerProfile(data as CustomerRow | null)
    } catch {
      setCustomerProfile(null)
    }
  }, [])

  const refreshCustomerProfile = useCallback(async () => {
    if (user) await loadCustomerProfile(user.id)
  }, [user, loadCustomerProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadCustomerProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadCustomerProfile(session.user.id)
      } else {
        setCustomerProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadCustomerProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setCustomerProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, customerProfile, loading, signOut, refreshCustomerProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
