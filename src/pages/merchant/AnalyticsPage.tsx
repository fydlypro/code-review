import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Bell, Send, RefreshCw, MessageSquare, TrendingUp, TrendingDown, Minus,
  Users, Repeat2, CalendarDays, Gift, BarChart2, Flame, Lightbulb, Sparkles, UserPlus,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useAnalytics } from '../../hooks/useAnalytics'
import { sendPushNotification } from '../../lib/onesignal'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type TimeFilter = '7d' | '30d' | '3m'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const SLOT_LABELS = ['8h–10h', '10h–12h', '12h–14h', '14h–16h', '16h–18h', '18h–20h']

function heatColor(count: number): string {
  if (count === 0) return '#F5F5F5'
  if (count <= 3) return '#BBDEFB'
  if (count <= 7) return '#64B5F6'
  if (count <= 12) return '#2196F3'
  return '#0D47A1'
}

// ── Circular progress ─────────────────────────────────────────────────────────
function CircularScore({ score, color }: { score: number; color: string }) {
  const r = 82
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const sublabel = score >= 71 ? 'Excellent' : score >= 41 ? 'Bien' : 'À améliorer'
  return (
    <div className="relative inline-flex items-center justify-center shrink-0 mx-auto">
      {/* Scale SVG down on small screens */}
      <svg width="200" height="200" className="-rotate-90 w-36 h-36 sm:w-44 sm:h-44 lg:w-[200px] lg:h-[200px]"
        viewBox="0 0 200 200">
        {/* Outer decorative ring */}
        <circle cx="100" cy="100" r={r + 10} fill="none" stroke="#E3F2FD" strokeWidth="3" strokeDasharray="4 6" strokeLinecap="round" />
        {/* Background track */}
        <circle cx="100" cy="100" r={r} fill="none" stroke="#E3F2FD" strokeWidth="14" />
        {/* Progress arc */}
        <circle
          cx="100" cy="100" r={r}
          fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl sm:text-4xl font-display" style={{ color }}>{score}</span>
        <span className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest">/100</span>
        <span className="text-[11px] font-bold mt-1" style={{ color }}>{sublabel}</span>
      </div>
    </div>
  )
}

// ── Variation badge ────────────────────────────────────────────────────────────
function Variation({ current, prev }: { current: number; prev: number }) {
  if (prev === 0 && current === 0) return null
  const diff = current - prev
  const pct = prev === 0 ? 100 : Math.round((diff / prev) * 100)
  if (diff > 0)
    return <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full"><TrendingUp size={12} /> +{pct}%</span>
  if (diff < 0)
    return <span className="text-xs font-bold text-red-500 flex items-center gap-0.5 bg-red-50 px-2 py-0.5 rounded-full"><TrendingDown size={12} /> {pct}%</span>
  return <span className="text-xs font-bold text-fydly-400 flex items-center gap-0.5 bg-fydly-50 px-2 py-0.5 rounded-full"><Minus size={12} /> Stable</span>
}

