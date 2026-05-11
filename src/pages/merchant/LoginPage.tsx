import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

// ── Sparkline SVG (clients ce mois) ──────────────────────────────────────────
function SparklineGreen() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="0,22 13,18 26,20 39,12 52,14 65,8 80,4"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="0,22 13,18 26,20 39,12 52,14 65,8 80,4 80,28 0,28"
        fill="url(#sparkGradient)"
        opacity="0.15"
      />
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Circular Gauge SVG (score Fydly) ─────────────────────────────────────────
function CircularGauge({ value, max }: { value: number; max: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const pct = value / max
  const dash = pct * circ
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <text x="26" y="30" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="monospace">
        {value}
      </text>
    </svg>
  )
}

// ── Panneau gauche ────────────────────────────────────────────────────────────
function MerchantAuthLeft() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[55%] min-h-screen p-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
    >
      {/* Pattern SVG diagonal */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>
      </div>

      {/* Blobs */}
      <div
        className="absolute -top-20 right-0 w-[420px] h-[420px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(37,99,235,0.25)' }}
      />
      <div
        className="absolute bottom-0 -left-20 w-[360px] h-[360px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(124,58,237,0.18)' }}
      />

      {/* Logo + pill */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
          <Zap size={18} className="text-white" fill="currentColor" />
        </div>
        <span className="font-display text-2xl text-white tracking-tight">Fydly⚡</span>
        <span
          className="ml-2 text-[11px] font-bold text-white/70 uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Espace professionnel
        </span>
      </div>

      {/* Headline + cards */}
      <div className="relative z-10 space-y-10">
        <div>
          <h2 className="font-display text-5xl text-white leading-tight mb-4" style={{ fontSize: '48px' }}>
            Pilotez votre<br />fidélisation.{' '}
            <span
              className="italic"
              style={{ background: 'linear-gradient(90deg,#2563EB,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              En temps réel.
            </span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Dashboard analytics, notifications push, segmentation clients — tout en un seul endroit.
          </p>
        </div>

        {/* 3 Glass cards */}
        <div className="grid grid-cols-1 gap-3 max-w-sm">

          {/* Card 1 — Clients ce mois */}
          <div
            className="flex items-center justify-between px-5 py-4 rounded-2xl border animate-float"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div>
              <p className="text-white/50 text-xs font-medium mb-1">Clients ce mois</p>
              <p className="text-white font-mono text-2xl font-bold">247</p>
            </div>
            <SparklineGreen />
          </div>

          {/* Card 2 — Satisfaction */}
          <div
            className="flex items-center justify-between px-5 py-4 rounded-2xl border"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
              animation: 'float 3s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          >
            <div>
              <p className="text-white/50 text-xs font-medium mb-1">Satisfaction</p>
              <p className="text-white font-mono text-2xl font-bold">96%</p>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L8 1z" />
                </svg>
              ))}
            </div>
          </div>

          {/* Card 3 — Score Fydly */}
          <div
            className="flex items-center justify-between px-5 py-4 rounded-2xl border"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
              animation: 'float 3s ease-in-out infinite',
              animationDelay: '1s',
            }}
          >
            <div>
              <p className="text-white/50 text-xs font-medium mb-1">Score Fydly</p>
              <p className="text-white font-mono text-2xl font-bold">78/100</p>
            </div>
            <CircularGauge value={78} max={100} />
          </div>
        </div>
      </div>

      {/* Footer légal */}
      <p className="relative z-10 text-white/40 text-xs">
        © 2026 Fydly · Confidentialité · CGV
      </p>
    </div>
  )
}

// ── Composant FloatingInput ───────────────────────────────────────────────────
interface FloatingInputProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  icon: React.ReactNode
  autoComplete?: string
  required?: boolean
  minLength?: number
  rightSlot?: React.ReactNode
}

