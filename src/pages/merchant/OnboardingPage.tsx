import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stamp, Star, ArrowRight, ShieldCheck, Zap, Sparkles, ChevronLeft, Store, Check, Coffee } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

// ── Confetti Component ──
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const pieces: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; angle: number; va: number;
    }[] = []

    const colors = ['#2563EB', '#7C3AED', '#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F472B6']

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.15,
      })
    }

    let animFrame: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.angle += p.va
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        ctx.restore()
      })
      animFrame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animFrame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
    />
  )
}

// ── iPhone Preview Component ──
interface IPhonePreviewProps {
  shopName: string
  rewardThreshold: number | string
  rewardDescription: string
  step: number
}

function IPhonePreview({ shopName, rewardThreshold, rewardDescription, step }: IPhonePreviewProps) {
  const threshold = Number(rewardThreshold) || 10
  const stampCount = Math.min(3, threshold)

  return (
    <div className="flex flex-col items-center">
      <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">
        Aperçu — vue client mobile
      </p>

      {/* iPhone 14 Pro silhouette */}
      <div
        className="relative mx-auto w-[260px]"
        style={{
          animation: 'breathe 4s ease-in-out infinite',
        }}
      >
        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1.0); }
            50% { transform: scale(1.015); }
          }
        `}</style>

        {/* Outer shell */}
        <div
          className="bg-slate-900 shadow-2xl ring-1 ring-slate-700 relative"
          style={{ borderRadius: '50px', padding: '10px' }}
        >
          {/* Dynamic island */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-6 bg-black rounded-full flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-5 h-1.5 rounded-full bg-slate-700" />
            </div>
          </div>

          {/* Screen */}
          <div
            className="bg-white overflow-hidden"
            style={{ borderRadius: '42px', minHeight: '460px' }}
          >
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-1">
              <span className="text-[10px] font-bold text-slate-900">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1.5 bg-slate-900 rounded-sm opacity-60" />
                <div className="w-3 h-1.5 bg-slate-900 rounded-sm opacity-60" />
                <div className="w-4 h-2 border border-slate-900 rounded-sm opacity-60 flex items-center px-0.5">
                  <div className="w-2 h-1 bg-slate-900 rounded-sm" />
                </div>
              </div>
            </div>

            {/* App header */}
            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-bv rounded-lg flex items-center justify-center">
                  <Zap size={12} fill="currentColor" className="text-white" />
                </div>
                <span className="text-[13px] font-display font-bold text-slate-900">Fydly·</span>
              </div>

              {/* Card header */}
              <div className="bg-gradient-to-br from-fydly-50 to-blue-50 rounded-2xl p-4 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[8px] font-bold text-fydly-400 uppercase tracking-widest block">Carte fidélité</span>
                    <h4 className="font-display text-[15px] font-bold text-slate-900 leading-tight mt-0.5">
                      {shopName || 'Votre boutique'}
                    </h4>
                  </div>
                  <div className="w-9 h-9 bg-gradient-bv rounded-xl flex items-center justify-center shadow-glow-blue">
                    <Store size={14} className="text-white" />
                  </div>
                </div>

                {step >= 2 && (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-semibold text-slate-400">Tampons</span>
                      <span className="text-[9px] font-bold text-slate-700">{stampCount} / {threshold}</span>
                    </div>
                    {/* Progress */}
                    <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-bv rounded-full transition-all duration-700"
                        style={{ width: `${(stampCount / threshold) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Stamps grid */}
              {step >= 2 && (
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {Array.from({ length: Math.min(threshold, 15) }).map((_, i) => (
                    <div key={i} className="aspect-square">
                      {i < stampCount ? (
                        <div className="w-full h-full rounded-lg bg-fydly-500 flex items-center justify-center shadow-sm">
                          <Stamp size={10} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-lg border-2 border-dashed border-slate-200" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-slate-200" />
                  ))}
                </div>
              )}

              {/* Reward */}
              <div className="bg-slate-900 rounded-xl px-4 py-3 relative overflow-hidden">
                <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mb-0.5">Récompense</p>
                <p className="text-[12px] font-display font-bold text-white leading-snug">
                  {rewardDescription || '1 café offert'}
                </p>
                <div className="absolute -right-4 -bottom-4 w-14 h-14 bg-white/5 rounded-full blur-xl" />
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center mt-2 pb-1">
            <div className="w-24 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>

      <p className="mt-5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Mode aperçu</p>
    </div>
  )
}

