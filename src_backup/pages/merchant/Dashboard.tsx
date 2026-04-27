import React, { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Users, Ticket, Gift, AlertTriangle, Printer,
  Maximize, Send, QrCode, Scan, X
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase, LoyaltyCard, Transaction, QrToken, Reward, Notification } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function MerchantDashboard() {
  const { session, merchant } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [activeToken, setActiveToken] = useState<QrToken | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    stampsThisMonth: 0,
    rewardsThisMonth: 0,
    inactiveCustomers: 0,
  })

  // Notifications state
  const [message, setMessage] = useState('')
  const [segment, setSegment] = useState<'all' | 'active' | 'inactive'>('all')
  const [isSendingMsg, setIsSendingMsg] = useState(false)

  // Realtime lists
  const [recentScans, setRecentScans] = useState<any[]>([])

  // Scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Reward validation
  const [pendingReward, setPendingReward] = useState<Reward | null>(null)

  useEffect(() => {
    if (!merchant?.id) return
    loadDashboardData()
    setupRealtimeSubscriptions()

    // Countdown logic
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [merchant?.id])

  const setupRealtimeSubscriptions = () => {
    if (!merchant?.id) return

    const channel = supabase.channel('merchant_realtime')
      // Écoute les nouvelles transactions
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'transactions',
        filter: `merchant_id=eq.${merchant.id}`
      }, (payload) => {
        // En vrai: faire une jointure pour avoir le nom du client
        // mais pour l'instant on recharge les récents
        fetchRecentScans()
        loadKpis() // Reload KPIs safely
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

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
    const today = new Date().toISOString().split('T')[0]
    let { data } = await supabase
      .from('qr_tokens')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('valid_date', today)
      .eq('is_active', true)
      .maybeSingle()

    if (!data) {
      // Générer pour aujourd'hui
      const token = crypto.randomUUID()
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
      
      if (!error && newData) data = newData
    }
    setActiveToken(data)
  }

  const loadKpis = async () => {
    if (!merchant?.id) return

    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Total Clients
    const { count: totalCust } = await supabase
      .from('loyalty_cards')
      .select('id', { count: 'exact' })
      .eq('merchant_id', merchant.id)

    // Stamps this month
    const { data: stampsObj } = await supabase
      .from('transactions')
      .select('amount')
      .eq('merchant_id', merchant.id)
      .eq('type', 'earn')
      .gte('created_at', firstDayOfMonth)
    
    const stampsSum = stampsObj?.reduce((acc, curr) => acc + curr.amount, 0) || 0

    // Rewards this month
    const { count: rewardsCount } = await supabase
      .from('rewards')
      .select('id', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .eq('status', 'redeemed')
      .gte('redeemed_at', firstDayOfMonth)

    // Inactive customers (> 30j)
    const { count: inactiveCount } = await supabase
      .from('loyalty_cards')
      .select('id', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .lt('last_scan_at', thirtyDaysAgo)

    setKpis({
      totalCustomers: totalCust || 0,
      stampsThisMonth: stampsSum,
      rewardsThisMonth: rewardsCount || 0,
      inactiveCustomers: inactiveCount || 0
    })
  }

  const fetchRecentScans = async () => {
    if (!merchant?.id) return
    const { data } = await supabase
      .from('transactions')
      .select('*, customers(first_name)')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    setRecentScans(data || [])
  }

  const updateCountdown = () => {
    const endOfDay = new Date()
    endOfDay.setUTCHours(23, 59, 59, 999)
    const diff = endOfDay.getTime() - new Date().getTime()
    
    if (diff <= 0) {
      setTimeLeft('00h 00m')
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    setTimeLeft(`${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`)
  }

  // Scanner Logic
  const startScanner = async () => {
    setShowScanner(true)
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('reader')
        scannerRef.current = scanner
        setScanning(true)
        
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          (err) => { /* Ignore frequent failures */ }
        )
      } catch (err) {
        console.error('Camera err:', err)
        toast.error('Impossible d\'accéder à la caméra')
        stopScanner()
      }
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current && scanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear()
        setScanning(false)
        setShowScanner(false)
      }).catch(console.error)
    } else {
      setShowScanner(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    stopScanner()
    
    // Validate token format roughly (assuming URL like fydly.app/scan?reward=TOKEN)
    // Or just UUID text
    const token = decodedText.includes('=') ? new URL(decodedText).searchParams.get('reward') : decodedText
    
    if (!token) {
      toast.error('QR code invalide')
      return
    }

    // Check with Supabase
    setLoading(true)
    const { data: reward, error } = await supabase
      .from('rewards')
      .select('*, customers(first_name)')
      .eq('reward_qr_token', token)
      .eq('merchant_id', merchant?.id)
      .single()
    
    setLoading(false)

    if (error || !reward) {
      toast.error('Récompense introuvable ou vous n\'en êtes pas l\'émetteur.')
      return
    }

    if (reward.status === 'redeemed') {
      toast.error('Cette récompense a déjà été utilisée.')
      return
    }
    if (reward.status === 'expired') {
      toast.error('Cette récompense est expirée.')
      return
    }

    setPendingReward(reward)
  }

  const validateReward = async () => {
    if (!pendingReward || !merchant) return
    setLoading(true)

    try {
      // Logic requires atomic update, but simple approach using 2 queries for now 
      // as RPCless logic might be flaky. We do transactions sequentially ideally in RPC
      const { error: rErr } = await supabase
        .from('rewards')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq('id', pendingReward.id)

      if (rErr) throw rErr

      // Insert redeem transaction
      const { error: tErr } = await supabase
        .from('transactions')
        .insert({
          card_id: pendingReward.card_id,
          customer_id: pendingReward.customer_id,
          merchant_id: merchant.id,
          type: 'redeem',
          amount: 0,
        })
      
      if (tErr) throw tErr

      // Update balance
      // Note: in a real world, calling an RPC here is much better to avoid race conditions.
      const { data: card } = await supabase.from('loyalty_cards').select('balance').eq('id', pendingReward.card_id).single()
      if (card && card.balance >= merchant.reward_threshold) {
         await supabase.from('loyalty_cards').update({ balance: card.balance - merchant.reward_threshold}).eq('id', pendingReward.card_id)
      }

      toast.success(`✅ Récompense validée pour ${pendingReward.customers?.first_name || 'le client'} !`)
      setPendingReward(null)
      loadKpis()
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la validation')
    } finally {
      setLoading(false)
    }
  }

  // Notifications
  const handleSendNotification = async () => {
    if (!message.trim() || !merchant) return
    setIsSendingMsg(true)

    try {
      // Mocked OneSignal logic 
      // Insert in history
      const { error } = await supabase.from('notifications').insert({
        merchant_id: merchant.id,
        message,
        segment,
        recipients_count: segment === 'all' ? kpis.totalCustomers : (segment === 'inactive' ? kpis.inactiveCustomers : kpis.totalCustomers - kpis.inactiveCustomers),
        status: 'sent',
        sent_at: new Date().toISOString()
      })

      if (error) throw error
      toast.success('Notification envoyée avec succès')
      setMessage('')
    } catch (e) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsSendingMsg(false)
    }
  }

  const generateClientUrl = () => {
    const origin = window.location.origin
    return `${origin}/scan?token=${activeToken?.token}&m=${merchant?.id}`
  }

  if (loading && !kpis.totalCustomers) {
    return (
      <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 space-y-6">
          <div className="card h-64 skeleton"></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-kpi skeleton h-32"></div>
            <div className="card-kpi skeleton h-32"></div>
            <div className="card-kpi skeleton h-32"></div>
            <div className="card-kpi skeleton h-32"></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card h-96 skeleton"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fydly-900">Bienvenue, {merchant?.name}</h1>
          <p className="text-fydly-600 font-medium">Voici ce qui se passe aujourd'hui.</p>
        </div>
        <button onClick={startScanner} className="btn-primary w-full sm:w-auto shadow-lg hover:scale-105 active:scale-95">
          <Scan size={20} />
          Scanner une récompense
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-kpi flex flex-col items-center justify-center text-center group">
              <Users size={28} className="text-fydly-300 mb-2 group-hover:text-fydly-500 transition-colors" />
              <div className="stat-number">{kpis.totalCustomers}</div>
              <span className="label mt-1">Clients Total</span>
            </div>
            <div className="card-kpi flex flex-col items-center justify-center text-center group">
              <Ticket size={28} className="text-fydly-300 mb-2 group-hover:text-fydly-500 transition-colors" />
              <div className="stat-number">{kpis.stampsThisMonth}</div>
              <span className="label mt-1">Tampons Mois</span>
            </div>
            <div className="card-kpi flex flex-col items-center justify-center text-center group">
              <Gift size={28} className="text-fydly-300 mb-2 group-hover:text-fydly-500 transition-colors" />
              <div className="stat-number">{kpis.rewardsThisMonth}</div>
              <span className="label mt-1">Cadeaux Mois</span>
            </div>
            <div className="card-kpi flex flex-col items-center justify-center text-center group border-2 border-transparent hover:border-orange-100 transition-colors">
              <AlertTriangle size={28} className="text-orange-300 mb-2 group-hover:text-orange-500 transition-colors" />
              <div className="stat-number text-orange-600">{kpis.inactiveCustomers}</div>
              <span className="label mt-1">Inactifs 30J</span>
            </div>
          </div>

          {/* Scans récents */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-fydly-900 border-b-2 border-fydly-100 pb-1 inline-block">Derniers passages</h2>
              <span className="text-xs text-fydly-500 bg-fydly-50 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow"></span>
                Temps réel
              </span>
            </div>
            
            <div className="overflow-x-auto">
              {recentScans.length === 0 ? (
                <div className="text-center py-8 text-fydly-500 font-medium">Aucun passage récent.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="table-header">Client</th>
                      <th className="table-header">Action</th>
                      <th className="table-header text-right">Heure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentScans.map((scan) => (
                      <tr key={scan.id} className="table-row">
                        <td className="table-cell font-bold text-fydly-900">{scan.customers?.first_name || 'Inconnu'}</td>
                        <td className="table-cell">
                          {scan.type === 'earn' ? (
                            <span className="badge-blue">🟡 +{scan.amount} Tampon{scan.amount > 1 ? 's' : ''}</span>
                          ) : (
                            <span className="badge" style={{background:'#FFF3E0', color:'#E65100'}}>🎁 Récompense validée</span>
                          )}
                        </td>
                        <td className="table-cell text-right text-fydly-500 font-mono text-xs">
                          {new Date(scan.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Notification */}
          <div className="card-section">
            <h2 className="text-lg font-bold text-fydly-900 mb-1 flex items-center gap-2">
              <Send size={18} className="text-fydly-500" />
              Campagne rapide
            </h2>
            <p className="text-sm text-fydly-600 mb-6">Envoyez une notification push à vos clients.</p>
            
            <div className="space-y-4">
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={140}
                  className="input min-h-[80px] resize-none"
                  placeholder="Ex: -20% sur les viennoiseries ce soir avant fermeture !"
                />
                <div className="flex justify-between items-center text-xs mt-1.5 font-medium">
                  <span className={message.length === 140 ? 'text-red-500' : 'text-fydly-500'}>
                    {message.length} / 140
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/2">
                  <label className="label">Destinataires</label>
                  <select 
                    value={segment} 
                    onChange={(e) => setSegment(e.target.value as any)}
                    className="input font-medium"
                  >
                    <option value="all">Tous les clients ({kpis.totalCustomers})</option>
                    <option value="active">Clients actifs ({kpis.totalCustomers - kpis.inactiveCustomers})</option>
                    <option value="inactive">Clients inactifs ({kpis.inactiveCustomers})</option>
                  </select>
                </div>
                <button
                  onClick={handleSendNotification}
                  disabled={!message.trim() || isSendingMsg}
                  className="btn-primary flex-1 h-12 w-full"
                >
                  {isSendingMsg ? <span className="spinner" /> : "📤 Envoyer la notification"}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* QR Code Card */}
          <div className="card text-center relative overflow-hidden group border-2 border-transparent hover:border-fydly-100 transition-colors">
            <h2 className="font-bold text-fydly-900 border-b border-fydly-50 pb-3 mb-6">QR Code du jour</h2>
            
            {activeToken ? (
              <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-6 relative">
                 <QRCodeSVG 
                  value={generateClientUrl()} 
                  size={200} 
                  level="H"
                  fgColor="#0D47A1"
                 />
                 {/* Logo au centre */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white w-12 h-12 flex items-center justify-center rounded-xl shadow-md border border-fydly-50">
                      <QrCode size={24} className="text-fydly-500" />
                    </div>
                 </div>
              </div>
            ) : (
              <div className="w-[200px] h-[200px] mx-auto bg-fydly-50 rounded-2xl flex items-center justify-center text-fydly-300 mb-6">
                <span className="spinner w-8 h-8" />
              </div>
            )}
            
            <div className="bg-red-50 text-red-700 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-6">
              Expise dans <span className="font-mono text-base">{timeLeft}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-fydly-50 pt-6">
              <button 
                onClick={() => window.print()} 
                className="btn-secondary h-11 text-sm text-fydly-700 hover:text-fydly-900"
              >
                <Printer size={16} /> Imprimer
              </button>
              <button 
                onClick={() => setIsFullscreen(true)}
                className="btn-secondary h-11 text-sm text-fydly-700 hover:text-fydly-900"
              >
                <Maximize size={16} /> Plein Écran
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {isFullscreen && activeToken && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 animate-fade-in">
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-8 right-8 p-3 rounded-xl bg-fydly-50 text-fydly-600 hover:bg-fydly-100 hover:text-fydly-900 transition-colors"
          >
            <X size={32} />
          </button>
          
          <div className="text-center mb-12">
            <h1 className="text-6xl font-serif text-fydly-900 mb-4">{merchant?.name}</h1>
            <p className="text-3xl text-fydly-600 font-bold">Scannez pour gagner un tampon !</p>
          </div>

          <div className="p-8 shadow-2xl rounded-3xl bg-white border border-fydly-50 mb-12">
            <QRCodeSVG 
              value={generateClientUrl()} 
              size={400} 
              level="H"
              fgColor="#0D47A1"
            />
          </div>

          <p className="text-fydly-400 font-mono font-medium">QR Token: {activeToken.token.split('-')[0]}</p>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-fydly-900 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(33,150,243,0.3)]">
            <div className="px-5 py-4 flex justify-between items-center border-b border-white/10">
              <h3 className="text-white font-bold text-lg">Scanner Récompense</h3>
              <button onClick={stopScanner} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              <div id="reader" className="rounded-xl overflow-hidden bg-black min-h-[250px] relative">
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    <span className="spinner border-fydly-500 w-8 h-8" />
                  </div>
                )}
              </div>
              <p className="text-center text-white/70 text-sm mt-4">
                Pointez la caméra vers l'écran du client
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validate Reward Modal */}
      {pendingReward && (
        <div className="fixed inset-0 z-[100] bg-fydly-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-sm animate-slide-in shadow-2xl p-8 border border-fydly-100">
            <div className="w-16 h-16 bg-blue-50 text-fydly-500 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <Gift size={32} />
            </div>
            <h3 className="text-2xl font-bold text-fydly-900 text-center mb-2">Valider la récompense ?</h3>
            <p className="text-fydly-600 text-center mb-8 text-lg font-medium">
              Client : <strong className="text-fydly-900">{pendingReward.customers?.first_name}</strong>
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setPendingReward(null)} 
                className="btn-secondary h-12 flex-1 font-bold"
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                onClick={validateReward}
                className="btn-primary h-12 flex-1 font-bold text-lg"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