function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  icon,
  autoComplete,
  required,
  minLength,
  rightSlot,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false)
  const isFloating = focused || value.length > 0

  return (
    <div className="relative" style={{ height: '52px' }}>
      {/* Icône gauche */}
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
        {icon}
      </span>

      {/* Floating label */}
      <label
        htmlFor={id}
        className="absolute left-12 pointer-events-none transition-all duration-200 z-10"
        style={{
          top: isFloating ? '6px' : '50%',
          transform: isFloating ? 'translateY(0) scale(0.78)' : 'translateY(-50%)',
          transformOrigin: 'left',
          color: focused ? '#2563EB' : '#94A3B8',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="absolute inset-0 w-full bg-white border-2 rounded-[14px] pl-12 pr-4 pt-5 pb-1 text-slate-900 text-[15px] transition-all duration-200 outline-none"
        style={{
          borderColor: focused ? '#2563EB' : '#E2E8F0',
          boxShadow: focused ? '0 0 0 4px rgba(37,99,235,0.08)' : 'none',
        }}
      />

      {/* Slot droit (icône toggle) */}
      {rightSlot && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          {rightSlot}
        </span>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MerchantLogin() {
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        toast.success('Connexion réussie')
        // La redirection est gérée automatiquement par MerchantPublicRoute
      }
    } catch (err: any) {
      console.error(err)
      toast.error(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : 'Erreur lors de la connexion'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Veuillez entrer votre email pour réinitialiser le mot de passe.')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/merchant/settings',
      })
      if (error) throw error
      toast.success('Lien de réinitialisation envoyé par email.')
    } catch (err: any) {
      toast.error("Erreur lors de l'envoi de l'email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche */}
      <MerchantAuthLeft />

      {/* Panneau droit */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Header compact mobile uniquement */}
        <div
          className="lg:hidden flex items-center gap-3 px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
        >
          <div className="w-8 h-8 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="font-display text-xl text-white">Fydly⚡</span>
          <span className="ml-auto text-white/60 text-sm font-medium">Bon retour&nbsp;!</span>
        </div>

        {/* Corps du formulaire */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px] animate-fade-in">

            {/* Pill sécurité */}
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-7">
              <ShieldCheck size={13} />
              Connexion sécurisée
            </div>

            {/* Titre */}
            <h1 className="font-display text-[36px] text-slate-900 leading-tight mb-2">
              Bon retour&nbsp;!
            </h1>
            <p className="text-slate-500 text-base font-medium mb-8">
              Accédez à votre tableau de bord.
            </p>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">

              <FloatingInput
                id="login-email"
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={18} />}
                autoComplete="email"
                required
              />

              <FloatingInput
                id="login-password"
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                autoComplete="current-password"
                required
                minLength={8}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Mot de passe oublié */}
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-xs text-fydly-500 hover:text-fydly-700 font-semibold transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* CTA principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white font-bold text-base rounded-[14px] transition-all duration-200 shadow-glow-strong disabled:opacity-60"
                style={{
                  height: '52px',
                  background: loading ? '#94A3B8' : 'linear-gradient(135deg,#2563EB,#7C3AED)',
                }}
              >
                {loading ? (
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>Se connecter <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs font-semibold">ou</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Boutons sociaux */}
            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 rounded-[14px] text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                style={{ height: '48px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-slate-900 rounded-[14px] text-white font-semibold text-sm hover:bg-slate-800 transition-all"
                style={{ height: '48px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.05 2.24.72 3.01.74.98-.2 1.93-.89 2.98-.78 1.28.14 2.22.66 2.85 1.6-2.56 1.44-1.93 4.55.47 5.43-.56 1.5-1.28 2.95-2.31 3.89zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continuer avec Apple
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-slate-500 mt-8 font-medium">
              Pas encore de compte ?{' '}
              <Link
                to="/merchant/register"
                className="text-fydly-600 font-bold hover:text-fydly-700 transition-colors"
              >
                Créer un compte →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