// ── Main Component ──
export default function OnboardingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { session, merchant, refreshMerchant } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [shopName, setShopName] = useState('')
  const [sector, setSector] = useState('')
  const [programType] = useState<'stamps' | 'points'>('stamps')
  const [rewardThreshold, setRewardThreshold] = useState<number | string>(10)
  const [rewardDescription, setRewardDescription] = useState('1 café offert')

  const TOTAL_STEPS = 3

  const sectors = [
    { emoji: '☕', label: 'Café & Restaurant' },
    { emoji: '🥖', label: 'Boulangerie' },
    { emoji: '✂️', label: 'Coiffeur' },
    { emoji: '🛍️', label: 'Boutique' },
    { emoji: '💆', label: 'Spa/Bien-être' },
    { emoji: '➕', label: 'Autre' },
  ]

  useEffect(() => {
    if (merchant) {
      if (merchant.reward_description) {
        navigate('/merchant/dashboard', { replace: true })
      } else if (merchant.name) {
        setShopName((prev) => prev ? prev : merchant.name)
      }
    }
  }, [merchant, navigate])

  const handleStep1Next = () => {
    if (!shopName.trim()) { toast.error('Entrez le nom de votre commerce.'); return }
    setStep(2)
  }

  const handleStep2Next = () => {
    setStep(3)
  }

  const handleBack = () => setStep(prev => Math.max(1, prev - 1))

  const handleComplete = async () => {
    if (!session?.user?.id) {
      toast.error('Session expirée.')
      navigate('/merchant/login')
      return
    }
    setLoading(true)
    try {
      const thresholdValue = typeof rewardThreshold === 'number' ? rewardThreshold : (parseInt(rewardThreshold as string) || 10)

      const { data: merchantData, error: updateError } = await supabase
        .from('merchants')
        .upsert({
          user_id: session.user.id,
          name: shopName.trim(),
          program_type: programType,
          reward_threshold: thresholdValue,
          reward_description: rewardDescription,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select('id')
        .single()

      if (updateError) throw updateError

      if (merchantData?.id) {
        const todayDate = new Date().toISOString().split('T')[0]
        await supabase.from('qr_tokens').upsert({
          merchant_id: merchantData.id,
          token: crypto.randomUUID(),
          valid_date: todayDate,
          is_active: true,
        }, { onConflict: 'merchant_id, valid_date' })
      }

      await refreshMerchant()
      toast.success('Configuration terminée !')
      navigate('/merchant/dashboard')
    } catch (err: any) {
      console.error('Onboarding finalization error:', err)
      toast.error('Erreur de configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      window.location.href = '/merchant/login'
    } catch (err) {
      console.error('Logout error:', err)
      navigate('/merchant/login')
    } finally {
      setLoading(false)
    }
  }

  const threshold = Number(rewardThreshold) || 10

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">

      {/* ── Progress bar top ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200">
        <div
          className="h-full bg-gradient-bv transition-all duration-700 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-1 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 h-[64px] flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Logo + steps */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-bv rounded-[8px] flex items-center justify-center">
                <Zap size={13} fill="currentColor" className="text-white" />
              </div>
              <span className="font-display text-[18px] font-bold text-slate-900">
                Fydly<span className="text-fydly-500">·</span>
              </span>
            </div>

            {/* Step circles - desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                const s = i + 1
                const done = s < step
                const active = s === step
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300
                      ${done
                        ? 'bg-fydly-500 text-white'
                        : active
                          ? 'bg-gradient-bv text-white shadow-glow-blue'
                          : 'bg-slate-100 text-slate-400'
                      }
                    `}>
                      {done ? <Check size={13} /> : s}
                    </div>
                    {s < TOTAL_STEPS && (
                      <div className={`w-8 h-px transition-all duration-500 ${done ? 'bg-fydly-500' : 'bg-slate-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
          >
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="pt-[64px] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

          {/* Step 1 & 2: 2-column layout on desktop */}
          {(step === 1 || step === 2) && (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

              {/* ── Left: Form ── */}
              <div className="w-full lg:w-[60%]">

                {/* Step indicator mobile */}
                <div className="sm:hidden flex items-center gap-2 mb-6">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                    const s = i + 1
                    const done = s < step
                    const active = s === step
                    return (
                      <div key={s} className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                          ${done ? 'bg-fydly-500 text-white' : active ? 'bg-gradient-bv text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {done ? <Check size={11} /> : s}
                        </div>
                        {s < TOTAL_STEPS && (
                          <div className={`w-5 h-px ${done ? 'bg-fydly-500' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-2">
                      Parlez-nous de votre commerce
                    </h2>
                    <p className="text-slate-500 text-lg mb-8">Quelques infos pour personnaliser votre programme.</p>

                    <div className="space-y-6">
                      {/* Nom du commerce */}
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                          <Store size={13} className="text-fydly-500" />
                          Nom de votre commerce
                        </label>
                        <div className="relative">
                          <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="Ex : Boulangerie Martin, Café du Commerce..."
                            className="h-14 pl-12 rounded-2xl border-slate-200 focus:border-fydly-500 font-semibold text-base"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Secteur */}
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                          <Sparkles size={13} className="text-fydly-500" />
                          Secteur d'activité
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {sectors.map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() => setSector(s.label)}
                              className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 text-left ${
                                sector === s.label
                                  ? 'border-fydly-500 bg-fydly-50 text-fydly-700 shadow-glow-blue'
                                  : 'border-slate-100 bg-white text-slate-600 hover:border-fydly-200 hover:bg-fydly-50/50'
                              }`}
                            >
                              <span className="text-xl">{s.emoji}</span>
                              <span className="leading-tight">{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleStep1Next}
                        className="w-full h-14 text-base font-semibold shadow-glow-blue"
                      >
                        Continuer <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-2">
                      Configurez vos récompenses
                    </h2>
                    <p className="text-slate-500 text-lg mb-8">Définissez combien de visites valent une récompense.</p>

                    <div className="space-y-8">
                      {/* Slider tampons */}
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                          <Zap size={13} className="text-fydly-500" />
                          Nombre de tampons requis
                          <span className="ml-auto text-2xl font-display font-bold text-fydly-600">{threshold}</span>
                        </label>
                        <input
                          type="range"
                          min={5}
                          max={20}
                          value={threshold}
                          onChange={(e) => setRewardThreshold(parseInt(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-fydly-500 bg-fydly-100"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium mt-2">
                          <span>5 visites</span>
                          <span>20 visites</span>
                        </div>

                        {/* Visual stamps preview */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {Array.from({ length: Math.min(threshold, 20) }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                i < 3
                                  ? 'bg-fydly-500 shadow-sm'
                                  : 'bg-slate-100 border-2 border-dashed border-slate-200'
                              }`}
                            >
                              {i < 3 && <Stamp size={12} className="text-white" />}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Exemple : 3 tampons déjà obtenus</p>
                      </div>

                      {/* Récompense */}
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                          <Star size={13} className="text-fydly-500" />
                          Description de la récompense
                        </label>
                        <textarea
                          value={rewardDescription}
                          onChange={(e) => setRewardDescription(e.target.value)}
                          placeholder="Ex: 1 café offert, 10% de remise, 1 croissant gratuit..."
                          maxLength={80}
                          rows={3}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-base font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-fydly-500 focus:ring-2 focus:ring-fydly-500/20 resize-none transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-2 italic">Restez simple et attractif — c'est ce que vos clients verront.</p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleBack}
                          className="h-14 px-6 rounded-btn border border-slate-200 bg-white text-slate-600 font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"
                        >
                          <ChevronLeft size={18} /> Retour
                        </button>
                        <Button
                          onClick={handleStep2Next}
                          className="flex-1 h-14 text-base font-semibold shadow-glow-blue"
                        >
                          Continuer <ArrowRight size={18} className="ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right: iPhone Preview (desktop fixed, mobile accordion) ── */}
              <div className="w-full lg:w-[40%] lg:sticky lg:top-24">
                {/* Mobile: collapsible */}
                <details className="lg:hidden group mb-6">
                  <summary className="flex items-center justify-between cursor-pointer bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-card list-none">
                    <span className="text-sm font-bold text-slate-600">Aperçu de votre carte</span>
                    <ChevronLeft size={16} className="text-slate-400 rotate-[-90deg] group-open:rotate-[90deg] transition-transform" />
                  </summary>
                  <div className="mt-4">
                    <IPhonePreview
                      shopName={shopName}
                      rewardThreshold={rewardThreshold}
                      rewardDescription={rewardDescription}
                      step={step}
                    />
                  </div>
                </details>

                {/* Desktop: always visible */}
                <div className="hidden lg:block bg-white rounded-[24px] border border-slate-100 shadow-card p-8">
                  <IPhonePreview
                    shopName={shopName}
                    rewardThreshold={rewardThreshold}
                    rewardDescription={rewardDescription}
                    step={step}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Ready! ── */}
          {step === 3 && (
            <>
              <Confetti />
              <div className="max-w-2xl mx-auto text-center py-12">

                {/* Big emoji */}
                <div className="text-7xl mb-6 animate-bounce" style={{ animationDuration: '2s' }}>🎉</div>

                <h1 className="text-4xl sm:text-5xl font-display font-bold text-gradient-bv mb-4">
                  Votre commerce est prêt !
                </h1>
                <p className="text-xl text-slate-500 mb-10 max-w-lg mx-auto">
                  Votre QR Code est généré et disponible dans votre dashboard.
                </p>

                {/* Summary card */}
                <div className="bg-fydly-50 border border-fydly-100 rounded-[24px] p-8 mb-10 text-left">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-bv rounded-2xl flex items-center justify-center shadow-glow-blue">
                      <Store size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-fydly-400 uppercase tracking-widest">Votre commerce</p>
                      <p className="text-xl font-display font-bold text-slate-900">{shopName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-fydly-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tampons requis</p>
                      <p className="text-2xl font-display font-bold text-fydly-600">{threshold}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-fydly-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Récompense</p>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{rewardDescription || '1 café offert'}</p>
                    </div>
                  </div>

                  {sector && (
                    <div className="mt-4 bg-white rounded-2xl p-4 border border-fydly-100 flex items-center gap-3">
                      <span className="text-2xl">
                        {sectors.find(s => s.label === sector)?.emoji || '🏪'}
                      </span>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secteur</p>
                        <p className="text-sm font-bold text-slate-900">{sector}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info note */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-10 text-left">
                  <Coffee size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 font-medium leading-relaxed">
                    Votre QR Code unique est prêt. Affichez-le en caisse et vos clients pourront commencer à collecter des tampons dès maintenant.
                  </p>
                </div>

                {/* Back + Complete */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleBack}
                    className="h-14 px-8 rounded-btn border border-slate-200 bg-white text-slate-600 font-semibold flex items-center gap-2 justify-center hover:bg-slate-50 transition-colors active:scale-95"
                  >
                    <ChevronLeft size={18} /> Modifier
                  </button>
                  <Button
                    onClick={handleComplete}
                    disabled={loading || !rewardDescription.trim() || threshold < 2}
                    className="h-14 px-10 text-base font-semibold shadow-glow-strong"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Finalisation...
                      </div>
                    ) : (
                      <>
                        Accéder à mon dashboard →
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  )
}
