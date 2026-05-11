import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Gift, Bell, Calendar, Mail, Hash, ShieldCheck, Clock, MessageSquare, Minus } from 'lucide-react'
import { supabase, Customer, LoyaltyCard, Transaction, Reward } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { notifyRewardValidated } from '../../lib/notifications'

import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type CustomerDetailState = {
  customer: Customer | null
  card: LoyaltyCard | null
  transactions: Transaction[]
  rewards: Reward[]
  availableReward: Reward | null
}

const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
]
function avatarColor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { merchant } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CustomerDetailState>({
    customer: null, card: null, transactions: [], rewards: [], availableReward: null
  })
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [validatingReward, setValidatingReward] = useState(false)

  useEffect(() => {
    if (merchant?.id && id) loadCustomerData()
  }, [merchant?.id, id])

  const loadCustomerData = async () => {
    if (!merchant?.id || !id) return
    try {
      const { data, error } = await supabase.rpc('get_customer_detail', {
        p_customer_id: id,
        p_merchant_id: merchant.id,
      })
      if (error) throw error
      if (!data?.customer) { toast.error('Client introuvable'); navigate('/merchant/customers'); return }
      if (!data?.card) { toast.error("Ce client n'a pas de carte chez vous"); navigate('/merchant/customers'); return }
      const rewards: Reward[] = data.rewards || []
      setData({
        customer: data.customer as Customer,
        card: data.card as LoyaltyCard,
        transactions: (data.transactions || []) as Transaction[],
        rewards,
        availableReward: rewards.find((r) => r.status === 'available') || null,
      })
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateReward = async () => {
    if (!data.availableReward || !merchant || !data.card) return
    setValidatingReward(true)
    try {
      const { error: rErr } = await supabase
        .from('rewards')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq('id', data.availableReward.id)
      if (rErr) throw rErr

      const { data: decremented, error: cErr } = await supabase.rpc('decrement_loyalty_balance', {
        p_card_id: data.card.id,
        p_amount: merchant.reward_threshold,
        p_merchant_id: merchant.id,
      })
      if (cErr || !decremented) {
        await supabase.from('rewards').update({ status: 'available', redeemed_at: null }).eq('id', data.availableReward.id)
        if (cErr) throw cErr
        throw new Error('Solde insuffisant ou modifié entre-temps — réessayez.')
      }

      const { error: tErr } = await supabase.from('transactions').insert({
        card_id: data.card.id,
        customer_id: data.customer!.id,
        merchant_id: merchant.id,
        type: 'redeem',
        amount: merchant.reward_threshold,
      })
      if (tErr) console.error('[handleValidateReward] Échec insertion transaction:', tErr)

      notifyRewardValidated(data.customer!.id, merchant.reward_description || 'votre récompense')
      toast.success('Récompense validée avec succès !')
      loadCustomerData()
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la validation')
    } finally {
      setValidatingReward(false)
    }
  }

  const sendPersonalNotification = async () => {
    if (!notifMessage.trim() || !merchant?.id || !data.customer?.id) return
    setSendingNotif(true)
    try {
      const { error: pushError } = await supabase.functions.invoke('send-individual-push', {
        body: { customer_id: data.customer.id, message: notifMessage.trim(), type: 'personal_message' },
      })
      const { error: dbError } = await supabase.from('notifications').insert({
        merchant_id: merchant.id,
        message: notifMessage.trim(),
        segment: 'all',
        recipients_count: 1,
        status: pushError ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
      })
      if (dbError) throw dbError
      if (pushError) toast.error("Notification non reçue — le client n'a peut-être pas activé les push.")
      else toast.success('Message envoyé à ' + data.customer.first_name)
      setShowNotifModal(false)
      setNotifMessage('')
    } catch {
      toast.error("Erreur lors de l'envoi")
    } finally {
      setSendingNotif(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <SkeletonLoader variant="rect" className="w-64 h-12 rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-8">
          <SkeletonLoader variant="card" className="h-96" />
          <SkeletonLoader variant="card" className="md:col-span-2 h-[600px]" />
        </div>
      </div>
    )
  }

  if (!data.customer || !data.card) return null

  const { customer, card, transactions, availableReward } = data
  const threshold = merchant?.reward_threshold || 10
  const progressPct = Math.min((card.balance / threshold) * 100, 100)
  const isActive = card.balance > 0 || (transactions.length > 0)

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-20 lg:pb-12 animate-fade-in">

      {/* ── BACK + TITLE ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/merchant/customers')}
          className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group shrink-0"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-slate-900 leading-tight">Détail client</h1>
          <p className="text-slate-400 text-sm font-medium">
            Membre depuis {new Date(customer.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 items-start">

        {/* ── LEFT: PROFIL + ACTIONS ── */}
        <div className="space-y-6">

          {/* Card Profil */}
          <div className="bg-white shadow-card p-6" style={{ borderRadius: 20 }}>
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-display font-bold shrink-0 ${avatarColor(customer.first_name ?? '')}`}>
                {customer.first_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 text-lg truncate">{customer.first_name || 'Client anonyme'}</h2>
                <p className="text-sm text-slate-500 truncate">{customer.email}</p>
                <div className="mt-1.5">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Inactif
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats inline */}
            <div className="flex items-center justify-between text-center mb-6 pb-5 border-b border-slate-100">
              <div>
                <div className="text-2xl font-display text-slate-900">{card.total_earned}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">tampons gagnés</div>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div>
                <div className="text-2xl font-display text-slate-900">{data.rewards.filter(r => r.status === 'redeemed').length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">récompenses reçues</div>
              </div>
            </div>

            {/* Infos */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Hash size={14} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID</div>
                  <div className="font-mono font-bold text-slate-700 text-xs">#{customer.id.split('-')[0].toUpperCase()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Mail size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
                  <div className="font-medium text-slate-700 text-xs break-all">{customer.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Calendar size={14} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inscription</div>
                  <div className="font-medium text-slate-700 text-xs">{new Date(customer.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
            </div>

            {/* Progression */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progression</span>
                <span className="font-mono font-bold text-slate-700 text-sm">{card.balance}/{threshold}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
                />
              </div>
            </div>
          </div>

          {/* Card Récompense disponible */}
          {availableReward && (
            <div className="bg-white shadow-card p-6 border-2 border-emerald-100" style={{ borderRadius: 20 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Gift size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Récompense prête !</h3>
                  <p className="text-xs text-emerald-600 font-semibold">
                    Depuis le {new Date(availableReward.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleValidateReward}
                disabled={validatingReward}
                className="w-full h-12 text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 border-none text-white shadow-sm"
              >
                {validatingReward ? <span className="spinner" /> : 'Consommer la récompense'}
              </Button>
            </div>
          )}

          {/* Card Actions sombres */}
          <div className="bg-slate-900 p-6 relative overflow-hidden" style={{ borderRadius: 20 }}>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
            <h3 className="font-bold text-white text-sm mb-4 relative z-10">Actions rapides</h3>
            <div className="space-y-2 relative z-10">
              <button
                onClick={() => setShowNotifModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all border border-white/10"
              >
                <MessageSquare size={16} className="shrink-0 text-blue-300" />
                Envoyer un message
              </button>
              <button
                onClick={handleValidateReward}
                disabled={!availableReward || validatingReward}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Gift size={16} className="shrink-0 text-emerald-300" />
                Offrir une récompense
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white/40 text-sm font-medium border border-white/5 cursor-not-allowed"
                disabled
              >
                <Minus size={16} className="shrink-0" />
                Invalider un tampon
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: HISTORIQUE ── */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-card p-6 sm:p-8" style={{ borderRadius: 20 }}>
            <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-100">
              <Clock size={20} className="text-fydly-500" />
              <h2 className="text-xl font-display text-slate-900">Historique des activités</h2>
            </div>

            {transactions.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock size={28} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Aucun passage enregistré pour ce client.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100" />

                {transactions.map((tx) => (
                  <div key={tx.id} className="relative pl-14 pb-8 last:pb-0 group">
                    {/* Dot */}
                    <div className={`absolute left-0 w-11 h-11 rounded-2xl flex items-center justify-center z-10 border-4 border-white shadow-sm transition-transform group-hover:scale-105 ${
                      tx.type === 'earn' ? 'bg-blue-50 text-fydly-500' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {tx.type === 'earn' ? <ShieldCheck size={16} /> : <Gift size={16} />}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 group-hover:border-slate-200 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {tx.type === 'earn' ? 'Visite en boutique' : 'Récompense débloquée'}
                        </h4>
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          tx.type === 'earn'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {tx.type === 'earn' ? `+${tx.amount} pts` : 'Cadeau'}
                        </span>
                      </div>
                      <time className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}
                        {new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed">
                        {tx.type === 'earn'
                          ? `Passage validé en boutique. Solde actuel : ${card.balance} tampons.`
                          : `Récompense utilisée : ${merchant?.reward_description || 'Cadeau Fidélité'}.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL MESSAGE ── */}
      {showNotifModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white p-8 animate-slide-up shadow-modal" style={{ borderRadius: 28 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-fydly-500">
                <Bell size={22} />
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                ×
              </button>
            </div>
            <h3 className="font-display text-2xl text-slate-900 mb-1">Message à {customer.first_name}</h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">Envoyez une attention personnalisée.</p>
            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Ex: Revenez nous voir vite, votre prochain tampon vous attend !"
              className="w-full h-28 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-fydly-500/40 focus:bg-white transition-all resize-none font-medium text-sm"
              maxLength={140}
            />
            <div className="flex justify-between items-center mb-5 mt-1.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{notifMessage.length}/140</span>
              <div className="h-1 flex-1 mx-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(notifMessage.length / 140) * 100}%`,
                    background: notifMessage.length > 120 ? '#EF4444' : notifMessage.length > 90 ? '#F59E0B' : '#2563EB'
                  }}
                />
              </div>
            </div>
            <Button
              onClick={sendPersonalNotification}
              disabled={sendingNotif || !notifMessage.trim()}
              className="w-full h-13 rounded-2xl text-base"
              style={{ height: 52 }}
            >
              {sendingNotif ? <span className="spinner" /> : 'Envoyer maintenant'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
