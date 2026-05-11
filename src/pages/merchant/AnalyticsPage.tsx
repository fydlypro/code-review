import { useState, useMemo } from 'react'
import {
  TrendingUp, RefreshCw, UserPlus, Heart, Activity, Gift,
  Send, Sparkles, Flame, Lightbulb,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useAnalytics } from '../../hooks/useAnalytics'
import { sendPushNotification } from '../../lib/onesignal'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type TimeFilter = '7d' | '30d' | '3m'
type ActiveTab = 'overview' | 'frequentation' | 'horaires' | 'score' | 'recommendations'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const SLOT_LABELS = ['8h', '10h', '12h', '14h', '16h', '18h']

// Mock heatmap data — valeurs fortes Ven-Dim matin (10h-12h)
const MOCK_HEATMAP: number[][] = [
  // Lun  Mar  Mer  Jeu  Ven  Sam  Dim
  [1,    1,    1,    2,    3,    4,    3  ], // 8h
  [2,    2,    2,    3,    4,    5,    4  ], // 10h
  [2,    2,    3,    3,    3,    4,    3  ], // 12h
  [1,    2,    2,    2,    3,    3,    3  ], // 14h
  [1,    1,    2,    2,    3,    4,    3  ], // 16h
  [0,    1,    1,    1,    2,    3,    2  ], // 18h
]

function heatBgClass(v: number): string {
  if (v === 0) return 'bg-slate-100'
  if (v === 1) return 'bg-blue-100'
  if (v === 2) return 'bg-blue-200'
  if (v === 3) return 'bg-blue-400'
  if (v === 4) return 'bg-blue-600'
  return 'bg-blue-800'
}

// ── Circular Gauge ─────────────────────────────────────────────────────────────
function CircularGauge({ score }: { score: number }) {
  const r = 48
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E2E8F0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-mono font-bold text-slate-900">{score}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/100</span>
      </div>
    </div>
  )
}

