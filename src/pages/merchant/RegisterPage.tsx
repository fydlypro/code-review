import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Check,
  X,
  Store,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function SparklineGreen() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="0,22 13,18 26,20 39,12 52,14 65,8 80,4"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="0,22 13,18 26,20 39,12 52,14 65,8 80,4 80,28 0,28"
        fill="#22C55E"
        opacity="0.12"
      />
    </svg>
  )
}

// ── Circular Gauge SVG ────────────────────────────────────────────────────────
function CircularGauge({ value, max }: { value: number; max: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (value / max) * circ
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="url(#gaugeGrad2)"
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <defs>
        <linearGradient id="gaugeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
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

// ── Panneau gauche register ───────────────────────────────────────────────────
function MerchantAuthLeftRegister() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[45%] min-h-screen p-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
    >
      {/* Pattern diagonal */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagR" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagR)" />
        </svg>
      </div>

      {/* Blobs */}
      <div
        className="absolute -top-20 right-0 w-[380px] h-[380px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(37,99,235,0.25)' }}
      />
      <div
        className="absolute bottom-0 -left-16 w-[320px] h-[320px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(124,58,237,0.18)' }}
      />

      {/* Logo */}
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
          <h2 className="font-display text-white leading-tight mb-4" style={{ fontSize: '42px' }}>
            Démarrez en<br />10 minutes.{' '}
            <span
              className="italic"
              style={{ background: 'linear-gradient(90deg,#2563EB,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Sans friction.
            </span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Configurez votre programme de fidélité en quelques clics. Pas de technique, pas de paperasse.
          </p>
        </div>

        {/* Glass cards */}
        <div className="grid grid-cols-1 gap-3 max-w-sm">
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

      <p className="relative z-10 text-white/40 text-xs">
        © 2026 Fydly · Confidentialité · CGV
      </p>
    </div>
  )
}

// ── FloatingInput ─────────────────────────────────────────────────────────────
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
  name?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoCapitalize?: string
  autoCorrect?: string
  rightSlot?: React.ReactNode
  disabled?: boolean
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
  name,
  inputMode,
  autoCapitalize,
  autoCorrect,
  rightSlot,
  disabled,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false)
  const isFloating = focused || value.length > 0

  return (
    <div className="relative" style={{ height: '52px' }}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
        {icon}
      </span>
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
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        disabled={disabled}
        className="absolute inset-0 w-full bg-white border-2 rounded-[14px] pl-12 pr-4 pt-5 pb-1 text-slate-900 text-[15px] transition-all duration-200 outline-none disabled:opacity-50"
        style={{
          borderColor: focused ? '#2563EB' : '#E2E8F0',
          boxShadow: focused ? '0 0 0 4px rgba(37,99,235,0.08)' : 'none',
        }}
      />
      {rightSlot && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          {rightSlot}
        </span>
      )}
    </div>
  )
}

