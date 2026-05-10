import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, upsertCustomerProfile } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, User, Sparkles, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import { registerOneSignalPlayer } from '../../lib/onesignal'

export default function Auth() {
  const { refreshCustomer } = useAuth()
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get('token')
  const urlMerchantId = searchParams.get('m')

  const merchantName = sessionStorage.getItem('fydly_pending_merchant_name') || 'votre commerçant'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [needsGdpr, setNeedsGdpr] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      const redirectTarget = (urlToken && urlMerchantId)
        ? `/scan?token=${urlToken}&m=${urlMerchantId}`
        : '/customer/card'
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTarget}`
        }
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // 0. Validation locale basique
      if (password.length < 8) {
        throw new Error("Le mot de passe doit contenir au moins 8 caractères.")
      }

      // 1. Authentification directe (Supabase Auth)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      let currentUser = authData?.user
      let isSignUp = false;
      const token = urlToken || sessionStorage.getItem('fydly_pending_token')
      const mId = urlMerchantId || sessionStorage.getItem('fydly_pending_merchant_id')

      if (authError) {
        // Si l'erreur est 400 (Bad Request) ou credentials invalides, on tente l'inscription après acceptation GDPR
        if (authError.status === 400 || authError.message.includes('Invalid login credentials') || authError.message.includes('User not found')) {
          if (!gdprAccepted) {
            setNeedsGdpr(true)
            toast.error("Nouveau compte ? Cochez la case pour continuer.")
            setIsSubmitting(false)
            return
          }

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: 'customer'
              }
            }
          })

          if (signUpError) {
            if (signUpError.message.includes('User already registered')) {
              throw new Error("Cet email est déjà enregistré. Mot de passe incorrect ?")
            }
            throw signUpError
          }
          currentUser = signUpData?.user
          isSignUp = true
        } else {
          throw authError
        }
      }

      if (!currentUser) {
        throw new Error("Impossible de récupérer les informations utilisateur.")
      }

      // Synchronisation du profil client
      try {
        const { error: profileErr } = await upsertCustomerProfile({
          userId: currentUser.id,
          email: currentUser.email!,
          firstName: firstName.trim() || undefined,
          gdprAccepted: true
        })

        if (profileErr) throw profileErr

        await refreshCustomer()

        // Enregistrer le player_id OneSignal si disponible (non bloquant)
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle()
        if (customerData?.id) {
          registerOneSignalPlayer(customerData.id)
        }
      } catch (profileErr: any) {
        // Non fatal si c'est une erreur de synchro
      }

      const targetUrl = (token && mId)
        ? `/scan?token=${token}&m=${mId}`
        : '/customer/card'

      if (isSignUp) {
        toast.success("Bienvenue chez Fydly !")
      } else {
        toast.success("Ravi de vous revoir !")
      }

      setTimeout(() => {
        window.location.href = targetUrl
      }, 500)

    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue lors de l'authentification.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-fydly-50 flex flex-col relative overflow-hidden">

      {/* Décoration de fond — cercles */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-fydly-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fydly-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Zone illustrative / Branding haut */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-14 pb-8">

        {/* Logo animé */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-fydly-500 rounded-[28px] shadow-lg shadow-fydly-500/30 flex items-center justify-center">
            <Sparkles size={36} className="text-white" />
          </div>
          {/* Badge tampon en attente */}
          {urlToken && (
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <Star size={12} className="text-white fill-white" />
            </div>
          )}
        </div>

        {/* Titre contextuel */}
        {urlToken ? (
          <div className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-fydly-500 rounded-[100px] text-white text-[11px] font-bold uppercase tracking-widest shadow-sm">
              <Zap size={11} fill="currentColor" />
              Tampon en attente
            </div>
            <h1 className="text-2xl sm:text-[32px] font-display text-fydly-900 leading-tight">
              Gagnez vos tampons<br />
              chez <span className="text-fydly-500">{merchantName}</span> !
            </h1>
            <p className="text-fydly-600 text-sm font-medium max-w-xs">
              Connectez-vous — votre tampon sera ajouté automatiquement.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2 animate-fade-in">
            <h1 className="text-2xl sm:text-[32px] font-display text-fydly-900 leading-tight">
              Votre espace<br />
              <span className="text-fydly-500">fidélité</span>
            </h1>
            <p className="text-fydly-600 text-sm font-medium">
              Connectez-vous pour accéder à vos cartes.
            </p>
          </div>
        )}
      </div>

      {/* Card principale */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-10 max-w-md w-full mx-auto animate-fade-in">
        <div className="bg-white rounded-card shadow-card border border-fydly-100/80 overflow-hidden">

          {/* Bandeau de confiance */}
          <div className="bg-gradient-to-r from-fydly-50 to-fydly-100/40 border-b border-fydly-100 px-6 py-3 flex items-center gap-2">
            <ShieldCheck size={15} className="text-green-500 shrink-0" />
            <p className="text-xs text-fydly-600 font-semibold">
              Déjà client&nbsp;? On vous reconnecte. Nouveau&nbsp;? On crée votre compte en un clic.
            </p>
          </div>

          <div className="p-6 space-y-6">

            {/* OAuth */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex justify-center items-center gap-3 border-2 border-fydly-100 rounded-btn px-4 h-12 text-sm font-bold text-fydly-900 bg-white hover:bg-fydly-50 hover:border-fydly-200 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden="true" className="w-5 h-5" />
                Continuer avec Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                className="flex justify-center items-center gap-3 bg-fydly-900 rounded-btn px-4 h-12 text-sm font-bold text-white hover:bg-fydly-800 active:scale-[0.98] transition-all duration-200 shadow-sm shadow-fydly-900/20"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="" aria-hidden="true" className="w-4 h-4 invert" />
                Continuer avec Apple
              </button>
            </div>

            {/* Séparateur */}
            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-fydly-100" />
              </div>
              <span className="relative px-4 bg-white text-fydly-300 text-[11px] font-bold uppercase tracking-widest">ou par email</span>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-fydly-400 uppercase tracking-[2px]">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-300 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-btn border-2 border-fydly-100 bg-fydly-50/40 pl-11 pr-4 h-12 text-fydly-900 placeholder-fydly-200 focus:outline-none focus:border-fydly-400 focus:bg-white focus:ring-4 focus:ring-fydly-500/8 transition-all font-medium text-sm"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-fydly-400 uppercase tracking-[2px]">Mot de passe</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-300 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-btn border-2 border-fydly-100 bg-fydly-50/40 pl-11 pr-4 h-12 text-fydly-900 placeholder-fydly-200 focus:outline-none focus:border-fydly-400 focus:bg-white focus:ring-4 focus:ring-fydly-500/8 transition-all font-medium text-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Champs inscription (apparaissent si nouveau compte) */}
              {needsGdpr && (
                <div className="animate-fade-in space-y-4 pt-1">

                  {/* Séparateur section nouveau compte */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-fydly-100" />
                    <span className="text-[11px] text-fydly-400 font-bold uppercase tracking-widest whitespace-nowrap">Nouveau compte</span>
                    <div className="flex-1 h-px bg-fydly-100" />
                  </div>

                  {/* Prénom */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-fydly-400 uppercase tracking-[2px]">
                      Prénom <span className="text-fydly-200 normal-case font-normal tracking-normal">(optionnel)</span>
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-300 pointer-events-none" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full rounded-btn border-2 border-fydly-100 bg-fydly-50/40 pl-11 pr-4 h-12 text-fydly-900 placeholder-fydly-200 focus:outline-none focus:border-fydly-400 focus:bg-white focus:ring-4 focus:ring-fydly-500/8 transition-all font-medium text-sm"
                        placeholder="Votre prénom"
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  {/* RGPD */}
                  <label className="flex items-start gap-3 p-4 bg-fydly-50 rounded-card border border-fydly-100 cursor-pointer hover:bg-fydly-100/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={gdprAccepted}
                      onChange={e => setGdprAccepted(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded text-fydly-500 focus:ring-fydly-500 border-fydly-200 shrink-0"
                    />
                    <span className="text-xs text-fydly-700 leading-relaxed font-medium">
                      J'accepte les <span className="text-fydly-500 underline underline-offset-2">conditions d'utilisation</span> et la <span className="text-fydly-500 underline underline-offset-2">politique de confidentialité</span> de Fydly.
                    </span>
                  </label>
                </div>
              )}

              {/* CTA */}
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full h-13 text-base font-bold shadow-lg shadow-fydly-500/25 mt-2"
              >
                <span className="flex items-center justify-center gap-2">
                  Continuer
                  <ArrowRight size={18} />
                </span>
              </Button>
            </form>
          </div>
        </div>

        {/* Mention de confiance bas */}
        <p className="text-center text-fydly-300 text-[11px] font-medium mt-5 leading-relaxed">
          Fydly ne partage jamais vos données · 100 % gratuit pour les clients
        </p>
      </div>
    </div>
  )
}