// ── Delta pill ─────────────────────────────────────────────────────────────────
function DeltaPill({ delta }: { delta: string }) {
  const positive = delta.startsWith('+')
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
      positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
    }`}>
      {delta}
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  delta,
  accent,
  icon: Icon,
  sparkColor,
  sparkBars,
}: {
  label: string
  value: string
  delta: string
  accent: string
  icon: React.ElementType
  sparkColor: string
  sparkBars: number[]
}) {
  return (
    <div
      className="relative bg-white rounded-[14px] p-5 overflow-hidden shadow-card"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {/* Sparkline SVG en fond-droit */}
      <svg
        className="absolute bottom-0 right-0 opacity-20"
        width="72"
        height="40"
        viewBox="0 0 72 40"
        aria-hidden="true"
      >
        {sparkBars.map((h, i) => (
          <rect key={i} x={i * 14 + 2} y={40 - h} width="10" height={h} rx="3" fill={sparkColor} />
        ))}
      </svg>

      <div className="flex items-start justify-between mb-3 relative">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center"
          style={{ backgroundColor: accent + '1A' }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <DeltaPill delta={delta} />
      </div>

      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[1.5px] mb-1 relative">{label}</p>
      <span className="text-[32px] font-mono font-bold text-slate-900 leading-none relative">{value}</span>
    </div>
  )
}

// ── Notif Modal ────────────────────────────────────────────────────────────────
function NotifModal({
  defaultMessage,
  defaultSegment,
  merchant,
  onClose,
}: {
  defaultMessage: string
  defaultSegment: 'all' | 'active' | 'inactive'
  merchant: any
  onClose: () => void
}) {
  const toast = useToast()
  const [message, setMessage] = useState(defaultMessage)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || !merchant) return
    setSending(true)
    try {
      const result = await sendPushNotification(merchant.id, defaultSegment, message)
      await supabase.from('notifications').insert({
        merchant_id: merchant.id,
        message,
        segment: defaultSegment,
        recipients_count: result.recipients,
        status: result.success ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      })
      toast.success('Message envoyé !')
      onClose()
    } catch {
      toast.error("Erreur lors de l'envoi.")
    } finally {
      setSending(false)
    }
  }

  const charPct = Math.round((message.length / 140) * 100)
  const barColor = message.length >= 130 ? 'bg-red-500' : message.length >= 100 ? 'bg-amber-400' : 'bg-blue-600'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] p-6 sm:p-10 w-full sm:max-w-lg shadow-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-xl font-display text-slate-900 leading-tight">Envoyer un message</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Notification push à vos clients</p>
          </div>
        </div>
        <textarea
          className="w-full border border-slate-200 rounded-2xl p-5 font-medium text-slate-900 text-sm placeholder:text-slate-300 resize-none focus:outline-none focus:border-blue-500 transition-colors bg-slate-50/50"
          rows={4}
          maxLength={140}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Écrivez votre message ici…"
          autoFocus
        />
        <div className="mt-3 mb-7">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Caractères</span>
            <span className={`text-xs font-bold ${message.length >= 130 ? 'text-red-500' : 'text-blue-600'}`}>
              {message.length}<span className="text-slate-300">/140</span>
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${charPct}%` }} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1" isLoading={sending} onClick={handleSend} disabled={!message.trim()}>
            <Send size={15} className="mr-2" /> Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { merchant } = useAuth()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d')
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [notifModal, setNotifModal] = useState<{
    message: string
    segment: 'all' | 'active' | 'inactive'
  } | null>(null)

  const threshold = merchant?.reward_threshold ?? 10
  const { data, loading, error, reload } = useAnalytics(merchant?.id, threshold)

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // ── Heatmap (real data when available, else mock) ───────────────────────────
  const heatmap = useMemo(() => {
    if (!data || data.transactions.length === 0) {
      // mock
      const peak = { day: 'Sam', slot: '10h' }
      const quiet = { day: 'Lun', slot: '8h' }
      return { grid: MOCK_HEATMAP, peak, quiet }
    }

    const grid: number[][] = Array.from({ length: 6 }, () => Array(7).fill(0))
    data.transactions.forEach(t => {
      if (t.type !== 'earn') return
      const d = new Date(t.created_at)
      const dayIdx = (d.getDay() + 6) % 7
      const h = d.getHours()
      if (h < 8 || h >= 20) return
      const slotIdx = Math.floor((h - 8) / 2)
      if (slotIdx >= 0 && slotIdx < 6) grid[slotIdx][dayIdx]++
    })

    // normalize to 0-5 scale
    const maxVal = Math.max(1, ...grid.flat())
    const normalized = grid.map(row => row.map(v => Math.round((v / maxVal) * 5)))

    let peakDay = 0, peakSlot = 0, peakCount = -1
    let quietDay = 0, quietSlot = 0, quietCount = Infinity
    normalized.forEach((row, si) => {
      row.forEach((v, di) => {
        if (v > peakCount) { peakCount = v; peakDay = di; peakSlot = si }
        if (v < quietCount) { quietCount = v; quietDay = di; quietSlot = si }
      })
    })

    return {
      grid: normalized,
      peak: { day: DAY_LABELS[peakDay], slot: SLOT_LABELS[peakSlot] },
      quiet: { day: DAY_LABELS[quietDay], slot: SLOT_LABELS[quietSlot] },
    }
  }, [data])

  // ── Chart data ──────────────────────────────────────────────────────────────
  const totalVisits = useMemo(() => {
    if (!data) return 892
    const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    return data.transactions.filter(t => t.type === 'earn' && t.created_at >= cutoff).length || 892
  }, [data, timeFilter])

  // ── Score Fydly ─────────────────────────────────────────────────────────────
  const scoreData = useMemo(() => {
    if (!data) return { total: 78, returnPts: 40, growthPts: 20, notifPts: 10, rewardPts: 8 }

    const returnRate = data.returnRate ?? 73
    const returnPts = Math.round((returnRate / 100) * 40)
    const growthPts = data.newClientsPrevMonth === 0
      ? (data.newClientsThisMonth > 0 ? 20 : 0)
      : Math.min(20, Math.round((data.newClientsThisMonth / data.newClientsPrevMonth) * 20))
    const lastNotifDays = data.lastNotificationDate
      ? Math.floor((Date.now() - new Date(data.lastNotificationDate).getTime()) / 86400000)
      : 999
    const notifPts = lastNotifDays <= 7 ? 20 : lastNotifDays <= 14 ? 15 : lastNotifDays <= 30 ? 10 : 0
    const rewardPts = Math.min(20, Math.round((data.rewardsRedeemedThisMonth ?? 0) * 2))

    return {
      total: Math.min(100, returnPts + growthPts + notifPts + rewardPts),
      returnPts,
      growthPts,
      notifPts,
      rewardPts,
    }
  }, [data])

  // ── Recommendations ─────────────────────────────────────────────────────────
  const recommendations = useMemo(() => {
    if (!data || data.totalClients < 3) {
      return [
        {
          icon: '💡',
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          text: 'Envoyez une relance à vos 63 clients inactifs',
          action: () => setNotifModal({ message: 'Vous nous manquez ! Revenez nous voir 😊', segment: 'inactive' }),
        },
        {
          icon: '🎯',
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          text: 'Programmez une promo samedi matin (créneau fort)',
          action: () => setNotifModal({ message: 'Venez ce samedi matin pour une surprise ! 🎁', segment: 'all' }),
        },
        {
          icon: '⭐',
          bg: 'bg-violet-50',
          border: 'border-violet-100',
          text: 'Score à améliorer : activez les notifications push',
          action: () => setNotifModal({ message: 'Bonjour ! On vous attend avec plaisir 😊', segment: 'all' }),
        },
      ]
    }

    const recs: Array<{ icon: string; bg: string; border: string; text: string; action?: () => void }> = []

    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const toReengageCount = data.loyaltyCards.filter(c =>
      c.last_scan_at && c.last_scan_at <= twentyDaysAgo && c.last_scan_at >= thirtyFiveDaysAgo
    ).length

    if (toReengageCount >= 3) {
      recs.push({
        icon: '💡',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: `Envoyez une relance à vos ${toReengageCount} clients inactifs`,
        action: () => setNotifModal({ message: 'Vous nous manquez ! Revenez nous voir 😊', segment: 'inactive' }),
      })
    }

    const lastNotifDays = data.lastNotificationDate
      ? Math.floor((Date.now() - new Date(data.lastNotificationDate).getTime()) / 86400000)
      : 999
    if (lastNotifDays >= 14) {
      recs.push({
        icon: '🎯',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: `Programmez une promo ${heatmap.peak?.day ?? 'samedi'} matin (créneau fort)`,
        action: () => setNotifModal({ message: `Venez ce ${(heatmap.peak?.day ?? 'samedi').toLowerCase()} pour une surprise ! 🎁`, segment: 'all' }),
      })
    }

    recs.push({
      icon: '⭐',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      text: 'Score à améliorer : activez les notifications push',
      action: () => setNotifModal({ message: 'Bonjour ! On vous attend avec plaisir 😊', segment: 'all' }),
    })

    return recs.slice(0, 4)
  }, [data, heatmap])

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-6">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-400">
          <RefreshCw size={24} />
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-bold font-display text-xl mb-1">Données indisponibles</p>
          <p className="text-slate-500 text-sm">Une erreur temporaire s'est produite.</p>
        </div>
        <Button variant="secondary" onClick={reload}>
          <RefreshCw size={15} className="mr-2" /> Réessayer
        </Button>
      </div>
    )
  }

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'frequentation', label: 'Fréquentation' },
    { id: 'horaires', label: 'Horaires' },
    { id: 'score', label: 'Score Fydly' },
    { id: 'recommendations', label: 'Recommandations' },
  ]

  return (
    <div className="space-y-6 pb-24 lg:pb-12 animate-fade-in">
      {notifModal && (
        <NotifModal
          defaultMessage={notifModal.message}
          defaultSegment={notifModal.segment}
          merchant={merchant}
          onClose={() => setNotifModal(null)}
        />
      )}

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: icon + title */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-[16px] flex items-center justify-center text-white shrink-0 bg-gradient-bv shadow-glow-strong"
              style={{ minWidth: 56, minHeight: 56 }}
            >
              <TrendingUp size={26} />
            </div>
            <div>
              <h1 className="text-[32px] sm:text-[24px] font-display font-bold text-slate-900 leading-tight" style={{ fontSize: 'clamp(24px, 5vw, 32px)' }}>
                Statistiques
              </h1>
              <p className="text-[13px] text-slate-500 mt-0.5">{today}</p>
            </div>
          </div>

          {/* Right: refresh + period filter */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={reload}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-[13px] font-semibold px-3 py-2 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 transition-all"
            >
              <RefreshCw size={14} /> Actualiser
            </button>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[10px]">
              {(['7d', '30d', '3m'] as TimeFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${
                    timeFilter === f
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f === '7d' ? '7j' : f === '30d' ? '30j' : '3m'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ────────────────────────────────────────────────────────────── */}
        <nav className="overflow-x-auto scrollbar-hide -mb-1">
          <div className="flex items-center gap-1.5 min-w-max pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-[13px] font-semibold rounded-[10px] whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="h-36" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              label="Nouveaux clients"
              value={String(data?.newClientsThisMonth ?? 42)}
              delta="+18%"
              accent="#2563EB"
              icon={UserPlus}
              sparkColor="#2563EB"
              sparkBars={[8, 14, 10, 20, 16]}
            />
            <KpiCard
              label="Taux de fidélité"
              value={`${data?.returnRate ?? 73}%`}
              delta="+4%"
              accent="#059669"
              icon={Heart}
              sparkColor="#059669"
              sparkBars={[12, 18, 14, 22, 19]}
            />
            <KpiCard
              label="Passages ce mois"
              value={String(totalVisits ?? 892)}
              delta="+12%"
              accent="#7C3AED"
              icon={Activity}
              sparkColor="#7C3AED"
              sparkBars={[16, 10, 24, 16, 28]}
            />
            <KpiCard
              label="Récompenses offertes"
              value={String(data?.rewardsRedeemedThisMonth ?? 34)}
              delta="+5"
              accent="#D97706"
              icon={Gift}
              sparkColor="#D97706"
              sparkBars={[6, 12, 9, 18, 15]}
            />
          </div>
        )}
      </section>

      {/* ── AREA CHART ──────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-[17px] font-display font-bold text-slate-900 leading-tight">
              Comment évolue votre fréquentation ?
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[12px] font-bold text-blue-700">
                {totalVisits} visites · {timeFilter === '7d' ? '7 derniers jours' : timeFilter === '30d' ? '30 derniers jours' : '3 derniers mois'}
              </span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-[12px] font-semibold px-3 py-2 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 transition-all shrink-0">
            Exporter
          </button>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full" style={{ height: 200 }}>
          <svg
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            width="100%"
            height="200"
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[40, 80, 120, 160].map(y => (
              <line
                key={y}
                x1="0" y1={y} x2="600" y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Area fill */}
            <path
              d="M0,160 L60,140 L120,120 L180,130 L240,90 L300,100 L360,70 L420,80 L480,50 L540,60 L600,40 L600,200 L0,200 Z"
              fill="url(#areaGrad)"
            />

            {/* Line */}
            <path
              d="M0,160 L60,140 L120,120 L180,130 L240,90 L300,100 L360,70 L420,80 L480,50 L540,60 L600,40"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Date labels */}
          <div className="flex justify-between px-1 mt-1">
            {['10 jan', '17 jan', '24 jan', '1 fév', '8 fév', '15 fév', '22 fév'].map(d => (
              <span key={d} className="text-[10px] font-semibold text-slate-400">{d}</span>
            ))}
          </div>
        </div>

        {/* Insight bandeau vert */}
        <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-[12px] px-4 py-3">
          <span className="text-base shrink-0">📈</span>
          <p className="text-[13px] font-semibold text-emerald-800">
            Vos visites sont en hausse ! · +12% sur 30 jours
          </p>
        </div>
      </section>

      {/* ── HEATMAP ─────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-[17px] font-display font-bold text-slate-900">
            Quand vos clients viennent-ils ?
          </h2>
          <p className="text-[12px] text-slate-400 font-medium mt-1">Intensité par jour et créneau</p>
        </div>

        {loading ? (
          <SkeletonLoader variant="rect" className="h-48 w-full rounded-xl" />
        ) : (
          <>
            {/* Header row: jours */}
            <div className="grid mb-1.5" style={{ gridTemplateColumns: '40px repeat(7, 1fr)', gap: 4 }}>
              <div />
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            {heatmap.grid.map((row, si) => (
              <div
                key={si}
                className="grid mb-1"
                style={{ gridTemplateColumns: '40px repeat(7, 1fr)', gap: 4 }}
              >
                <div className="text-[10px] font-bold text-slate-400 flex items-center">
                  {SLOT_LABELS[si]}
                </div>
                {row.map((v, di) => (
                  <div
                    key={di}
                    className={`rounded-[6px] ${heatBgClass(v)}`}
                    style={{ height: 28 }}
                    title={`${DAY_LABELS[di]} ${SLOT_LABELS[si]}`}
                  />
                ))}
              </div>
            ))}

            {/* Légende */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <div className="w-4 h-4 rounded-[4px] bg-slate-100" />
              <span className="text-[11px] text-slate-400 font-medium -ml-1">Peu</span>
              <div className="w-4 h-4 rounded-[4px] bg-blue-200" />
              <div className="w-4 h-4 rounded-[4px] bg-blue-400" />
              <div className="w-4 h-4 rounded-[4px] bg-blue-600" />
              <div className="w-4 h-4 rounded-[4px] bg-blue-800" />
              <span className="text-[11px] text-slate-400 font-medium -ml-1">Beaucoup</span>
            </div>

            {/* Insight cards */}
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-[14px] px-4 py-3">
                <Flame size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Heure de pointe</p>
                  <p className="text-[13px] font-bold text-amber-900">
                    {heatmap.peak?.day ?? 'Samedi'} {heatmap.peak?.slot ?? '10h'}-{
                      heatmap.peak?.slot ? SLOT_LABELS[SLOT_LABELS.indexOf(heatmap.peak.slot) + 1] ?? '12h' : '12h'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-3">
                <Lightbulb size={18} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Créneau calme</p>
                  <p className="text-[13px] font-bold text-slate-900">
                    {heatmap.quiet?.day ?? 'Lundi'} {heatmap.quiet?.slot ?? '8h'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── SCORE FYDLY ─────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
        <h2 className="text-[17px] font-display font-bold text-slate-900 mb-1">Score Fydly</h2>
        <p className="text-[12px] text-slate-500 mb-6">
          Indicateur global de performance de votre programme de fidélité.
        </p>

        {loading ? (
          <div className="flex justify-center">
            <SkeletonLoader variant="circle" className="w-32 h-32" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center">
            {/* Circular gauge */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <CircularGauge score={scoreData.total} />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {scoreData.total >= 71 ? 'Excellent' : scoreData.total >= 41 ? 'Bien' : 'À améliorer'}
              </p>
            </div>

            {/* Sub-metrics */}
            <div className="flex-1 w-full space-y-4">
              {[
                { label: 'Fidélité', pct: data?.returnRate ?? 73 },
                { label: 'Engagement', pct: Math.round((scoreData.notifPts / 20) * 100) || 68 },
                { label: 'Satisfaction', pct: Math.round(((scoreData.growthPts + scoreData.rewardPts) / 40) * 100) || 90 },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[13px] font-semibold text-slate-700">{m.label}</span>
                    <span className="text-[13px] font-bold text-slate-900">{m.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-bv transition-all duration-700"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── RECOMMANDATIONS ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
        <h2 className="text-[17px] font-display font-bold text-slate-900 mb-5">Recommandations</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="h-16" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <button
                  key={i}
                  onClick={rec.action}
                  className={`w-full flex items-center gap-4 ${rec.bg} border ${rec.border} rounded-[14px] px-4 py-3.5 text-left transition-all hover:opacity-90 active:scale-[0.99]`}
                >
                  <span className="text-xl shrink-0">{rec.icon}</span>
                  <p className="text-[13px] font-semibold text-slate-900 flex-1">{rec.text}</p>
                </button>
              ))}
            </div>

            <button className="mt-4 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 text-[13px] font-semibold py-3 rounded-[12px] border border-slate-200 hover:bg-slate-50 transition-all">
              Voir toutes les recommandations
            </button>
          </>
        )}
      </section>
    </div>
  )
}