// ── Quick notification modal ───────────────────────────────────────────────────
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
  const barColor = message.length >= 130 ? 'bg-red-500' : message.length >= 100 ? 'bg-amber-400' : 'bg-fydly-500'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] p-6 sm:p-10 w-full sm:max-w-lg shadow-2xl animate-slide-up sm:animate-fade-in pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-fydly-500 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-xl font-display text-fydly-900 leading-tight">Envoyer un message</h3>
            <p className="text-xs text-fydly-400 font-medium mt-0.5">Notification push à vos clients</p>
          </div>
        </div>
        <textarea
          className="w-full border-[1.5px] border-fydly-200 rounded-2xl p-5 font-medium text-fydly-900 text-base sm:text-sm placeholder:text-fydly-300 resize-none focus:outline-none focus:border-fydly-500 transition-colors bg-fydly-50/40"
          rows={4}
          maxLength={140}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Écrivez votre message ici…"
          autoFocus
        />
        {/* Compteur + barre de progression */}
        <div className="mt-3 mb-7">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-fydly-400 uppercase tracking-wider">Caractères</span>
            <span className={`text-xs font-bold tabular-nums ${message.length >= 130 ? 'text-red-500' : 'text-fydly-500'}`}>
              {message.length}<span className="text-fydly-300">/140</span>
            </span>
          </div>
          <div className="h-1.5 bg-fydly-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${charPct}%` }}
            />
          </div>
        </div>
        {/* Boutons full-width */}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { merchant } = useAuth()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d')
  const [notifModal, setNotifModal] = useState<{
    message: string
    segment: 'all' | 'active' | 'inactive'
  } | null>(null)

  const threshold = merchant?.reward_threshold ?? 10
  const { data, loading, error, reload } = useAnalytics(merchant?.id, threshold)

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!data) return []
    const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const byDay: Record<string, number> = {}
    data.transactions
      .filter(t => t.type === 'earn' && t.created_at >= cutoff)
      .forEach(t => {
        const k = new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        byDay[k] = (byDay[k] || 0) + 1
      })
    return Object.entries(byDay).map(([date, visites]) => ({ date, visites }))
  }, [data, timeFilter])

  const trend = useMemo((): 'hausse' | 'stable' | 'baisse' => {
    if (chartData.length < 4) return 'stable'
    const half = Math.floor(chartData.length / 2)
    const first = chartData.slice(0, half).reduce((s, d) => s + d.visites, 0)
    const second = chartData.slice(half).reduce((s, d) => s + d.visites, 0)
    if (second > first * 1.1) return 'hausse'
    if (second < first * 0.9) return 'baisse'
    return 'stable'
  }, [chartData])

  // ── Heatmap ─────────────────────────────────────────────────────────────────
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0))
    if (!data) return { grid, peak: null, quiet: null }

    data.transactions.forEach(t => {
      if (t.type !== 'earn') return
      const d = new Date(t.created_at)
      const displayDay = (d.getDay() + 6) % 7 // 0=Mon … 6=Sun
      const h = d.getHours()
      if (h < 8 || h >= 20) return
      const slot = Math.floor((h - 8) / 2)
      grid[displayDay][slot]++
    })

    let peak = { day: 0, slot: 0, count: -1 }
    let quiet = { day: 0, slot: 0, count: Infinity }
    grid.forEach((row, di) => {
      row.forEach((count, si) => {
        if (count > peak.count) peak = { day: di, slot: si, count }
        if (count < quiet.count) quiet = { day: di, slot: si, count }
      })
    })

    return {
      grid,
      peak: peak.count > 0 ? { day: DAY_LABELS[peak.day], slot: SLOT_LABELS[peak.slot] } : null,
      quiet: quiet.count < Infinity
        ? { day: DAY_LABELS[quiet.day], slot: SLOT_LABELS[quiet.slot] }
        : null,
    }
  }, [data])

  // ── Fydly score ─────────────────────────────────────────────────────────────
  const scoreData = useMemo(() => {
    if (!data) return { total: 0, returnPts: 0, growthPts: 0, notifPts: 0, rewardPts: 0 }

    const returnPts = Math.round((data.returnRate / 100) * 40)
    const growthPts = data.newClientsPrevMonth === 0
      ? (data.newClientsThisMonth > 0 ? 20 : 0)
      : Math.min(20, Math.round((data.newClientsThisMonth / data.newClientsPrevMonth) * 20))
    const lastNotifDays = data.lastNotificationDate
      ? Math.floor((Date.now() - new Date(data.lastNotificationDate).getTime()) / 86400000)
      : 999
    const notifPts = lastNotifDays <= 7 ? 20 : lastNotifDays <= 14 ? 15 : lastNotifDays <= 30 ? 10 : 0
    const rewardPts = Math.min(20, Math.round(data.rewardsRedeemedThisMonth * 2))

    return {
      total: Math.min(100, returnPts + growthPts + notifPts + rewardPts),
      returnPts,
      growthPts,
      notifPts,
      rewardPts,
    }
  }, [data])

  const scoreColor = scoreData.total >= 71 ? '#2196F3' : scoreData.total >= 41 ? '#FF9800' : '#EF5350'
  const scoreMsg =
    scoreData.total >= 71
      ? 'Excellent ! Votre programme de fidélité est très efficace. Bravo !'
      : scoreData.total >= 41
      ? 'Vous êtes sur la bonne voie ! Continuez à relancer vos clients.'
      : 'Votre programme démarre. Suivez nos recommandations pour progresser !'

  // ── Recommendations ─────────────────────────────────────────────────────────
  const recommendations = useMemo(() => {
    if (!data) return []
    const recs: Array<{
      icon: string
      title: string
      text: string
      cta?: string
      action?: () => void
      urgent?: boolean
    }> = []

    if (data.totalClients < 3) {
      recs.push({
        icon: '🚀',
        title: 'Vos analytics arrivent bientôt !',
        text: "Dès que vous aurez vos premiers clients, nous vous proposerons ici des recommandations personnalisées pour booster votre fidélité.",
      })
      return recs
    }

    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const toReengageCount = data.loyaltyCards.filter(c =>
      c.last_scan_at && c.last_scan_at <= twentyDaysAgo && c.last_scan_at >= thirtyFiveDaysAgo
    ).length

    if (toReengageCount >= 3) {
      recs.push({
        icon: '⚠️',
        title: `${toReengageCount} clients vont bientôt partir`,
        text: "Ils n'ont pas visité depuis 3 semaines. Un petit message maintenant peut les faire revenir.",
        cta: 'Envoyer une relance',
        urgent: true,
        action: () => setNotifModal({ message: 'Vous nous manquez ! Revenez nous voir 😊', segment: 'inactive' }),
      })
    }

    const lastNotifDays = data.lastNotificationDate
      ? Math.floor((Date.now() - new Date(data.lastNotificationDate).getTime()) / 86400000)
      : 999
    if (lastNotifDays >= 14) {
      recs.push({
        icon: '🔔',
        title: "Vos clients n'ont pas eu de nouvelles",
        text: "Vous n'avez pas envoyé de message depuis 2 semaines. C'est le bon moment !",
        cta: 'Envoyer un message',
        action: () => setNotifModal({ message: 'Bonjour ! On vous attend avec plaisir 😊', segment: 'all' }),
      })
    }

    if (heatmap.quiet) {
      const { day, slot } = heatmap.quiet
      recs.push({
        icon: '📅',
        title: `Vos ${day} sont peu fréquentés`,
        text: `C'est votre créneau le plus calme (${slot}). Une petite promotion ce jour-là pourrait attirer plus de monde.`,
        cta: 'Créer une promo',
        action: () =>
          setNotifModal({
            message: `Venez nous voir ce ${day.toLowerCase()} pour une surprise ! 🎁`,
            segment: 'all',
          }),
      })
    }

    const hasVipClient = data.loyaltyCards.some(
      c => c.total_earned >= 3 * threshold && c.total_earned < 4 * threshold
    )
    if (hasVipClient) {
      recs.push({
        icon: '🎉',
        title: 'Un client vient de compléter son 3ème programme !',
        text: 'Un de vos clients fidèles a atteint un cap important. Un message personnel lui ferait très plaisir.',
        cta: 'Envoyer un message',
        action: () =>
          setNotifModal({
            message: 'Merci pour votre fidélité exceptionnelle ! Vous êtes incroyable 🌟',
            segment: 'all',
          }),
      })
    }

    if (trend === 'baisse') {
      recs.push({
        icon: '📉',
        title: 'Moins de clients cette semaine',
        text: "Vos visites ont légèrement baissé. C'est normal, mais une notification peut redonner un coup de boost.",
        cta: 'Envoyer une notification',
        action: () =>
          setNotifModal({ message: 'On vous attend ! Venez nous rendre visite 😊', segment: 'all' }),
      })
    }

    return recs.slice(0, 3)
  }, [data, heatmap, threshold, trend])

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-6 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 border border-red-100">
          <RefreshCw size={28} />
        </div>
        <div className="text-center">
          <p className="text-fydly-900 font-bold font-display text-xl mb-1">Données indisponibles</p>
          <p className="text-fydly-500 font-medium text-sm">Une erreur temporaire s'est produite.</p>
        </div>
        <Button variant="secondary" onClick={reload}>
          <RefreshCw size={15} className="mr-2" /> Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-32 lg:pb-12">
      {notifModal && (
        <NotifModal
          defaultMessage={notifModal.message}
          defaultSegment={notifModal.segment}
          merchant={merchant}
          onClose={() => setNotifModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-fydly-900 to-fydly-700 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
              <TrendingUp size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display text-fydly-900 leading-tight">Statistiques</h1>
              <p className="text-fydly-500 font-medium text-xs sm:text-sm truncate">
                Comprenez votre activité
                <span className="hidden sm:inline"> et agissez. &nbsp;·&nbsp;{' '}
                  <span className="text-fydly-400">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={reload}
            className="group flex items-center justify-center gap-2 text-fydly-600 hover:text-fydly-900 text-sm sm:text-xs font-bold transition-all px-4 py-2 min-h-[44px] rounded-full border border-fydly-200 bg-white hover:bg-fydly-50 hover:border-fydly-300 shadow-sm active:scale-[0.98] active:opacity-80 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Actualiser
          </button>
        </div>
        {/* Quick nav tabs */}
        <nav className="overflow-x-auto scrollbar-hide pb-2 -mb-1 touch-pan-x w-full">
          <div className="flex items-center gap-1 min-w-max lg:w-full bg-white border border-fydly-100 rounded-2xl p-1 shadow-sm">
            {[
              { label: 'Vue d\'ensemble', href: '#kpis' },
              { label: 'Fréquentation', href: '#frequentation' },
              { label: 'Horaires', href: '#horaires' },
              { label: 'Messages', href: '#messages' },
              { label: 'Score', href: '#score' },
            ].map((tab, i) => (
              <a
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center rounded-xl text-sm sm:text-xs font-bold whitespace-nowrap transition-all active:scale-[0.98] active:opacity-80 ${
                  i === 0
                    ? 'bg-fydly-900 text-white shadow-sm'
                    : 'text-fydly-500 hover:text-fydly-900 hover:bg-fydly-50'
                }`}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </nav>
      </div>

      {/* ── SECTION 1 — KPIs ── */}
      <section id="kpis">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fydly-50 border border-fydly-100 flex items-center justify-center text-fydly-500">
            <BarChart2 size={14} />
          </div>
          <h2 className="text-xs font-bold text-fydly-500 uppercase tracking-[2px]">Vue d'ensemble du mois</h2>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="h-40" />
            ))
          ) : (
            <>
              {/* Nouveaux clients — bleu */}
              <Card className="relative p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 bg-white border border-fydly-100/50 border-l-4 border-l-blue-400 hover:shadow-card-hover transition-all duration-200 group overflow-hidden active:scale-[0.98]">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
                    <UserPlus size={18} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <Variation current={data?.newClientsThisMonth ?? 0} prev={data?.newClientsPrevMonth ?? 0} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-[2px]">Nouveaux clients</p>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-display text-fydly-900 leading-none">{data?.newClientsThisMonth ?? 0}</span>
                </div>
                <p className="text-xs text-fydly-500 font-medium leading-relaxed border-t border-fydly-50 pt-3">
                  {data?.newClientsThisMonth === 1 ? 'Nouveau membre ce mois.' : 'Nouveaux membres ce mois.'}
                </p>
                <svg className="absolute bottom-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity" width="40" height="20" viewBox="0 0 40 20">
                  {[4, 8, 5, 12, 9].map((h, idx) => (
                    <rect key={idx} x={idx * 9} y={20 - h} width="6" height={h} rx="2" fill="#3B82F6" />
                  ))}
                </svg>
              </Card>

              {/* Taux de fidélité — vert */}
              <Card className="relative p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 bg-white border border-fydly-100/50 border-l-4 border-l-emerald-400 hover:shadow-card-hover transition-all duration-200 group overflow-hidden active:scale-[0.98]">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                    <Repeat2 size={18} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-[2px]">Taux de fidélité</p>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-display text-fydly-900 leading-none">{data?.returnRate ?? 0}%</span>
                </div>
                <p className="text-xs text-fydly-500 font-medium leading-relaxed border-t border-fydly-50 pt-3">
                  {(data?.returnRate ?? 0) >= 60 ? 'Excellent — vos clients adorent revenir.' : (data?.returnRate ?? 0) >= 40 ? 'Bien ! Continuez à les fidéliser.' : 'Relancez vos clients pour progresser.'}
                </p>
                <svg className="absolute bottom-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity" width="40" height="20" viewBox="0 0 40 20">
                  {[6, 10, 7, 14, 11].map((h, idx) => (
                    <rect key={idx} x={idx * 9} y={20 - h} width="6" height={h} rx="2" fill="#10B981" />
                  ))}
                </svg>
              </Card>

              {/* Passages ce mois — violet */}
              <Card className="relative p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 bg-white border border-fydly-100/50 border-l-4 border-l-violet-400 hover:shadow-card-hover transition-all duration-200 group overflow-hidden active:scale-[0.98]">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-500 group-hover:text-white transition-all duration-200">
                    <CalendarDays size={18} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <Variation current={data?.totalVisitsThisMonth ?? 0} prev={data?.totalVisitsPrevMonth ?? 0} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-[2px]">Passages ce mois</p>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-display text-fydly-900 leading-none">{data?.totalVisitsThisMonth ?? 0}</span>
                </div>
                <p className="text-xs text-fydly-500 font-medium leading-relaxed border-t border-fydly-50 pt-3">
                  Passages en caisse ce mois-ci.
                </p>
                <svg className="absolute bottom-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity" width="40" height="20" viewBox="0 0 40 20">
                  {[9, 5, 13, 8, 15].map((h, idx) => (
                    <rect key={idx} x={idx * 9} y={20 - h} width="6" height={h} rx="2" fill="#8B5CF6" />
                  ))}
                </svg>
              </Card>

              {/* Récompenses offertes — ambre */}
              <Card className="relative p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 bg-white border border-fydly-100/50 border-l-4 border-l-amber-400 hover:shadow-card-hover transition-all duration-200 group overflow-hidden active:scale-[0.98]">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                    <Gift size={18} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-[2px]">Récompenses offertes</p>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-display text-fydly-900 leading-none">{data?.rewardsRedeemedThisMonth ?? 0}</span>
                </div>
                <p className="text-xs text-fydly-500 font-medium leading-relaxed border-t border-fydly-50 pt-3">
                  {(data?.rewardsRedeemedThisMonth ?? 0) === 1 ? 'Client récompensé ce mois.' : 'Clients récompensés ce mois.'}
                </p>
                <svg className="absolute bottom-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity" width="40" height="20" viewBox="0 0 40 20">
                  {[3, 7, 5, 10, 8].map((h, idx) => (
                    <rect key={idx} x={idx * 9} y={20 - h} width="6" height={h} rx="2" fill="#F59E0B" />
                  ))}
                </svg>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── SECTION 2 — Chart ── */}
      <div id="frequentation">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 shrink-0">
            <BarChart2 size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-[2px] leading-none">Analytique</p>
            <p className="text-[11px] font-semibold text-fydly-700 leading-none mt-0.5">Évolution de la fréquentation</p>
          </div>
        </div>
        <Card className="p-4 sm:p-6 lg:p-8 bg-white border border-fydly-100/50">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-display text-fydly-900 leading-tight">
                Comment évolue votre fréquentation ?
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <p className="text-fydly-400 text-xs font-medium">Passages clients sur la période</p>
                {chartData.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600">
                    {chartData.reduce((sum, d) => sum + d.visites, 0)} visites
                  </span>
                )}
              </div>
            </div>
            <div className="flex w-full sm:w-auto bg-fydly-50 p-1 rounded-2xl border border-fydly-100 shrink-0">
              {(['7d', '30d', '3m'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center rounded-xl text-sm sm:text-[10px] font-bold transition-all whitespace-nowrap ${
                    timeFilter === f
                      ? 'bg-fydly-900 text-white shadow-sm'
                      : 'text-fydly-400 hover:bg-fydly-100 hover:text-fydly-700'
                  }`}
                >
                  {f === '7d' ? '7 jours' : f === '30d' ? '30 jours' : '3 mois'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <SkeletonLoader variant="rect" className="h-72 w-full rounded-2xl" />
          ) : chartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center gap-4 bg-fydly-50/50 rounded-2xl border border-fydly-100 border-dashed">
              {/* Illustration SVG barres fantômes */}
              <svg width="140" height="72" viewBox="0 0 140 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
                <line x1="0" y1="68" x2="140" y2="68" stroke="#BBDEFB" strokeWidth="2" strokeLinecap="round"/>
                <rect x="8" y="44" width="18" height="24" rx="4" fill="#E3F2FD"/>
                <rect x="34" y="32" width="18" height="36" rx="4" fill="#BBDEFB"/>
                <rect x="60" y="50" width="18" height="18" rx="4" fill="#E3F2FD"/>
                <rect x="86" y="20" width="18" height="48" rx="4" fill="#BBDEFB"/>
                <rect x="112" y="38" width="18" height="30" rx="4" fill="#E3F2FD"/>
              </svg>
              <div className="text-center">
                <p className="text-fydly-700 font-bold text-sm">Aucune donnée sur cette période</p>
                <p className="text-fydly-400 text-xs font-medium mt-1">Les visites apparaîtront ici dès qu'elles seront enregistrées.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 4, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2196F3" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1565C0" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#EEF4FB" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#90CAF9', fontWeight: 700 }}
                      dy={10}
                      interval={chartData.length > 15 ? Math.floor(chartData.length / 8) : 0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#90CAF9', fontWeight: 700 }}
                      allowDecimals={false}
                      width={35}
                    />
                    <Tooltip
                      cursor={{ stroke: '#E3F2FD', strokeWidth: 2 }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid #BBDEFB',
                        boxShadow: '0 12px 32px rgba(33,150,243,0.12)',
                        padding: '12px 16px',
                        backgroundColor: '#fff',
                      }}
                      itemStyle={{ color: '#0D47A1', fontWeight: 'bold', fontSize: '13px' }}
                      labelStyle={{ color: '#90CAF9', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}
                      formatter={(v) => [`${v} visite${Number(v) > 1 ? 's' : ''}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="visites"
                      stroke="#2196F3"
                      strokeWidth={3}
                      fill="url(#grad)"
                      dot={{ r: 0 }}
                      activeDot={{ r: 7, fill: '#2196F3', stroke: '#fff', strokeWidth: 3, strokeOpacity: 0.8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Trend badge — card pleine largeur */}
              <div
                className={`mt-6 p-5 rounded-2xl flex items-start gap-4 ${
                  trend === 'hausse'
                    ? 'bg-emerald-50 border border-emerald-100'
                    : trend === 'baisse'
                    ? 'bg-red-50 border border-red-100'
                    : 'bg-fydly-50 border border-fydly-100'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">
                  {trend === 'hausse' ? '📈' : trend === 'baisse' ? '📉' : '📊'}
                </span>
                <div>
                  <p className={`text-sm font-bold leading-tight ${
                    trend === 'hausse' ? 'text-emerald-800' : trend === 'baisse' ? 'text-red-700' : 'text-fydly-800'
                  }`}>
                    {trend === 'hausse' && 'Vos visites sont en hausse !'}
                    {trend === 'stable' && 'Fréquentation stable'}
                    {trend === 'baisse' && 'Baisse de fréquentation détectée'}
                  </p>
                  <p className={`text-xs font-medium mt-1 leading-relaxed ${
                    trend === 'hausse' ? 'text-emerald-700' : trend === 'baisse' ? 'text-red-600' : 'text-fydly-600'
                  }`}>
                    {trend === 'hausse' && 'Bonne dynamique ! Continuez à fidéliser vos clients pour maintenir cette progression.'}
                    {trend === 'stable' && 'Envoyez une notification push pour booster vos passages ce mois-ci.'}
                    {trend === 'baisse' && "C'est le moment de relancer vos clients inactifs avec une offre ciblée."}
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── SECTION 3 — Heatmap ── */}
      <div id="horaires">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shrink-0">
            <CalendarDays size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-[2px] leading-none">Présence</p>
            <p className="text-[11px] font-semibold text-fydly-700 leading-none mt-0.5">Carte de chaleur horaire</p>
          </div>
        </div>
      <Card className="p-4 sm:p-6 lg:p-8 bg-white border border-fydly-100/50">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-display text-fydly-900">
            Quand vos clients viennent-ils ?
          </h3>
          <p className="text-fydly-400 text-[11px] sm:text-xs font-medium mt-1">Intensité de fréquentation par jour et par créneau.</p>
        </div>
        {loading ? (
          <SkeletonLoader variant="rect" className="h-52 w-full rounded-2xl" />
        ) : (
          <>
            <div className="w-full pb-2 -mx-1 px-1">
              <div className="w-full">
                {/* Day headers */}
                <div className="grid gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 grid-cols-[38px_repeat(7,1fr)] sm:grid-cols-[52px_repeat(7,1fr)]">
                  <div />
                  {DAY_LABELS.map(d => (
                    <div
                      key={d}
                      className="text-center text-[9px] sm:text-[11px] font-bold text-fydly-400 uppercase tracking-wider pb-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {SLOT_LABELS.map((slot, si) => (
                  <div
                    key={slot}
                    className="grid gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 grid-cols-[38px_repeat(7,1fr)] sm:grid-cols-[52px_repeat(7,1fr)]"
                  >
                    <div className="text-[8px] sm:text-[10px] font-bold text-fydly-400 flex items-center tracking-tighter sm:tracking-normal whitespace-pre-wrap sm:whitespace-nowrap leading-tight">
                      {slot}
                    </div>
                    {DAY_LABELS.map((_, di) => {
                      const count = heatmap.grid[di][si]
                      return (
                        <div
                          key={di}
                          className="h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all duration-150 hover:scale-105 cursor-default"
                          style={{
                            backgroundColor: heatColor(count),
                            color: count >= 8 ? '#fff' : '#90CAF9',
                          }}
                          title={`${DAY_LABELS[di]} ${slot} : ${count} visite${count !== 1 ? 's' : ''}`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              {(
                [
                  ['#F5F5F5', 'Aucune'],
                  ['#BBDEFB', '1–3'],
                  ['#64B5F6', '4–7'],
                  ['#2196F3', '8–12'],
                  ['#0D47A1', '13+'],
                ] as [string, string][]
              ).map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="rounded-md w-5 h-5 border border-black/5" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-bold text-fydly-400">{label}</span>
                </div>
              ))}
            </div>
            {/* Insights */}
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {heatmap.peak && (
                <div className="flex items-start gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Flame size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Heure de pointe</p>
                    <p className="text-sm font-bold text-amber-900 leading-tight">
                      {heatmap.peak.day} · {heatmap.peak.slot}
                    </p>
                    <p className="text-[11px] text-amber-600 font-medium mt-0.5">Votre pic de fréquentation</p>
                  </div>
                </div>
              )}
              {heatmap.quiet && (
                <div className="flex items-start gap-4 bg-fydly-50 border border-fydly-100 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Lightbulb size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-fydly-500 uppercase tracking-wider mb-0.5">Créneau le plus calme</p>
                    <p className="text-sm font-bold text-fydly-900 leading-tight">
                      {heatmap.quiet.day} · {heatmap.quiet.slot}
                    </p>
                    <button
                      onClick={() => setNotifModal({ message: `Profitez du créneau ${heatmap.quiet!.slot} pour venir nous rendre visite — on vous attend ! 😊`, segment: 'all' })}
                      className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
                    >
                      Profiter de ce créneau →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
      </div>

      {/* ── SECTION 4 — Notification performance ── */}
      <div id="messages">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <Send size={14} />
          </div>
          <h2 className="text-xs font-bold text-fydly-500 uppercase tracking-[2px]">Performance des messages</h2>
        </div>
        <Card className="p-4 sm:p-6 lg:p-8 bg-white border border-fydly-100/50">
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-display text-fydly-900">
              Vos messages ont-ils fonctionné ?
            </h3>
            <p className="text-fydly-400 text-xs font-medium mt-1">Visites générées dans les 48h suivant chaque envoi.</p>
          </div>
          {loading ? (
            <SkeletonLoader variant="rect" className="h-40 w-full rounded-2xl" />
          ) : (data?.recentNotifications.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-5 py-14 bg-fydly-50/50 rounded-2xl border border-fydly-100 border-dashed">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-fydly-200 border border-fydly-100 shadow-sm">
                <Bell size={30} />
              </div>
              <div className="text-center">
                <p className="text-fydly-900 font-bold text-base mb-1">
                  Aucun message envoyé pour l'instant.
                </p>
                <p className="text-fydly-400 text-sm font-medium">
                  Vos clients apprécient d'avoir des nouvelles de vous.
                </p>
              </div>
              <Button
                className="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-bold shadow-md min-h-[44px]"
                onClick={() =>
                  setNotifModal({
                    message: 'Bonjour ! On vous attend avec plaisir 😊',
                    segment: 'all',
                  })
                }
              >
                <Send size={15} className="mr-2" /> Envoyer mon premier message
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentNotifications.map(n => {
                const pct =
                  n.recipients_count > 0
                    ? Math.round((n.visitsAfter / n.recipients_count) * 100)
                    : 0
                const badge =
                  pct >= 20
                    ? { label: 'Très efficace', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100', barColor: '#10b981' }
                    : pct >= 10
                    ? { label: 'Bien', cls: 'bg-fydly-50 text-fydly-700 border border-fydly-100', barColor: '#2196F3' }
                    : { label: 'Peut mieux faire', cls: 'bg-amber-50 text-amber-700 border border-amber-100', barColor: '#f59e0b' }
                return (
                  <div
                    key={n.id}
                    className="bg-fydly-50/30 hover:bg-fydly-50 rounded-2xl p-5 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-fydly-400 shrink-0 border border-fydly-100 shadow-sm">
                        <Send size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fydly-900 italic truncate">
                          "{n.message}"
                        </p>
                        <p className="text-xs text-fydly-400 font-bold mt-1">
                          {n.sent_at
                            ? new Date(n.sent_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : ''}
                          {n.recipients_count > 0 &&
                            ` · ${n.recipients_count} destinataire${n.recipients_count > 1 ? 's' : ''}`}
                        </p>
                        {/* Barre de progression conversion */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-bold text-fydly-400 mb-1">
                            <span>Taux de retour</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-fydly-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: badge.barColor }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full text-center whitespace-nowrap ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <p className="text-xs text-fydly-500 font-medium text-right whitespace-nowrap">
                          {n.visitsAfter} visite{n.visitsAfter !== 1 ? 's' : ''} en 48h
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── SECTION 6 — Recommendations ── */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
            <Sparkles size={14} />
          </div>
          <h2 className="text-xs font-bold text-fydly-500 uppercase tracking-[2px]">Recommandations personnalisées</h2>
        </div>
        <div className="flex items-baseline justify-between mb-5">
          <h3 className="text-xl sm:text-2xl font-display text-fydly-900">
            Ce que Fydly vous recommande
          </h3>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="h-28" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <Card className="p-8 flex items-center gap-5 bg-white border border-fydly-100/50">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-fydly-900 font-bold text-sm">Tout va bien !</p>
              <p className="text-fydly-500 font-medium text-sm">Aucune recommandation urgente pour l'instant.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <Card
                key={i}
                className={`overflow-hidden border-l-4 transition-all ${
                  rec.urgent
                    ? 'border-l-orange-400 border-orange-200 bg-gradient-to-r from-orange-50 to-white'
                    : 'border-l-fydly-300 border-fydly-100/50 bg-white hover:shadow-card-hover'
                }`}
              >
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                  <div className="flex items-start gap-4 sm:contents">
                    {/* Icône emoji dans carré arrondi */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-sm ${
                      rec.urgent ? 'bg-orange-100 border border-orange-200' : 'bg-fydly-50 border border-fydly-100'
                    }`}>
                      {rec.icon}
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <div className="flex items-center gap-2 mb-1 sm:mb-1.5 flex-wrap">
                        <h3 className="font-display text-fydly-900 text-base sm:text-lg leading-snug">{rec.title}</h3>
                        {rec.urgent && (
                          <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-fydly-600 font-medium leading-relaxed">{rec.text}</p>
                    </div>
                  </div>
                  {rec.cta && rec.action && (
                    <div className="w-full sm:w-auto sm:self-center shrink-0 sm:ml-auto mt-2 sm:mt-0">
                      <Button
                        size="md"
                        style={rec.urgent ? { backgroundColor: '#FF9800' } : undefined}
                        onClick={rec.action}
                        className="w-full sm:w-auto min-h-[44px]"
                      >
                        {rec.cta}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── SECTION 7 — Fydly score ── */}
      <div id="score">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-fydly-50 border border-fydly-100 flex items-center justify-center text-fydly-500">
            <Flame size={14} />
          </div>
          <h2 className="text-xs font-bold text-fydly-500 uppercase tracking-[2px]">Score de fidélité Fydly</h2>
        </div>
      <Card className="p-4 sm:p-6 lg:p-8 bg-white border border-fydly-100/50">
        <div className="mb-8">
          <h3 className="text-xl sm:text-2xl font-display text-fydly-900">
            Votre score de fidélité
          </h3>
          <p className="text-fydly-400 text-xs font-medium mt-1">Calculé sur 4 critères pour évaluer l'efficacité de votre programme.</p>
        </div>
        {loading ? (
          <div className="flex justify-center">
            <SkeletonLoader variant="circle" className="w-44 h-44" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-center">
            <CircularScore score={scoreData.total} color={scoreColor} />
            <div className="flex-1 space-y-5 w-full">
              <div className="space-y-4">
                {[
                  { label: 'Clients qui reviennent', value: scoreData.returnPts, max: 40 },
                  { label: 'Nouveaux clients', value: scoreData.growthPts, max: 20 },
                  { label: 'Messages envoyés', value: scoreData.notifPts, max: 20 },
                  { label: 'Récompenses utilisées', value: scoreData.rewardPts, max: 20 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-fydly-600">{item.label}</span>
                      <span className="bg-fydly-100 text-fydly-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
                        {item.value}/{item.max} pts
                      </span>
                    </div>
                    <div className="h-3 bg-fydly-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-[800ms] ease-out"
                        style={{
                          width: `${(item.value / item.max) * 100}%`,
                          backgroundColor: scoreColor,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Message de score encadré */}
              <div className="bg-gradient-to-r from-fydly-50 to-white border border-fydly-100 p-4 rounded-2xl flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">
                  {scoreData.total >= 71 ? '🏆' : scoreData.total >= 41 ? '💪' : '🚀'}
                </span>
                <p className="text-sm font-medium text-fydly-700 leading-relaxed">{scoreMsg}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  </div>
  )
}
