import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Gift, AlertTriangle, Scan, RefreshCw, ChevronRight,
  Copy, Printer, Share2, Megaphone, Send, Zap, Rocket
} from 'lucide-react'
import { supabase, QrToken, Reward } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { sendPushNotification } from '../../lib/onesignal'
import { notifyRewardValidated } from '../../lib/notifications'
import { QRCodeSVG } from 'qrcode.react'

// UI Components
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

// ─── Sparkline SVG ──────────────────────────────────────────────────────────
function Sparkline({ color = '#2563EB' }: { color?: string }) {
  const points = '0,28 18,20 36,24 54,10 72,16 90,4'
  return (
    <svg width="90" height="32" viewBox="0 0 90 32" fill="none" className="absolute right-3 bottom-4 opacity-20 pointer-events-none">
      <polyline points={points} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Period filter ───────────────────────────────────────────────────────────
type Period = '7j' | '30j' | '3m'

export default function MerchantDashboard() {
  const { merchant } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [activeToken, setActiveToken] = useState<QrToken | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [timePercent, setTimePercent] = useState(100)
  const [period, setPeriod] = useState<Period>('30j')
  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    stampsThisMonth: 0,
    rewardsThisMonth: 0,
    inactiveCustomers: 0,
  })

  // Realtime lists
  const [recentScans, setRecentScans] = useState<any[]>([])

  // Composer state (inline, pas de composant externe)
  const [composerMessage, setComposerMessage] = useState('')
  const [composerSegment, setComposerSegment] = useState<'all' | 'active' | 'inactive'>('all')
  const [composerLoading, setComposerLoading] = useState(false)

  // Scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)
  const scanningRef = useRef(false)

  // Reward validation
  const [pendingReward, setPendingReward] = useState<Reward | null>(null)
  const [isValidatingReward, setIsValidatingReward] = useState(false)

  useEffect(() => {
    if (!merchant?.id) return
    loadDashboardData()

    // Subscriptions
    const channel = supabase.channel('merchant_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `merchant_id=eq.${merchant.id}`
      }, () => {
        fetchRecentScans()
        loadKpis()
      })
      .subscribe()

    // Countdown logic
    const timer = setInterval(updateCountdown, 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [merchant?.id])

  const loadDashboardData = async () => {
    setLoading(true)
    await Promise.all([
      fetchActiveToken(),
      loadKpis(),
      fetchRecentScans()
    ])
    setLoading(false)
    updateCountdown()
  }

  const fetchActiveToken = async () => {
    if (!merchant?.id) return
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    let { data } = await supabase
      .from('qr_tokens')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('valid_date', today)
      .eq('is_active', true)
      .maybeSingle()

    if (!data) {
      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()
      const { data: newData, error } = await supabase
        .from('qr_tokens')
        .insert({
          merchant_id: merchant.id,
          token,
          valid_date: today,
          is_active: true
        })
        .select('*')
        .single()

      if (!error && newData) {
        data = newData
      } else if (error) {
        const { data: existing } = await supabase
          .from('qr_tokens')
          .select('*')
          .eq('merchant_id', merchant.id)
          .eq('valid_date', today)
          .eq('is_active', true)
          .maybeSingle()
        if (existing) data = existing
      }
    }
    setActiveToken(data)
  }

  const loadKpis = async () => {
    if (!merchant?.id) return
    const { data } = await supabase.rpc('get_merchant_kpis', { p_merchant_id: merchant.id })
    if (data?.success) {
      setKpis({
        totalCustomers: data.total_clients || 0,
        stampsThisMonth: data.stamps_month || 0,
        rewardsThisMonth: data.rewards_month || 0,
        inactiveCustomers: data.inactive_clients || 0,
      })
    }
  }

  const fetchRecentScans = async () => {
    if (!merchant?.id) return
    const { data } = await supabase.rpc('get_merchant_recent_scans', { p_merchant_id: merchant.id })
    setRecentScans(data as any[] || [])
  }

  const updateCountdown = () => {
    const now = new Date()
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)
    const diff = endOfDay.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeLeft('0 min')
      setTimePercent(0)
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    setTimeLeft(hours > 0 ? `${hours}h ${mins}m` : `${mins} min`)

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const total = endOfDay.getTime() - startOfDay.getTime()
    const remaining = Math.max(0, endOfDay.getTime() - now.getTime())
    setTimePercent((remaining / total) * 100)
  }

  const startScanner = async () => {
    setShowScanner(true)
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('reader')
        scannerRef.current = scanner
        setScanning(true)
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {}
        )
        scanningRef.current = true
      } catch (err) {
        toast.error('Erreur caméra')
        stopScanner()
      }
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current && scanningRef.current) {
      scanningRef.current = false
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear()
        setScanning(false)
        setShowScanner(false)
      }).catch(() => {
        setScanning(false)
        setShowScanner(false)
      })
    } else {
      setShowScanner(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    stopScanner()
    const token = decodedText.trim()
    if (!token) { toast.error('Format invalide'); return }

    setLoading(true)
    const { data: reward, error } = await supabase
      .from('rewards')
      .select('*, customers(first_name)')
      .eq('reward_qr_token', token)
      .eq('merchant_id', merchant?.id)
      .single()

    setLoading(false)
    if (error || !reward) { toast.error('Récompense introuvable'); return }
    if (reward.status !== 'available') { toast.error('Récompense déjà utilisée ou expirée'); return }
    setPendingReward(reward)
  }

  const validateReward = async () => {
    if (!pendingReward || !merchant) return
    setIsValidatingReward(true)
    try {
      const { error: rErr } = await supabase
        .from('rewards')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq('id', pendingReward.id)

      if (rErr) throw rErr

      const { error: cardErr } = await supabase.rpc('decrement_card_balance', {
        p_card_id: pendingReward.card_id,
        p_amount: merchant.reward_threshold
      })

      if (cardErr) {
        const { data: card, error: fetchErr } = await supabase
          .from('loyalty_cards')
          .select('balance')
          .eq('id', pendingReward.card_id)
          .single()

        if (fetchErr || !card) {
          await supabase
            .from('rewards')
            .update({ status: 'available', redeemed_at: null })
            .eq('id', pendingReward.id)
          throw new Error('Impossible de mettre à jour le solde. La récompense n\'a pas été consommée.')
        }

        const { error: updateErr } = await supabase
          .from('loyalty_cards')
          .update({ balance: Math.max(0, card.balance - merchant.reward_threshold) })
          .eq('id', pendingReward.card_id)

        if (updateErr) {
          await supabase
            .from('rewards')
            .update({ status: 'available', redeemed_at: null })
            .eq('id', pendingReward.id)
          throw updateErr
        }
      }

      const { error: txErr } = await supabase.from('transactions').insert({
        card_id: pendingReward.card_id,
        customer_id: pendingReward.customer_id,
        merchant_id: merchant.id,
        type: 'redeem',
        amount: merchant.reward_threshold,
      })

      if (txErr) {
        console.error('[validateReward] Échec insertion transaction:', txErr)
      }

      notifyRewardValidated(
        pendingReward.customer_id,
        merchant.reward_description || 'votre récompense'
      )

      toast.success('Récompense validée !')
      setPendingReward(null)
      loadKpis()
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la validation')
    } finally {
      setIsValidatingReward(false)
    }
  }

  const handleSendNotification = async (message: string, segment: 'all' | 'active' | 'inactive') => {
    if (!merchant) return

    const result = await sendPushNotification(merchant.id, segment, message)

    if (!result.success && result.error) {
      await supabase.from('notifications').insert({
        merchant_id: merchant.id,
        message,
        segment,
        recipients_count: 0,
        status: 'failed',
        sent_at: new Date().toISOString(),
      })
    }

    if (result.recipients > 0) {
      toast.success(`Notification envoyée à ${result.recipients} client${result.recipients > 1 ? 's' : ''} !`)
    } else {
      toast.success('Notification enregistrée !')
    }
  }

  const generateClientUrl = () => {
    const origin = window.location.origin
    return `${origin}/scan?token=${activeToken?.token}&m=${merchant?.id}`
  }

  const copyQrLink = async () => {
    if (!activeToken) return
    try {
      await navigator.clipboard.writeText(generateClientUrl())
      toast.success('Lien copié !')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const activeCount = kpis.totalCustomers - kpis.inactiveCustomers
  const inactiveCount = kpis.inactiveCustomers

  if (loading && !kpis.totalCustomers) {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} variant="rect" className="h-[100px] sm:h-32 rounded-3xl" />)}
        </div>
        <SkeletonLoader variant="card" className="h-[300px] sm:h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 lg:pb-10 animate-fade-in">

      {/* ═══════════════════════════════════════════════════
          HEADER ZONE
      ═══════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="font-display font-bold tracking-tight text-slate-900"
            style={{ fontSize: 'clamp(22px, 4vw, 28px)' }}
          >
            Bonjour, {merchant?.name || 'Vous'} 👋
          </h1>
          <p className="text-slate-400 text-[13px] font-medium mt-0.5 capitalize">
            {todayLabel} · ☀️ Lyon
          </p>
        </div>
        {/* Desktop right pills */}
        <div className="hidden sm:flex items-center gap-2 shrink-0 mt-1">
          {/* LIVE pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-[0.08em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
          {/* Actualiser btn */}
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 text-[12px] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            <RefreshCw size={13} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          HERO ZONE — QR Card + Scanner CTA
      ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

        {/* ── QR CODE CARD (col-span-3) ───────────────────── */}
        <div className="lg:col-span-3">
          <div
            className="bg-white rounded-[20px] p-6"
            style={{
              border: '1px solid transparent',
              backgroundImage:
                'linear-gradient(white, white), linear-gradient(135deg, rgba(37,99,235,0.4), rgba(124,58,237,0.4))',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.1em] font-semibold mb-0.5">
                  QR CODE DU JOUR
                </p>
                <h3 className="font-display font-bold text-slate-900 text-[17px]">
                  Affichez-le en caisse
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Renouvelé chaque jour
              </span>
            </div>

            {/* QR + right column */}
            <div className="flex gap-5 items-start">
              {/* QR code */}
              <div className="shrink-0">
                {activeToken ? (
                  <div className="p-3 bg-white rounded-[12px] border border-slate-100 shadow-card">
                    <QRCodeSVG
                      value={generateClientUrl()}
                      size={160}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: '/favicon.png',
                        x: undefined,
                        y: undefined,
                        height: 32,
                        width: 32,
                        excavate: true,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-[160px] h-[160px] bg-slate-100 rounded-[12px] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-fydly-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Right info column */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* URL box */}
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.1em] mb-1">
                    LIEN COURT
                  </p>
                  <div className="bg-slate-50 rounded-[8px] px-2.5 py-2 border border-slate-100">
                    <span className="font-mono text-[12px] text-slate-600 break-all line-clamp-2">
                      {activeToken ? generateClientUrl() : '—'}
                    </span>
                  </div>
                </div>

                {/* Countdown */}
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1.5">
                    ⏱ Expire dans {timeLeft}
                  </p>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${timePercent}%`,
                        background: 'linear-gradient(90deg, #2563EB, #7C3AED)',
                      }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={copyQrLink}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-[8px] hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                  >
                    <Copy size={12} />
                    Copier
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-[8px] hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                  >
                    <Printer size={12} />
                    Imprimer
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share && activeToken) {
                        navigator.share({ url: generateClientUrl(), title: 'Mon QR Fydly' })
                      } else {
                        copyQrLink()
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-[8px] hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                  >
                    <Share2 size={12} />
                    Partager
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SCANNER CTA CARD (col-span-2) ───────────────── */}
        <div className="lg:col-span-2">
          <div
            className="h-full min-h-[180px] bg-slate-900 rounded-[20px] p-7 text-white relative overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl active:scale-[0.98]"
            onClick={startScanner}
            style={{
              background: `
                radial-gradient(circle at 70% 30%, rgba(124,58,237,0.25), transparent 60%),
                radial-gradient(circle at 30% 80%, rgba(37,99,235,0.2), transparent 60%),
                #0f172a
              `,
            }}
          >
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center border border-white/15 animate-pulse-glow"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
            >
              <Gift size={28} className="text-white" />
            </div>

            {/* Title */}
            <h3 className="font-display font-bold text-[22px] mt-4 leading-tight">
              🎁 Valider une récompense
            </h3>

            {/* Subtitle */}
            <p className="text-white/65 text-[13px] mt-1.5 leading-relaxed">
              Scannez le QR Code client pour offrir sa récompense.
            </p>

            {/* Action bandeau */}
            <div
              className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-[12px] border border-white/10"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Scan size={16} className="text-white/80 shrink-0" />
              <span className="font-semibold text-[13px] text-white">Ouvrir le scanner</span>
              <ChevronRight size={16} className="text-white/50 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          KPIs SECTION
      ═══════════════════════════════════════════════════ */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-slate-900 text-[16px]">
            📊 Ce mois-ci
          </h2>
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-[10px] p-0.5">
            {(['7j', '30j', '3m'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-[8px] text-[12px] font-semibold transition-all ${
                  period === p
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 4 KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          {/* 1 — Clients fidèles */}
          <div
            className="bg-white rounded-[20px] p-[18px] relative overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
            style={{ borderLeft: '3px solid #2563EB' }}
            onClick={() => navigate('/merchant/customers')}
          >
            <Sparkline color="#2563EB" />
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-blue-50 flex items-center justify-center text-fydly-500">
                <Users size={15} />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold font-mono">
                +12% ↑
              </span>
            </div>
            <div className="font-mono font-bold text-[32px] text-slate-900 leading-none tracking-tight mt-2">
              {kpis.totalCustomers}
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5 font-medium">Clients fidèles</p>
          </div>

          {/* 2 — Tampons ce mois */}
          <div
            className="bg-white rounded-[20px] p-[18px] relative overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
            style={{ borderLeft: '3px solid #7C3AED' }}
          >
            <Sparkline color="#7C3AED" />
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-violet-50 flex items-center justify-center text-violet-500">
                <Zap size={15} />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold font-mono">
                +8% ↑
              </span>
            </div>
            <div className="font-mono font-bold text-[32px] text-slate-900 leading-none tracking-tight mt-2">
              {kpis.stampsThisMonth}
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5 font-medium">Tampons ce mois</p>
          </div>

          {/* 3 — Récompenses */}
          <div
            className="bg-white rounded-[20px] p-[18px] relative overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
            style={{ borderLeft: '3px solid #D97706' }}
            onClick={() => navigate('/merchant/customers?filter=reward')}
          >
            <Sparkline color="#D97706" />
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-amber-50 flex items-center justify-center text-amber-500">
                <Gift size={15} />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold font-mono">
                +5 ↑
              </span>
            </div>
            <div className="font-mono font-bold text-[32px] text-slate-900 leading-none tracking-tight mt-2">
              {kpis.rewardsThisMonth}
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5 font-medium">Récompenses</p>
          </div>

          {/* 4 — À relancer */}
          <div
            className={`rounded-[20px] p-[18px] relative overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer ${
              kpis.inactiveCustomers > 5 ? 'bg-red-50/50' : 'bg-white'
            }`}
            style={{ borderLeft: `3px solid ${kpis.inactiveCustomers > 5 ? '#DC2626' : '#DC2626'}` }}
            onClick={() => navigate('/merchant/customers?filter=inactive')}
          >
            <Sparkline color="#DC2626" />
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-red-50 flex items-center justify-center text-red-500">
                <AlertTriangle size={15} />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold font-mono">
                urgent
              </span>
            </div>
            <div className="font-mono font-bold text-[32px] text-slate-900 leading-none tracking-tight mt-2">
              {kpis.inactiveCustomers}
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5 font-medium">À relancer</p>
            {kpis.inactiveCustomers > 5 && (
              <p className="text-red-500 text-[12px] font-bold mt-2">
                Envoyer une relance →
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          ACTIVITÉ + COMPOSER
      ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

        {/* ── ACTIVITÉ RÉCENTE (col-span-3) ───────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[20px] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-slate-900 text-[16px]">
                Activité récente
              </h2>
              <button
                onClick={() => navigate('/merchant/customers')}
                className="text-fydly-500 text-[12px] font-semibold hover:text-fydly-700 transition-colors"
              >
                Voir tout →
              </button>
            </div>

            {/* Timeline */}
            {recentScans.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-[12px] flex items-center justify-center mx-auto mb-3">
                  <Zap size={20} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium text-[13px]">Aucun scan récent</p>
                <p className="text-slate-300 text-[12px] mt-0.5">L'activité apparaîtra ici</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-slate-100 rounded-full" />
                <div className="space-y-1">
                  {recentScans.slice(0, 6).map((scan: any) => {
                    const name = scan.customers?.first_name || scan.customers?.email || 'Client'
                    const isReward = scan.type === 'redeem'
                    const initials = name.slice(0, 2).toUpperCase()
                    const timeStr = new Date(scan.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    return (
                      <div key={scan.id} className="flex items-center gap-3 py-2 relative z-10">
                        {/* Avatar wrapping (to cover line) */}
                        <div className="bg-white shrink-0 rounded-full p-0.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${
                            isReward ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-fydly-500'
                          }`}>
                            {isReward ? '🎁' : initials}
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-semibold text-slate-800 truncate block">
                            {name}
                          </span>
                          <span className="text-[11px] text-slate-400">{timeStr}</span>
                        </div>
                        {/* Pill */}
                        {isReward ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold shrink-0">
                            🎁 Récompense validée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold shrink-0">
                            ⚡ +1 tampon
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR (col-span-2) ────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Quick Composer */}
          <div className="bg-white rounded-[20px] p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={18} className="text-fydly-500" />
              <span className="font-bold text-[15px] text-slate-900">Message rapide</span>
            </div>

            {/* Textarea */}
            <textarea
              rows={3}
              maxLength={140}
              value={composerMessage}
              onChange={e => setComposerMessage(e.target.value)}
              placeholder="Un petit mot pour vos clients…"
              className="w-full border-[1.5px] border-slate-200 rounded-[10px] px-3 py-2.5 font-body text-[13px] text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-fydly-400 transition-colors"
            />

            {/* Segment pills */}
            <div className="flex gap-1.5 mt-2.5">
              <button
                onClick={() => setComposerSegment('all')}
                className={`flex-1 py-1.5 px-2 rounded-[8px] text-[11px] font-semibold transition-all ${
                  composerSegment === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Tous · {kpis.totalCustomers}
              </button>
              <button
                onClick={() => setComposerSegment('active')}
                className={`flex-1 py-1.5 px-2 rounded-[8px] text-[11px] font-semibold transition-all ${
                  composerSegment === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />
                Actifs · {activeCount}
              </button>
              <button
                onClick={() => setComposerSegment('inactive')}
                className={`flex-1 py-1.5 px-2 rounded-[8px] text-[11px] font-semibold transition-all ${
                  composerSegment === 'inactive'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 align-middle" />
                Inactifs · {inactiveCount}
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <span className="font-mono text-[11px] text-slate-400">
                {composerMessage.length}/140
              </span>
              <Button
                size="sm"
                disabled={!composerMessage.trim()}
                isLoading={composerLoading}
                onClick={async () => {
                  if (!composerMessage.trim()) return
                  setComposerLoading(true)
                  try {
                    await handleSendNotification(composerMessage, composerSegment)
                    setComposerMessage('')
                  } finally {
                    setComposerLoading(false)
                  }
                }}
              >
                Envoyer
                <Send size={13} className="ml-1" />
              </Button>
            </div>
          </div>

          {/* Booster card */}
          <div
            className="rounded-[20px] p-5 text-white relative overflow-hidden"
            style={{
              background: `
                radial-gradient(circle at 80% 20%, rgba(124,58,237,0.3), transparent 60%),
                #0f172a
              `,
            }}
          >
            <Rocket size={22} className="text-white/80" />
            <h3 className="font-display font-bold text-[16px] mt-2.5 leading-tight">
              Booster mes ventes
            </h3>
            <p className="text-white/65 text-[12px] mt-1.5 leading-relaxed">
              Créez une campagne ciblée avec analytics.
            </p>
            <button
              onClick={() => navigate('/merchant/notifications')}
              className="mt-3 px-4 py-2 rounded-[12px] text-white font-semibold text-[13px] transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              Lancer une campagne →
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════ */}
      <Modal isOpen={showScanner} onClose={stopScanner} title="Scanner un cadeau">
        <div className="p-4 space-y-6">
          <div id="reader" className="rounded-[28px] overflow-hidden bg-black min-h-[300px] relative border-4 border-slate-100 shadow-inner">
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-slate-900/50 backdrop-blur-sm">
                <span className="spinner border-fydly-500 w-10 h-10" />
              </div>
            )}
          </div>
          <p className="text-center text-slate-500 font-medium px-4">
            Pointez la caméra vers le QR Code affiché sur le téléphone de votre client.
          </p>
        </div>
      </Modal>

      <Modal isOpen={!!pendingReward} onClose={() => setPendingReward(null)} title="Valider le cadeau">
        <div className="p-8 text-center space-y-8">
          <div className="w-20 h-20 bg-fydly-50 text-fydly-500 rounded-3xl mx-auto flex items-center justify-center shadow-sm border border-fydly-100">
            <Gift size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-display text-slate-900">Confirmation</h3>
            <p className="text-slate-500 text-lg">
              Voulez-vous valider le cadeau pour{' '}
              <strong className="text-slate-900 font-bold underline decoration-slate-200 underline-offset-4">
                {pendingReward?.customers?.first_name}
              </strong>{' '}
              ?
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setPendingReward(null)}
              disabled={isValidatingReward}
            >
              Annuler
            </Button>
            <Button className="flex-1 text-lg" onClick={validateReward} isLoading={isValidatingReward}>
              Oui, valider
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
