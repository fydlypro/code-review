import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, upsertCustomerProfile } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
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
  const [showPassword, setShowPassword] = useState(false)
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [needsGdpr, setNeedsGdpr] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const scanContext = !!urlToken

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
      if (password.length < 8) {
        throw new Error("Le mot de passe doit contenir au moins 8 caractères.")
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      let currentUser = authData?.user
      let isSignUp = false
      const token = urlToken || sessionStorage.getItem('fydly_pending_token')
      const mId = urlMerchantId || sessionStorage.getItem('fydly_pending_merchant_id')

      if (authError) {
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
              data: { role: 'customer' }
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

      try {
        const { error: profileErr } = await upsertCustomerProfile({
          userId: currentUser.id,
          email: currentUser.email!,
          firstName: firstName.trim() || undefined,
          gdprAccepted: true
        })

        if (profileErr) throw profileErr

        await refreshCustomer()

        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle()
        if (customerData?.id) {
          registerOneSignalPlayer(customerData.id)
        }
      } catch {
        // Non fatal
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
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)' }}
    >
      {/* Blobs de fond */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-40px', right: '-60px',
          width: 280, height: 280,
          borderRadius: '50%',
          background: 'rgba(147,197,253,0.3)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-40px', left: '-50px',
          width: 260, height: 260,
          borderRadius: '50%',
          background: 'rgba(165,180,252,0.25)',
          filter: 'blur(60px)',
        }}
      />

      {/* Zone logo + titre */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-14 pb-8">

        {/* Logo */}
        <div className="relative mb-5">
          <div
            className="w-16 h-16 bg-gradient-bv shadow-glow-strong flex items-center justify-center"
            style={{ borderRadius: 18 }}
          >
            <Zap size={30} className="text-white fill-white" />
          </div>
          {scanContext && (
            <div
              className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow animate-pulse"
              aria-hidden="true"
            >
              <span style={{ fontSize: 13 }}>⭐</span>
            </div>
          )}
        </div>
        <span className="text-slate-400 text-sm font-semibold mb-6">Fydly·</span>

        {/* Texte contextuel */}
        {scanContext ? (
          <div className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-bv text-white rounded-full shadow"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Zap size={10} fill="currentColor" />
              TAMPON EN ATTENTE
            </div>
            <h1
              className="font-display text-slate-900 leading-tight"
              style={{ fontSize: 26, fontWeight: 700 }}
            >
              Gagnez vos tampons<br />
              chez <span className="text-fydly-500">{merchantName}</span> !
            </h1>
            <p className="text-slate-500 text-sm max-w-xs">
              Connectez-vous — votre tampon sera ajouté automatiquement.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2 animate-fade-in">
            <h1
              className="font-display text-slate-900 leading-tight"
              style={{ fontSize: 26, fontWeight: 700 }}
            >
              Votre espace<br />
              <span className="text-fydly-500">fidélité</span>
            </h1>
            <p className="text-slate-500 text-sm">
              Connectez-vous pour voir vos cartes.
            </p>
          </div>
        )}
      </div>

      {/* Card formulaire */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-10 max-w-md w-full mx-auto animate-fade-in">
        <div className="bg-white border border-slate-100 shadow-card overflow-hidden" style={{ borderRadius: 24 }}>

          {/* Trust banner */}
          <div
            className="flex items-center gap-2 border-b border-slate-100 px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, rgba(219,234,254,0.4))' }}
          >
            <ShieldCheck size={15} className="text-green-500 shrink-0" />
            <p style={{ fontSize: 11 }} className="text-slate-600">
              Déjà client ? On vous reconnecte. Nouveau ? Compte créé en 1 clic.
            </p>
          </div>

          <div className="p-[18px] space-y-4">

            {/* OAuth Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="w-full flex justify-center items-center gap-3 border-2 border-slate-200 bg-white rounded-btn active:scale-[0.98] transition-all duration-200"
              style={{ height: 50 }}
            >
              {/* Google SVG logo */}
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.14 0 5.96 1.08 8.18 2.86l6.1-6.1C34.46 3.07 29.52 1 24 1 14.82 1 7.07 6.47 3.59 14.24l7.12 5.53C12.4 13.77 17.75 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.52 24.5c0-1.61-.14-3.17-.4-4.68H24v8.85h12.65c-.55 2.94-2.21 5.43-4.71 7.11l7.22 5.61C43.31 37.38 46.52 31.38 46.52 24.5z"/>
                <path fill="#FBBC05" d="M10.71 28.23A14.56 14.56 0 0 1 9.5 24c0-1.47.25-2.89.71-4.23L3.09 14.24A23.94 23.94 0 0 0 0 24c0 3.86.93 7.5 2.59 10.71l7.12-5.53 1-.95z"/>
                <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.53-4.97l-7.22-5.61c-1.82 1.22-4.14 1.94-6.31 1.94-6.25 0-11.6-4.27-13.29-10.03l-7.12 5.53C7.07 41.53 14.82 47 24 47z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              <span className="text-slate-900 font-semibold text-sm">Continuer avec Google</span>
            </button>

            {/* OAuth Apple */}
            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              className="w-full flex justify-center items-center gap-3 bg-slate-900 text-white rounded-btn active:scale-[0.98] transition-all duration-200"
              style={{ height: 50 }}
            >
              {/* Apple SVG logo */}
              <svg width="18" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="white">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-151.7-97.8C40.7 787.9 0 666.6 0 549.8 0 329.8 141.5 214.5 280.8 214.5c69.4 0 127.2 45.6 170.5 45.6 42 0 107.9-48.2 186.7-48.2 30 0 108.2 2.6 168.5 80zm-87.9-227.6c37.9-44.2 65.5-107.2 65.5-170.1 0-8.9-.6-17.9-2-26.2C699.9 27.3 631 66.9 591 111.5c-34.6 39.4-69.4 102.5-69.4 167.5 0 9.6.9 18.8 2.6 27.2 3.9.6 9.9 1.3 15.9 1.3 54.5 0 119.7-36.6 160-93.2z"/>
              </svg>
              <span className="font-semibold text-sm">Continuer avec Apple</span>
            </button>

            {/* Séparateur */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span
                className="relative bg-white px-3 text-slate-300 font-bold tracking-widest"
                style={{ fontSize: 10 }}
              >
                OU PAR EMAIL
              </span>
            </div>

            {/* Formulaire email */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-btn border-2 border-slate-200 bg-white pl-11 pr-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-fydly-500 transition-all text-sm font-medium"
                  style={{ height: 50 }}
                />
              </div>

              {/* Mot de passe */}
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="w-full rounded-btn border-2 border-slate-200 bg-white pl-11 pr-12 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-fydly-500 transition-all text-sm font-medium"
                  style={{ height: 50 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Section GDPR (nouveau compte) */}
              {needsGdpr && (
                <div
                  className="animate-slide-down rounded-[12px] border border-blue-100 p-3 space-y-2"
                  style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)' }}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={gdprAccepted}
                        onChange={e => setGdprAccepted(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        onClick={() => setGdprAccepted(v => !v)}
                        className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all cursor-pointer ${
                          gdprAccepted
                            ? 'bg-fydly-500 border-fydly-500'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {gdprAccepted && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 12 }} className="text-slate-700 leading-relaxed">
                      J'accepte la politique de confidentialité et les CGU.
                    </span>
                  </label>
                  <p style={{ fontSize: 11 }} className="text-slate-500 pl-7">
                    🔒 Vos données restent les vôtres. Aucun partage tiers.
                  </p>
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-bv text-white font-bold rounded-btn shadow-glow-strong active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ height: 56, fontSize: 15 }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Continuer →'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Mention bas */}
        <p
          className="text-center text-slate-300 mt-5 leading-relaxed"
          style={{ fontSize: 11 }}
        >
          Fydly ne partage jamais vos données · 100% gratuit pour les clients
        </p>
      </div>
    </div>
  )
}
