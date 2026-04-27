import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, Merchant, Customer } from '../lib/supabase'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthContextType {
  session: Session | null
  user: User | null
  merchant: Merchant | null
  customer: Customer | null
  loading: boolean
  isMerchant: boolean
  isCustomer: boolean
  refreshMerchant: () => Promise<void>
  refreshCustomer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  merchant: null,
  customer: null,
  loading: true,
  isMerchant: false,
  isCustomer: false,
  refreshMerchant: async () => {},
  refreshCustomer: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMerchant = async (userId: string) => {
    const { data } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (data) setMerchant(data) // Don't wipe if null here to avoid side effects
  }

  const fetchCustomer = async (userId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (data) setCustomer(data)
  }

  const loadProfiles = async (sessionData: Session) => {
    // Determine the path context: are we trying to log in as Merchant or Customer?
    // Since roles aren't strictly partitioned in Supabase auth out-of-the-box (we rely on tables),
    // we fetch both locally.
    await Promise.all([
      fetchMerchant(sessionData.user.id),
      fetchCustomer(sessionData.user.id)
    ])
  }

  const refreshMerchant = async () => {
    if (session?.user?.id) {
      await fetchMerchant(session.user.id)
    }
  }

  const refreshCustomer = async () => {
    if (session?.user?.id) {
      await fetchCustomer(session.user.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) {
        loadProfiles(session).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user?.id) {
        await loadProfiles(session)
      } else {
        setMerchant(null)
        setCustomer(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      merchant,
      customer,
      loading,
      isMerchant: !!merchant,
      isCustomer: !!customer,
      refreshMerchant,
      refreshCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// =========================================================
// Loading component pour les routes
// =========================================================
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fydly-50">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-serif font-bold text-fydly-900">
          Fydly<span className="text-fydly-500">·</span>
        </div>
        <div className="spinner border-fydly-500 w-6 h-6" />
      </div>
    </div>
  )
}

// =========================================================
// Routes Commerçant (Merchant)
// =========================================================

export function MerchantRoute({ children }: { children: React.ReactNode }) {
  const { session, merchant, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/merchant/login" replace />
  if (!merchant) return <Navigate to="/merchant/onboarding" replace />

  return <>{children}</>
}

export function MerchantPublicRoute({ children }: { children: React.ReactNode }) {
  const { session, merchant, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (session && merchant) return <Navigate to="/merchant/dashboard" replace />

  return <>{children}</>
}

// =========================================================
// Routes Client (Customer)
// =========================================================

export function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { session, customer, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  // If no session or no customer profile -> redirect to auth, keeping the URL parameters (tokens)
  if (!session || !customer) {
    return <Navigate to={`/customer/auth${location.search}`} replace />
  }

  return <>{children}</>
}

export function CustomerPublicRoute({ children }: { children: React.ReactNode }) {
  const { session, customer, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  // If already authenticated securely as a customer -> redirect to card, keep params to process stamp
  if (session && customer) {
    return <Navigate to={`/customer/card${location.search}`} replace />
  }

  return <>{children}</>
}
