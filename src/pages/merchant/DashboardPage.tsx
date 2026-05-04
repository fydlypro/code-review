import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Ticket, Gift, AlertTriangle, Scan
} from 'lucide-react'
import { supabase, QrToken, Reward } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { sendPushNotification } from '../../lib/onesignal'
import { notifyRewardValidated } from '../../lib/notifications'

// UI Components
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

// Business Components
import KpiCard from '../../components/merchant/KpiCard'
import RecentScans from '../../components/merchant/RecentScans'
import QrDisplay from '../../components/merchant/QrDisplay'
import NotificationComposer from '../../components/merchant/NotificationComposer'

export default function MerchantDashboard() {
  const { merchant } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [activeToken, setActiveToken] = useState<QrToken | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    stampsThisMonth: 0,
    rewardsThisMonth: 0,
    inactiveCustomers: 0,
  })

  // Realtime lists
  const [recentScans, setRecentScans] = useState<any[]>([])

  // Scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)
  // Ref miroir de scanning pour éviter la closure périmée dans stopScanner
  // (stopScanner lit scanning via closure, mais setState est async)
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
    // Date locale (pas UTC) — sinon le token du "jour" est décalé de ±2h en France
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
      // crypto.randomUUID() est cryptographiquement sûr — Math.random() est prévisible
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
        // Conflit possible si deux onglets ont inséré en même temps (race condition).
        // On re-fetche le token créé par l'autre onglet plutôt que de rester à null.
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
    endOfDay.setHours(23, 59, 59, 999) // heure locale — setUTCHours décalait de ±2h en France
    const diff = endOfDay.getTime() - now.getTime()
    
    if (diff <= 0) {
      setTimeLeft('0 min')
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    setTimeLeft(hours > 0 ? `${hours}h ${mins}m` : `${mins} min`)
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
    // Utilise scanningRef (pas le state React) pour éviter la closure périmée :
    // setState est asynchrone, donc `scanning` peut encore être false quand
    // stopScanner est appelé juste après startScanner.
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
    // Le QR de récompense encode directement le token UUID (reward_qr_token)
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
      // Étape 1 : marquer la récompense comme utilisée
      const { error: rErr } = await supabase
        .from('rewards')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq('id', pendingReward.id)

      if (rErr) throw rErr

      // Étape 2 : décrémente le solde de la carte fidélité
      const { error: cardErr } = await supabase.rpc('decrement_card_balance', {
        p_card_id: pendingReward.card_id,
        p_amount: merchant.reward_threshold
      })

      if (cardErr) {
        // Fallback : décrémentation manuelle si le RPC n'existe pas encore
        const { data: card, error: fetchErr } = await supabase
          .from('loyalty_cards')
          .select('balance')
          .eq('id', pendingReward.card_id)
          .single()

        if (fetchErr || !card) {
          // Rollback étape 1 si on ne peut pas décrémenter
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
          // Rollback étape 1
          await supabase
            .from('rewards')
            .update({ status: 'available', redeemed_at: null })
            .eq('id', pendingReward.id)
          throw updateErr
        }
      }

      // Étape 3 : enregistrer la transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        card_id: pendingReward.card_id,
        customer_id: pendingReward.customer_id,
        merchant_id: merchant.id,
        type: 'redeem',
        amount: merchant.reward_threshold,
      })

      if (txErr) {
        // La récompense et le solde sont déjà mis à jour — on log sans bloquer l'UX
        console.error('[validateReward] Échec insertion transaction:', txErr)
      }

      // Notification push au client (non bloquant)
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
      // Si l'Edge Function échoue (OneSignal non configuré), on insère quand même en DB avec le statut réel
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

  if (loading && !kpis.totalCustomers) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} variant="rect" className="h-28 sm:h-32 rounded-3xl" />)}
        </div>
        <SkeletonLoader variant="card" className="h-[300px] sm:h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 lg:pb-10">
      {/* ─── QUICK ACTIONS (TOP SECTION) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
        <div className="lg:col-span-2 order-2 lg:order-1">
          {activeToken ? (
            <QrDisplay
              url={generateClientUrl()}
              onRefresh={fetchActiveToken}
              expiresInMinutes={timeLeft.includes('h') ? 60 : parseInt(timeLeft) || 15}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-white rounded-3xl border border-fydly-100 min-h-[300px]">
              <div className="w-10 h-10 border-4 border-fydly-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-fydly-400 font-medium text-sm">Génération du QR Code…</p>
            </div>
          )}
        </div>
        <div className="order-1 lg:order-2">
          <div className="h-full min-h-[160px] sm:min-h-[200px] bg-fydly-500 rounded-[32px] p-5 sm:p-8 text-white shadow-xl shadow-fydly-500/20 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:text-center gap-4 group cursor-pointer hover:bg-fydly-600 transition-all active:scale-95 active:shadow-inner" onClick={startScanner}>
            <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-3xl flex items-center justify-center sm:mb-4 backdrop-blur-md group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Scan size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-display font-bold sm:mb-2">🎁 Valider une récompense</h2>
                <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed hidden sm:block max-w-[200px]">
                  Scannez le QR Code de votre client pour valider son cadeau.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:hidden">
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Scanner</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DASHBOARD CONTENT ─── */}
      <div className="border-t border-fydly-100 pt-5 sm:pt-8 mt-2 sm:mt-4">
        <h1 className="text-xl sm:text-3xl font-display text-fydly-900 leading-tight">
          Statistiques & Activité
        </h1>
        <p className="text-fydly-600 font-medium text-sm sm:text-base mt-0.5">
          Bonjour <span className="font-bold">{merchant?.name}</span>, voici les performances.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 sm:gap-8">
        <div className="lg:col-span-2 space-y-5 sm:space-y-8">
          {/* Metrics — 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard label="👥 Clients fidèles" value={kpis.totalCustomers} icon={<Users />} onClick={() => navigate('/merchant/customers')} />
            <KpiCard label="🟡 Tampons ce mois" value={kpis.stampsThisMonth} icon={<Ticket />} />
            <KpiCard label="🎁 Récompenses" value={kpis.rewardsThisMonth} icon={<Gift />} onClick={() => navigate('/merchant/customers?filter=reward')} />
            <KpiCard
              label="⚠️ À relancer"
              value={kpis.inactiveCustomers}
              icon={<AlertTriangle />}
              className={kpis.inactiveCustomers > 5 ? 'border-warning-DEFAULT/20' : ''}
              onClick={() => navigate('/merchant/customers?filter=inactive')}
            />
          </div>

          {/* Activity */}
          <RecentScans 
            scans={recentScans.map(s => ({
              id: s.id,
              customerName: s.customers?.first_name || s.customers?.email || 'Client',
              newBalance: s.type === 'earn' ? (s.amount || 1) : 0,
              threshold: merchant?.reward_threshold || 10,
              timeStr: new Date(s.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              isReward: s.type === 'redeem'
            }))} 
          />
        </div>

        {/* Sidebar Actions/Info */}
        <div className="space-y-5 sm:space-y-8">
          {/* Marketing */}
          <NotificationComposer 
            onSend={handleSendNotification}
            activeClientsCount={kpis.totalCustomers - kpis.inactiveCustomers}
            inactiveClientsCount={kpis.inactiveCustomers}
          />
          
          <div className="bg-fydly-900 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xl sm:text-2xl font-display mb-3 sm:mb-4 leading-tight">Booster mes ventes</h3>
              <p className="text-white/70 text-sm mb-5 sm:mb-6 leading-relaxed">
                Configurez des relances automatiques pour vos clients inactifs.
              </p>
              <Button variant="secondary" className="mt-auto bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate('/merchant/notifications')}>
                Gérer les campagnes
              </Button>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-fydly-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showScanner} onClose={stopScanner} title="Scanner un cadeau">
        <div className="p-4 space-y-6">
          <div id="reader" className="rounded-[28px] overflow-hidden bg-black min-h-[300px] relative border-4 border-fydly-100 shadow-inner">
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-fydly-900/50 backdrop-blur-sm">
                <span className="spinner border-fydly-500 w-10 h-10" />
              </div>
            )}
          </div>
          <p className="text-center text-fydly-600 font-medium px-4">
            Pointez la caméra vers le QR Code affiché sur le téléphone de votre client.
          </p>
        </div>
      </Modal>

      <Modal isOpen={!!pendingReward} onClose={() => setPendingReward(null)} title="Valider le cadeau">
        <div className="p-8 text-center space-y-8">
          <div className="w-20 h-20 bg-fydly-50 text-fydly-500 rounded-3xl mx-auto flex items-center justify-center shadow-sm border border-fydly-100/50">
            <Gift size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-display text-fydly-900">Confirmation</h3>
            <p className="text-fydly-500 text-lg">
              Voulez-vous valider le cadeau pour <strong className="text-fydly-900 font-bold underline decoration-fydly-200 underline-offset-4">{pendingReward?.customers?.first_name}</strong> ?
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => setPendingReward(null)} disabled={isValidatingReward}>
              Annuler
            </Button>
            <Button className="flex-1 text-lg shadow-lg shadow-fydly-500/20" onClick={validateReward} isLoading={isValidatingReward}>
              Oui, valider
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
