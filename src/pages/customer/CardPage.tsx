import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, LoyaltyCard, Merchant, Reward } from '../../lib/supabase'
import { isPushEnabled, requestNotificationPermission, registerOneSignalPlayer } from '../../lib/onesignal'

// UI & Business Components
import StampCard from '../../components/ui/StampCard'
import RewardScreen from '../../components/customer/RewardScreen'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import Button from '../../components/ui/Button'
import { Sparkles, Scan, QrCode, Bell, X, Loader2 } from 'lucide-react'

const NOTIF_PROMPT_KEY = 'fydly_notif_prompt_dismissed'

/** iOS Safari hors mode standalone (PWA) — push impossible sans installation */
function isIOSSafariWithoutPWA(): boolean {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())
  if (!isIOS) return false
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  return !isStandalone
}

type PopulatedCard = LoyaltyCard & { merchants: Pick<Merchant, 'name' | 'reward_threshold' | 'reward_description' | 'sector'> }

export default function CardPage() {
  const { customer } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const confettiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (confettiIntervalRef.current) clearInterval(confettiIntervalRef.current)
    }
  }, [])

  const merchantParam = searchParams.get('merchant')
  const newStampParam = searchParams.get('new_stamp')

  const [cards, setCards] = useState<PopulatedCard[]>([])
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showReward, setShowReward] = useState<Reward | null>(null)
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  useEffect(() => {
    if (!customer?.id) return
    loadData()
  }, [customer?.id])

  // Prompt notifications — affiché 4s après le chargement si pas encore activées
  useEffect(() => {
    if (!customer?.id) return
    if (localStorage.getItem(NOTIF_PROMPT_KEY)) return
    // iOS Safari hors PWA : les push sont impossibles — ne pas proposer
    if (isIOSSafariWithoutPWA()) return
    // Si la permission a déjà été refusée au niveau OS, ne pas afficher la bannière
    if (typeof Notification !== "undefined" && Notification.permission === "denied") return

    const timer = setTimeout(async () => {
      const enabled = await isPushEnabled()
      if (!enabled) setShowNotifBanner(true)
    }, 4000)

    return () => clearTimeout(timer)
  }, [customer])

  const handleEnableNotifs = async () => {
    if (notifLoading) return
    setNotifLoading(true)
    try {
      const granted = await requestNotificationPermission()
      if (granted && customer?.id) {
        // Fire-and-forget — l'enregistrement APNs peut prendre 20-30s sur iOS,
        // on ne bloque pas l'UI pour autant.
        registerOneSignalPlayer(customer.id).catch(() => {})
      }
    } finally {
      setShowNotifBanner(false)
      setNotifLoading(false)
      localStorage.setItem(NOTIF_PROMPT_KEY, 'true')
    }
  }

  const dismissNotifBanner = () => {
    setShowNotifBanner(false)
    localStorage.setItem(NOTIF_PROMPT_KEY, 'true')
  }

  const loadData = useCallback(async () => {
    if (!customer?.id) return
    try {
      setLoading(true)

      const { data: cardsData, error: cardsError } = await supabase
        .rpc('get_customer_loyalty_cards')

      if (cardsError) throw cardsError
      setCards((cardsData as PopulatedCard[] || []))

      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('status', 'available')
        
      if (rewardsError) throw rewardsError
      setRewards(rewardsData || [])

      if (merchantParam && cardsData) {
        const idx = (cardsData as PopulatedCard[]).findIndex(c => c.merchant_id === merchantParam)
        if (idx !== -1) setActiveCardIndex(idx)
      } else if (cardsData && cardsData.length > 0) {
        setActiveCardIndex(0)
      }

      if (newStampParam === 'true') {
        triggerConfetti()
        // Supprimer le param via React Router (window.history.replaceState contourne
        // le state du router → newStampParam restait 'true' indéfiniment)
        setSearchParams(prev => { prev.delete('new_stamp'); return prev }, { replace: true })

        // Auto-ouvrir la récompense si elle vient d'être débloquée
        if (rewardsData && rewardsData.length > 0) {
          const freshReward = merchantParam
            ? (rewardsData as Reward[]).find(r => r.merchant_id === merchantParam)
            : (rewardsData as Reward[])[0]
          if (freshReward) setShowReward(freshReward)
        }
      }

    } catch (e) {
      // Erreur silencieuse — l'écran vide sera affiché
    } finally {
      setLoading(false)
    }
  }, [customer?.id, merchantParam, newStampParam, setSearchParams])

  // Ref toujours à jour vers la dernière version de loadData — utilisée par le
  // handler realtime pour éviter une closure périmée sans recréer l'abonnement.
  const loadDataRef = useRef(loadData)
  useEffect(() => { loadDataRef.current = loadData }, [loadData])

  useEffect(() => {
    if (!customer?.id) return

    const sub = supabase.channel('customer_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_cards', filter: `customer_id=eq.${customer.id}` }, () => loadDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards', filter: `customer_id=eq.${customer.id}` }, () => loadDataRef.current())
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [customer?.id])

  const triggerConfetti = async () => {
    const { default: confetti } = await import('canvas-confetti')
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    confettiIntervalRef.current = setInterval(function() {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(confettiIntervalRef.current!)
        confettiIntervalRef.current = null
        return
      }
      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map(i => <SkeletonLoader key={i} variant="rect" className="w-24 h-10 rounded-xl" />)}
        </div>
        <SkeletonLoader variant="card" className="h-96" />
        <SkeletonLoader variant="rect" className="h-32 rounded-3xl" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 bg-fydly-50 rounded-full flex items-center justify-center mb-8 shadow-inner border border-fydly-100">
          <Sparkles className="text-fydly-500 w-12 h-12" />
        </div>
        <h2 className="text-3xl font-display text-fydly-900 mb-3 leading-tight">
          Prêts pour vos premiers tampons ?
        </h2>
        <p className="text-fydly-600 mb-10 max-w-sm font-medium leading-relaxed">
          Scannez le QR code chez votre commerçant partenaire pour commencer à cumuler des tampons.
        </p>
        <Button onClick={() => navigate('/scan')} className="w-full max-w-[280px] h-12 shadow-lg shadow-fydly-500/20 group">
          <div className="flex items-center gap-3">
            <Scan size={20} className="group-hover:scale-110 transition-transform" />
            <span>Scanner maintenant</span>
          </div>
        </Button>
      </div>
    )
  }

  const activeCard = cards[activeCardIndex]
  const merchantReward = rewards.find(r => r.merchant_id === activeCard.merchant_id)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Banner notifications */}
      {showNotifBanner && (
        <div className="bg-fydly-900 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 bg-fydly-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-fydly-500/30">
            {notifLoading
              ? <Loader2 size={18} className="text-white animate-spin" />
              : <Bell size={18} className="text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Activez les notifications</p>
            <p className="text-white/60 text-xs mt-0.5">
              {notifLoading ? "Demande en cours…" : "Recevez vos récompenses en temps réel"}
            </p>
          </div>
          <button
            onClick={handleEnableNotifs}
            disabled={notifLoading}
            className="bg-fydly-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-wait"
          >
            {notifLoading ? "…" : "Activer"}
          </button>
          {!notifLoading && (
            <button onClick={dismissNotifBanner} className="text-white/40 shrink-0 active:scale-90 transition-transform">
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* Onglets commerçants + Scanner */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {cards.length > 1 && cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => setActiveCardIndex(idx)}
            className={`px-5 py-2.5 rounded-[12px] text-sm font-bold whitespace-nowrap transition-all duration-200 border-2 ${
              idx === activeCardIndex
                ? 'bg-fydly-900 border-fydly-900 text-white shadow-card'
                : 'bg-white border-fydly-100 text-fydly-700 hover:border-fydly-300'
            }`}
          >
            {card.merchants.name}
          </button>
        ))}
        <button
          onClick={() => navigate('/scan')}
          className="px-4 py-2.5 rounded-[12px] text-sm font-bold whitespace-nowrap transition-all duration-200 border-2 bg-fydly-500 border-fydly-500 text-white shadow-card flex items-center gap-2 active:scale-[0.98] hover:bg-fydly-600"
        >
          <QrCode size={15} />
          Scanner
        </button>
      </div>

      {/* Animation +1 Tampon */}
      {newStampParam === 'true' && (
        <div className="bg-fydly-500 rounded-[12px] px-6 py-4 flex items-center gap-4 shadow-card animate-bounce-stamp">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="text-white font-display text-xl leading-tight">+1 Tampon !</p>
            <p className="text-white/80 text-sm font-medium">Bien joué, continuez comme ça !</p>
          </div>
        </div>
      )}

      {/* Récompense disponible */}
      {merchantReward && !showReward && (
        <button
          onClick={() => setShowReward(merchantReward)}
          className="w-full bg-fydly-900 rounded-[12px] p-5 text-white flex items-center justify-between active:scale-[0.98] transition-all duration-200 group shadow-modal"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-[12px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
              🎁
            </div>
            <div className="text-left">
              <p className="font-bold text-base leading-tight">🎁 Votre récompense est prête !</p>
              <p className="text-white/60 text-sm font-medium mt-0.5">Appuyez pour afficher votre cadeau</p>
            </div>
          </div>
          <Sparkles className="text-fydly-400 w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Carte fidélité */}
      <div className={`transition-all duration-300 ${merchantReward ? 'opacity-75 scale-[0.99]' : ''}`}>
        <StampCard
          merchantName={activeCard.merchants.name}
          sector={activeCard.merchants.sector ?? undefined}
          balance={activeCard.balance}
          threshold={activeCard.merchants.reward_threshold}
          newStamp={newStampParam === 'true'}
          rewardDescription={activeCard.merchants.reward_description ?? undefined}
        />
      </div>

      {/* Lien historique */}
      <button
        onClick={() => navigate('/customer/history')}
        className="w-full text-center text-fydly-500 text-sm font-semibold hover:text-fydly-700 transition-colors py-2"
      >
        Voir mes visites →
      </button>

      {/* Écran récompense */}
      {showReward && (
        <RewardScreen
          rewardQrToken={showReward.reward_qr_token || ''}
          merchantName={activeCard.merchants.name || ''}
          rewardDescription={activeCard.merchants.reward_description || 'Votre récompense'}
          expiresAt={new Date(showReward.expires_at).toLocaleDateString()}
          onClose={() => setShowReward(null)}
        />
      )}
    </div>
  )
}
