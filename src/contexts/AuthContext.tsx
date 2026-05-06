import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, Merchant, Customer } from '../lib/supabase'
import { Navigate, useLocation } from 'react-router-dom'
import { registerOneSignalPlayer } from '../lib/onesignal'

interface AuthContextType {
  session: Session | null
  user: User | null
  merchant: Merchant | null
  customer: Customer | null
  loading: boolean
  isMerchant: boolean
  isCustomer: boolean
  isAdmin: boolean
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
  isAdmin: false,
  refreshMerchant: async () => {},
  refreshCustomer: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMerchant = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      if (data) setMerchant(data)
    } catch (err) {
      // Silently fail — profil commerçant non chargé
    }
  }

  const fetchCustomer = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      if (data) setCustomer(data)
    } catch (err) {
      // Silently fail — profil client non chargé
    }
  }

  const loadProfiles = async (sessionData: Session) => {
    try {
      await Promise.all([
        fetchMerchant(sessionData.user.id),
        fetchCustomer(sessionData.user.id)
      ])
    } catch (err) {
      // Silently fail
    }
  }

  const refreshMerchant = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const id = currentSession?.user?.id || session?.user?.id
    if (id) {
      await fetchMerchant(id)
    }
  }

  const refreshCustomer = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const id = currentSession?.user?.id || session?.user?.id
    if (id) {
      await fetchCustomer(id)
    }
  }

  // Enregistrement automatique du subscription ID OneSignal à chaque chargement du profil client
  useEffect(() => {
    if (customer?.id) {
      registerOneSignalPlayer(customer.id).catch(() => {})
    }
  }, [customer?.id])

  useEffect(() => {
    let mounted = true
    // Évite le double chargement des profils : initAuth ET onAuthStateChange(SIGNED_IN)
    // se déclenchent tous les deux au premier montage (comportement documenté du SDK Supabase).
    // Ce flag garantit que loadProfiles n'est appelé qu'une seule fois.
    let profilesLoadedByInit = false

    const initAuth = async () => {
      const timeout = setTimeout(() => {
        if (mounted) setLoading(false)
      }, 5000)

      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (mounted) {
          setSession(currentSession)
          if (currentSession?.user?.id) {
            profilesLoadedByInit = true
            loadProfiles(currentSession).finally(() => {
              if (mounted) {
                setLoading(false)
                clearTimeout(timeout)
              }
            })
          } else {
            setLoading(false)
            clearTimeout(timeout)
          }
        }
      } catch (err) {
        if (mounted) {
          setLoading(false)
          clearTimeout(timeout)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return
      setSession(newSession)

      if (newSession?.user?.id) {
        // Ignorer le SIGNED_IN initial si initAuth a déjà lancé le chargement,
        // pour éviter deux Promise.all([fetchMerchant, fetchCustomer]) concurrents.
        if (event === 'SIGNED_IN' && profilesLoadedByInit) {
          profilesLoadedByInit = false
          return
        }
        if (event === 'SIGNED_IN') {
          setLoading(true)
          const signInTimeout = setTimeout(() => {
            if (mounted) setLoading(false)
          }, 5000)
          loadProfiles(newSession).finally(() => {
            clearTimeout(signInTimeout)
            if (mounted) setLoading(false)
          })
        } else {
          loadProfiles(newSession).finally(() => {
            if (mounted) setLoading(false)
          })
        }
      } else {
        setMerchant(null)
        setCustomer(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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
      isAdmin: session?.user?.app_metadata?.role === 'admin',
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
  
  if (session) {
    if (merchant) return <Navigate to="/merchant/dashboard" replace />
    // Si connecté mais pas de profil commerçant -> on l'envoie vers l'onboarding au lieu du login/register
    return <Navigate to="/merchant/onboarding" replace />
  }

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

// =========================================================
// Routes Admin
// =========================================================

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

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