// ── Password strength bar ─────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null

  const getStrength = () => {
    if (password.length < 4) return 1
    if (password.length < 8) return 2
    if (password.length < 12) return 3
    return 4
  }
  const strength = getStrength()
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-500']
  const labels = ['Trop court', 'Faible', 'Moyen', 'Fort — bien joué !']

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              level <= strength ? colors[strength - 1] : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-400 font-medium">{labels[strength - 1]}</p>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MerchantRegister() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refreshMerchant } = useAuth()

  const [loading, setLoading] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cguAccepted: false,
  })

  const [isCodeValid, setIsCodeValid] = useState(false)
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!accessCode.trim()) {
      setIsCodeValid(false)
      setIsCheckingCode(false)
      return
    }
    setIsCheckingCode(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('validate-merchant-code', {
          body: { code: accessCode.trim() },
        })
        setIsCodeValid(!error && data?.valid === true)
      } catch {
        setIsCodeValid(false)
      } finally {
        setIsCheckingCode(false)
      }
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [accessCode])

  const sectors = [
    { value: 'Restaurant', label: '🍽️ Restaurant' },
    { value: 'Boulangerie', label: '🥐 Boulangerie' },
    { value: 'Coiffeur', label: '✂️ Coiffeur' },
    { value: 'Boutique', label: '🛍️ Boutique' },
    { value: 'Café', label: '☕ Café' },
    { value: 'Autre', label: '🏪 Autre' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()

    if (!isCodeValid) {
      toast.error("Code d'accès professionnel invalide.")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!formData.cguAccepted) {
      toast.error("Vous devez accepter les conditions générales d'utilisation.")
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })
      if (authError) throw authError

      if (authData.user) {
        const { error: insertError } = await supabase.from('merchants').insert({
          user_id: authData.user.id,
          name: formData.name,
          sector: formData.sector,
          subscription_status: 'trial',
        })
        if (insertError) {
          console.error('Merchant profile creation error:', insertError)
          throw new Error('Erreur de création du profil commerçant. Veuillez vérifier vos accès.')
        }
        await refreshMerchant()
        toast.success('Inscription réussie !')
        navigate('/merchant/onboarding')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Une erreur est survenue lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  const fieldsDisabled = !isCodeValid

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche */}
      <MerchantAuthLeftRegister />

      {/* Panneau droit */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Header mobile */}
        <div
          className="lg:hidden flex items-center gap-3 px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
        >
          <div className="w-8 h-8 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="font-display text-xl text-white">Fydly⚡</span>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-[440px] animate-fade-in">

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
              >
                1
              </div>
              <div className="text-xs font-bold text-slate-700">Inscription</div>
              <div className="flex-1 h-px bg-slate-200" />
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm font-bold shrink-0">
                2
              </div>
              <div className="text-xs font-medium text-slate-400">Onboarding</div>
            </div>

            {/* Pill violet */}
            <div
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(124,58,237,0.08)', color: '#7C3AED' }}
            >
              ✨ Inscription gratuite
            </div>

            {/* Titre */}
            <h1 className="font-display text-[32px] text-slate-900 leading-tight mb-1">
              Créer votre compte Pro
            </h1>
            <p className="text-slate-500 text-sm font-medium mb-8">
              30 jours d'essai · Sans carte bancaire
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Code d'accès */}
              <div>
                <div className="relative" style={{ height: '52px' }}>
                  {/* Icône gauche (clé) */}
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>

                  {/* Floating label */}
                  <label
                    htmlFor="access-code"
                    className="absolute left-12 pointer-events-none transition-all duration-200 z-10"
                    style={{
                      top: accessCode.length > 0 ? '6px' : '50%',
                      transform: accessCode.length > 0 ? 'translateY(0) scale(0.78)' : 'translateY(-50%)',
                      transformOrigin: 'left',
                      color: '#94A3B8',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    Code d'accès professionnel
                  </label>

                  <input
                    id="access-code"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    required
                    className="absolute inset-0 w-full bg-white border-2 rounded-[14px] pl-12 pr-12 pt-5 pb-1 text-slate-900 text-[15px] transition-all duration-200 outline-none font-mono uppercase tracking-widest"
                    style={{
                      borderColor: isCodeValid ? '#22C55E' : accessCode && !isCheckingCode ? '#EF4444' : '#E2E8F0',
                    }}
                  />

                  {/* Icône validation droite */}
                  {accessCode && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                      {isCheckingCode ? (
                        <Loader2 size={16} className="text-slate-400 animate-spin" />
                      ) : isCodeValid ? (
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <Check size={13} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                          <X size={13} />
                        </div>
                      )}
                    </span>
                  )}
                </div>

                {/* Aide sous le code */}
                {!accessCode && (
                  <p className="text-xs text-slate-400 font-medium mt-1.5 px-1">
                    Contactez-nous pour obtenir votre code d'accès.
                  </p>
                )}
                {isCodeValid && (
                  <p className="text-xs text-green-600 font-bold mt-1.5 px-1 flex items-center gap-1">
                    <Check size={11} /> Code validé — remplissez le formulaire ci-dessous
                  </p>
                )}
              </div>

              {/* Séparateur */}
              <div className="flex items-center gap-3 py-1">
                <div className={`flex-1 h-px transition-all duration-500 ${isCodeValid ? 'bg-blue-200' : 'bg-slate-100'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${isCodeValid ? 'text-blue-500' : 'text-slate-200'}`}>
                  Informations commerce
                </span>
                <div className={`flex-1 h-px transition-all duration-500 ${isCodeValid ? 'bg-blue-200' : 'bg-slate-100'}`} />
              </div>

              {/* Champs commerce */}
              <div
                className="space-y-4 transition-all duration-500"
                style={{
                  opacity: isCodeValid ? 1 : 0.3,
                  pointerEvents: isCodeValid ? 'auto' : 'none',
                  filter: isCodeValid ? 'none' : 'grayscale(0.5) blur(0.6px)',
                }}
              >
                {/* Nom du commerce */}
                <FloatingInput
                  id="reg-name"
                  name="name"
                  label="Nom du commerce"
                  value={formData.name}
                  onChange={handleChange}
                  icon={<Store size={18} />}
                  required={isCodeValid}
                  disabled={fieldsDisabled}
                />

                {/* Email */}
                <FloatingInput
                  id="reg-email"
                  name="email"
                  label="Adresse email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  icon={<Mail size={18} />}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required={isCodeValid}
                  disabled={fieldsDisabled}
                />

                {/* Mot de passe */}
                <div>
                  <FloatingInput
                    id="reg-password"
                    name="password"
                    label="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    icon={<Lock size={18} />}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    required={isCodeValid}
                    minLength={8}
                    disabled={fieldsDisabled}
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
                  <PasswordStrengthBar password={formData.password} />
                </div>

                {/* Secteur — styled select */}
                <div className="relative" style={{ height: '52px' }}>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <Store size={18} />
                  </span>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    required={isCodeValid}
                    disabled={fieldsDisabled}
                    className="absolute inset-0 w-full bg-white border-2 border-slate-200 rounded-[14px] pl-12 pr-10 text-slate-900 text-[15px] outline-none appearance-none cursor-pointer transition-all duration-200 focus:border-fydly-500 disabled:opacity-50"
                    style={{ paddingTop: formData.sector ? '20px' : '0', paddingBottom: formData.sector ? '4px' : '0' }}
                  >
                    <option value="" disabled>Choisir un secteur...</option>
                    {sectors.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  {formData.sector && (
                    <label
                      className="absolute left-12 z-10 pointer-events-none"
                      style={{ top: '6px', fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}
                    >
                      Secteur
                    </label>
                  )}
                  {!formData.sector && (
                    <label
                      className="absolute left-12 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                      style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500 }}
                    >
                      Secteur d'activité
                    </label>
                  )}
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                </div>

                {/* RGPD checkbox */}
                <label
                  className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl border transition-all group"
                  style={{ background: 'rgba(37,99,235,0.03)', borderColor: '#DBEAFE' }}
                >
                  {/* Custom checkbox */}
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      name="cguAccepted"
                      checked={formData.cguAccepted}
                      onChange={handleChange}
                      required={isCodeValid}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all duration-200"
                      style={{
                        borderColor: formData.cguAccepted ? '#2563EB' : '#BFDBFE',
                        background: formData.cguAccepted ? '#2563EB' : 'white',
                      }}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, cguAccepted: !prev.cguAccepted }))
                      }
                    >
                      {formData.cguAccepted && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-slate-600 leading-relaxed">
                    J'accepte les{' '}
                    <span className="text-fydly-500 font-bold">conditions générales d'utilisation</span>
                    {' '}et la{' '}
                    <span className="text-fydly-500 font-bold">politique de confidentialité</span>.
                  </span>
                </label>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={!isCodeValid || loading}
                className="w-full flex items-center justify-center gap-2 text-white font-bold text-base rounded-[14px] transition-all duration-200 shadow-glow-strong disabled:opacity-60"
                style={{
                  height: '52px',
                  background:
                    !isCodeValid || loading
                      ? '#94A3B8'
                      : 'linear-gradient(135deg,#2563EB,#7C3AED)',
                  marginTop: '8px',
                }}
              >
                {loading ? (
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>Créer mon compte gratuitement <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-500 mt-6 font-medium">
              Déjà un compte ?{' '}
              <Link
                to="/merchant/login"
                className="text-fydly-600 font-bold hover:text-fydly-700 transition-colors"
              >
                Se connecter →
              </Link>
            </p>

            <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
              Vos données sont chiffrées et ne sont jamais revendues.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
