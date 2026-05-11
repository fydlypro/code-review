import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, LoyaltyCard, Merchant, Reward } from '../../lib/supabase'
import { isPushEnabled, requestNotificationPermission, registerOneSignalPlayer } from '../../lib/onesignal'
import { Sparkles, Scan, Bell, X, Loader2, Zap, Star, QrCode } from 'lucide-react'

const NOTIF_PROMPT_KEY = 'fydly_notif_prompt_dismissed'

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

  useEffect(() => {
    if (!customer?.id) return
    if (localStorage.getItem(NOTIF_PROMPT_KEY)) return
    if (isIOSSafariWithoutPWA()) return
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
        setSearchParams(prev => { prev.delete('new_stamp'); return prev }, { replace: true })

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

  const loadDataRef = useRef(loadData)
  useEffect(() => { loadDataRef.current = loadData }, [loadData])

  useEffect(() => {
    if (!customer?.id) return

    // Wrapped in try-catch: WebSocket can fail on Safari iOS ("the operation is insecure")
    let sub: ReturnType<typeof supabase.channel> | null = null
    try {
      sub = supabase.channel('customer_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_cards', filter: `customer_id=eq.${customer.id}` }, () => loadDataRef.current())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards', filter: `customer_id=eq.${customer.id}` }, () => loadDataRef.current())
        .subscribe()
    } catch (err) {
      console.warn('[Realtime] WebSocket non disponible:', err)
    }

    return () => {
      if (sub) {
        try { supabase.removeChannel(sub) } catch {}
      }
    }
  }, [customer?.id])

  const triggerConfetti = async () => {
    const { default: confetti } = await import('canvas-confetti')
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    confettiIntervalRef.current = setInterval(function () {
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

  // Loading state
  if (loading) {
    return (
      <div style={{ background: 'var(--surface, #f8fafc)', minHeight: '100vh', padding: '20px 18px 100px', position: 'relative' }}>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-200 rounded-full" />
              <div className="h-7 w-36 bg-slate-200 rounded-full" />
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-[12px]" />
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(i => <div key={i} className="h-11 w-28 bg-slate-200 rounded-[14px]" />)}
          </div>
          <div className="h-72 bg-slate-200 rounded-[24px] mt-4" />
        </div>
      </div>
    )
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div style={{ background: 'var(--surface, #f8fafc)', minHeight: '100vh', padding: '20px 18px 100px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Sparkles style={{ color: '#2563EB', width: 48, height: 48 }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', letterSpacing: '-0.5px', marginBottom: 12, color: '#0f172a' }}>
          Prêts pour vos premiers tampons ?
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, maxWidth: 280, lineHeight: 1.6 }}>
          Scannez le QR code chez votre commerçant.
        </p>
        <button
          onClick={() => navigate('/scan')}
          className="animate-pulse-glow"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff',
            borderRadius: 12, padding: '0 28px', height: 52, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(37,99,235,0.35)'
          }}
        >
          <Scan size={20} />
          Scanner maintenant
        </button>
      </div>
    )
  }

  const activeCard = cards[activeCardIndex]
  const merchantReward = rewards.find(r => r.merchant_id === activeCard.merchant_id)
  const earned = activeCard.balance
  const total = activeCard.merchants.reward_threshold
  const progressPct = Math.min((earned / total) * 100, 100)
  const remaining = Math.max(total - earned, 0)
  const initials = customer?.first_name?.[0]?.toUpperCase() || 'C'

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 18px 100px', position: 'relative', overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}>Bonjour,</p>
          <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            {customer?.first_name || 'Ami'} <span>👋</span>
          </p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: '#2563EB', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16
        }}>
          {initials}
        </div>
      </div>

      {/* NOTIFICATION BANNER */}
      {showNotifBanner && (
        <div style={{
          background: '#0f172a', color: '#fff', borderRadius: 16, padding: '12px 14px',
          marginTop: 16, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
          }}>
            {notifLoading
              ? <Loader2 size={16} style={{ color: '#fff' }} className="animate-spin" />
              : <Bell size={16} style={{ color: '#fff' }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>Activez les notifications</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              {notifLoading ? "Demande en cours…" : "Recevez vos récompenses en temps réel"}
            </p>
          </div>
          <button
            onClick={handleEnableNotifs}
            disabled={notifLoading}
            style={{
              borderRadius: 100, background: '#2563EB', color: '#fff', fontSize: 11, fontWeight: 700,
              padding: '6px 12px', border: 'none', cursor: 'pointer', flexShrink: 0
            }}
          >
            {notifLoading ? "…" : "Activer"}
          </button>
          {!notifLoading && (
            <button onClick={dismissNotifBanner} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* ONGLETS COMMERÇANTS */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 16, paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
        {cards.map((card, idx) => {
          const hasReward = rewards.some(r => r.merchant_id === card.merchant_id)
          const isActive = idx === activeCardIndex
          return (
            <button
              key={card.id}
              onClick={() => setActiveCardIndex(idx)}
              style={{
                height: 44, borderRadius: 14, padding: '0 14px', fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap', border: '2px solid', cursor: 'pointer', flexShrink: 0,
                scrollSnapAlign: 'start', transition: 'all 0.2s',
                background: isActive ? '#0f172a' : '#fff',
                color: isActive ? '#fff' : '#334155',
                borderColor: isActive ? '#0f172a' : '#e2e8f0',
                boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.12)' : 'none'
              }}
            >
              {hasReward ? '🎁 ' : ''}{card.merchants.name}
            </button>
          )
        })}
        <button
          onClick={() => navigate('/scan')}
          className="animate-pulse-glow"
          style={{
            height: 44, borderRadius: 14, padding: '0 14px', fontSize: 12, fontWeight: 700,
            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
          }}
        >
          <Scan size={14} />
          Scanner
        </button>
      </div>

      {/* NEW STAMP BANNER */}
      {newStampParam === 'true' && (
        <div
          className="animate-bounce-stamp"
          style={{
            marginTop: 12, padding: 16, borderRadius: 16, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 12
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          <span style={{ fontSize: 28, position: 'relative' }}>🎉</span>
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>➕1 Tampon !</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Bien joué, continuez !</p>
          </div>
        </div>
      )}

      {/* LOYALTY CARD */}
      <div style={{
        marginTop: 16, padding: 22, borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden',
        background: 'linear-gradient(180deg, #ffffff 0%, rgba(239,246,255,0.4) 100%)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              CARTE FIDÉLITÉ
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#0f172a', marginTop: 4, lineHeight: 1.2 }}>
              {activeCard.merchants.name}
            </p>
            {activeCard.merchants.sector && (
              <span style={{
                display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600, color: '#64748b',
                background: '#f1f5f9', borderRadius: 100, padding: '3px 10px'
              }}>
                {activeCard.merchants.sector}
              </span>
            )}
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: '#2563EB', color: '#fff', flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 }}>{earned}</span>
            <span style={{ fontSize: 9, opacity: 0.7, lineHeight: 1, marginTop: 2 }}>/{total}</span>
          </div>
        </div>

        {/* Grille tampons */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {Array.from({ length: total }).map((_, i) => {
            const obtained = i < earned
            const isLastObtained = obtained && i === earned - 1 && newStampParam === 'true'
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...(obtained
                    ? {
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                      outline: isLastObtained ? '3px solid rgba(37,99,235,0.3)' : 'none',
                      outlineOffset: isLastObtained ? 2 : 0
                    }
                    : {
                      background: '#fff',
                      border: '2px dashed #e2e8f0'
                    }
                  )
                }}
              >
                {obtained && <Zap size={20} style={{ color: '#fff', fill: '#fff' }} />}
              </div>
            )
          })}
        </div>

        {/* Barre de progression */}
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
            <div
              className={progressPct >= 80 ? 'animate-shimmer' : ''}
              style={{
                height: '100%', width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #60A5FA, #2563EB)',
                borderRadius: 100, transition: 'width 0.5s ease'
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            {remaining === 0
              ? 'Récompense disponible !'
              : `Plus que ${remaining} tampon${remaining > 1 ? 's' : ''} pour votre récompense !`}
          </p>
        </div>

        {/* Bandeau récompense */}
        {activeCard.merchants.reward_description && (
          <div style={{
            marginTop: 12, padding: 12, background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Star size={16} style={{ color: '#2563EB', fill: '#2563EB', flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
              Récompense : {activeCard.merchants.reward_description}
            </p>
          </div>
        )}
      </div>

      {/* BOUTON RÉCOMPENSE */}
      {merchantReward && !showReward && (
        <button
          onClick={() => setShowReward(merchantReward)}
          className="animate-pulse-glow"
          style={{
            width: '100%', marginTop: 12, padding: 20, borderRadius: 16, border: 'none', cursor: 'pointer',
            background: '#0f172a', color: '#fff', position: 'relative', overflow: 'hidden', textAlign: 'left'
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at 80% 50%, rgba(124,58,237,0.3) 0%, transparent 60%), radial-gradient(circle at 20% 50%, rgba(37,99,235,0.2) 0%, transparent 60%)'
          }} />
          <p style={{ fontSize: 15, fontWeight: 700, position: 'relative' }}>🎁 Votre récompense est prête !</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, position: 'relative' }}>
            Appuyez pour afficher votre cadeau
          </p>
        </button>
      )}

      {/* LIEN HISTORIQUE */}
      <button
        onClick={() => navigate('/customer/history')}
        style={{
          display: 'block', width: '100%', textAlign: 'center', marginTop: 20,
          color: '#2563EB', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 8
        }}
      >
        Voir mes visites →
      </button>

      {/* REWARD OVERLAY */}
      {showReward && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
            padding: 28, textAlign: 'center', maxWidth: 340, width: '100%'
          }}>
            {/* Cercle doré */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
              boxShadow: '0 8px 24px rgba(251,191,36,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44
            }}>
              🎁
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Félicitations ! 🎉</h2>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2563EB', marginBottom: 16 }}>
              {activeCard.merchants.reward_description || 'Votre récompense'}
            </p>

            {/* QR Code zone */}
            <div style={{
              width: 160, height: 160, margin: '0 auto 12px', border: '2px solid #e2e8f0',
              borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#cbd5e1'
            }}>
              <QrCode size={80} style={{ color: '#0f172a' }} />
            </div>
            <p style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 12 }}>
              Montrez ce QR Code au commerçant
            </p>

            {/* Expiration */}
            {showReward.expires_at && (
              <span style={{
                display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#92400e',
                background: '#FEF3C7', borderRadius: 100, padding: '4px 12px', marginBottom: 16
              }}>
                ⏱ Expire le {new Date(showReward.expires_at).toLocaleDateString('fr-FR')}
              </span>
            )}

            <button
              onClick={() => setShowReward(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                marginTop: 4
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
