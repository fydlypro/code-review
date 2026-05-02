import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Store, Users, TrendingUp, Calendar,
  CreditCard, Clock, CheckCircle, XCircle, RotateCcw,
} from 'lucide-react'
import { supabase, Merchant } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import Modal from '../../components/ui/Modal'

type MerchantStats = {
  nbClients: number
  nbTransactionsTotal: number
  nbTransactionsThisMonth: number
  nbRewards: number
}

type RecentClient = {
  customer_id: string
  first_name: string
  email: string
  balance: number
  last_scan_at: string | null
}

export default function AdminMerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [stats, setStats] = useState<MerchantStats>({ nbClients: 0, nbTransactionsTotal: 0, nbTransactionsThisMonth: 0, nbRewards: 0 })
  const [recentClients, setRecentClients] = useState<RecentClient[]>([])

  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: '', description: '', onConfirm: () => {} })

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([fetchMerchant(), fetchStats(), fetchRecentClients()])
    setLoading(false)
  }

  const fetchMerchant = async () => {
    const { data } = await supabase.from('merchants').select('*').eq('id', id).single()
    setMerchant(data)
  }

  const fetchStats = async () => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [cardsRes, txAllRes, txMonthRes, rewardsRes] = await Promise.all([
      supabase.from('loyalty_cards').select('id', { count: 'exact', head: true }).eq('merchant_id', id),
      supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('merchant_id', id),
      supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('merchant_id', id).gte('created_at', startOfMonth),
      supabase.from('rewards').select('id', { count: 'exact', head: true }).eq('merchant_id', id).eq('status', 'redeemed'),
    ])

    setStats({
      nbClients: cardsRes.count || 0,
      nbTransactionsTotal: txAllRes.count || 0,
      nbTransactionsThisMonth: txMonthRes.count || 0,
      nbRewards: rewardsRes.count || 0,
    })
  }

  const fetchRecentClients = async () => {
    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('customer_id, balance, last_scan_at, customers(first_name, email)')
      .eq('merchant_id', id)
      .order('last_scan_at', { ascending: false, nullsFirst: false })
      .limit(8)

    setRecentClients(
      (cards || []).map((c: any) => ({
        customer_id: c.customer_id,
        first_name: c.customers?.first_name || 'Inconnu',
        email: c.customers?.email || '',
        balance: c.balance,
        last_scan_at: c.last_scan_at,
      }))
    )
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  const extendTrial = async (days: number) => {
    if (!merchant) return
    setActionLoading(true)
    const current = new Date(merchant.trial_ends_at)
    const newDate = new Date(Math.max(current.getTime(), Date.now()) + days * 86400000)

    const { error } = await supabase
      .from('merchants')
      .update({
        trial_ends_at: newDate.toISOString(),
        subscription_status: 'trial',
      })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de la mise à jour.')
    } else {
      toast.success(`Trial prolongé de ${days} jours.`)
      fetchMerchant()
    }
    setActionLoading(false)
    setConfirmModal(m => ({ ...m, open: false }))
  }

  const setStatus = async (status: 'trial' | 'pro' | 'business' | 'expired' | 'cancelled') => {
    if (!merchant) return
    setActionLoading(true)
    const { error } = await supabase
      .from('merchants')
      .update({ subscription_status: status })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de la mise à jour.')
    } else {
      toast.success(`Statut mis à jour : ${status}.`)
      fetchMerchant()
    }
    setActionLoading(false)
    setConfirmModal(m => ({ ...m, open: false }))
  }

  const askConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, title, description, onConfirm })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const trialDaysLeft = (trialEndsAt: string) =>
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)

  const statusBadge = (status: string) => {
    if (status === 'pro')       return <Badge variant="success">Pro</Badge>
    if (status === 'business')  return <Badge variant="success">Business</Badge>
    if (status === 'trial')     return <Badge variant="default">Trial</Badge>
    if (status === 'cancelled') return <Badge variant="warning">Annulé</Badge>
    return <Badge variant="warning">Expiré</Badge>
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="rect" className="h-8 w-48 rounded-xl" />
        <SkeletonLoader variant="rect" className="h-40 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonLoader key={i} variant="rect" className="h-24 rounded-3xl" />)}
        </div>
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="text-center py-24">
        <p className="text-fydly-400 font-medium">Commerçant introuvable.</p>
        <Button variant="secondary" onClick={() => navigate('/admin/merchants')} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  const daysLeft = trialDaysLeft(merchant.trial_ends_at)

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/merchants')}
        className="flex items-center gap-2 text-sm font-bold text-fydly-400 hover:text-fydly-900 transition-colors"
      >
        <ArrowLeft size={16} /> Retour aux commerçants
      </button>

      {/* Identity card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-fydly-50 rounded-2xl flex items-center justify-center text-fydly-500 border border-fydly-100">
              {merchant.logo_url
                ? <img src={merchant.logo_url} alt={merchant.name} className="w-full h-full object-cover rounded-2xl" />
                : <Store size={26} />
              }
            </div>
            <div>
              <h1 className="text-2xl font-display text-fydly-900">{merchant.name}</h1>
              <p className="text-fydly-500 font-medium text-sm capitalize">{merchant.sector || 'Secteur non renseigné'}</p>
              <p className="text-fydly-300 text-xs mt-0.5">
                Inscrit le {new Date(merchant.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(merchant.subscription_status)}
            {merchant.subscription_status === 'trial' && (
              <span className={`text-sm font-bold ${daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-fydly-400'}`}>
                {daysLeft > 0 ? `J-${daysLeft}` : 'Trial expiré'}
              </span>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-fydly-50">
          <div>
            <p className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest mb-1">Programme</p>
            <p className="text-sm font-bold text-fydly-900 capitalize">{merchant.program_type}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest mb-1">Seuil récompense</p>
            <p className="text-sm font-bold text-fydly-900">{merchant.reward_threshold} tampons</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest mb-1">Trial expire le</p>
            <p className="text-sm font-bold text-fydly-900">
              {new Date(merchant.trial_ends_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest mb-1">Stripe</p>
            {merchant.stripe_subscription_id ? (
              <p className="text-xs font-mono text-fydly-500 bg-fydly-50 px-2 py-0.5 rounded-lg inline-block truncate max-w-full">
                {merchant.stripe_subscription_id}
              </p>
            ) : (
              <p className="text-sm text-fydly-200">Non abonné</p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />,       label: 'Clients',           value: stats.nbClients },
          { icon: <TrendingUp size={18} />,   label: 'Tx. totales',       value: stats.nbTransactionsTotal },
          { icon: <Calendar size={18} />,     label: 'Tx. ce mois',       value: stats.nbTransactionsThisMonth },
          { icon: <CreditCard size={18} />,   label: 'Récompenses util.', value: stats.nbRewards },
        ].map(({ icon, label, value }) => (
          <Card key={label} className="p-5 flex flex-col gap-2">
            <div className="w-9 h-9 bg-fydly-50 rounded-xl flex items-center justify-center text-fydly-500">
              {icon}
            </div>
            <p className="text-2xl font-display text-fydly-900">{value}</p>
            <p className="text-xs font-bold text-fydly-400 uppercase tracking-wider">{label}</p>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card className="p-6 space-y-5">
        <h2 className="text-lg font-display text-fydly-900">Actions admin</h2>

        {/* Extend trial */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-fydly-400 uppercase tracking-widest">Prolonger le trial</p>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 30].map(days => (
              <Button
                key={days}
                variant="secondary"
                isLoading={actionLoading}
                onClick={() => askConfirm(
                  `Prolonger le trial de ${days} jours`,
                  `La date de fin de trial sera décalée de ${days} jours à partir d'aujourd'hui.`,
                  () => extendTrial(days)
                )}
              >
                <Clock size={15} className="mr-1.5" />
                +{days} jours
              </Button>
            ))}
          </div>
        </div>

        {/* Change status */}
        <div className="space-y-2 pt-4 border-t border-fydly-50">
          <p className="text-xs font-bold text-fydly-400 uppercase tracking-widest">Forcer le statut</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              isLoading={actionLoading}
              disabled={merchant.subscription_status === 'pro'}
              onClick={() => askConfirm(
                'Passer en Pro',
                'L\'abonnement sera marqué comme Pro sans paiement Stripe.',
                () => setStatus('pro')
              )}
            >
              <CheckCircle size={15} className="mr-1.5 text-green-500" />
              Activer Pro
            </Button>
            <Button
              variant="secondary"
              isLoading={actionLoading}
              disabled={merchant.subscription_status === 'business'}
              onClick={() => askConfirm(
                'Passer en Business',
                'L\'abonnement sera marqué comme Business sans paiement Stripe.',
                () => setStatus('business')
              )}
            >
              <CheckCircle size={15} className="mr-1.5 text-blue-600" />
              Activer Business
            </Button>
            <Button
              variant="secondary"
              isLoading={actionLoading}
              disabled={merchant.subscription_status === 'trial'}
              onClick={() => askConfirm(
                'Repasser en Trial',
                'L\'abonnement repassera en mode trial avec la date actuelle.',
                () => setStatus('trial')
              )}
            >
              <RotateCcw size={15} className="mr-1.5 text-blue-500" />
              Remettre en trial
            </Button>
            <Button
              variant="secondary"
              isLoading={actionLoading}
              disabled={merchant.subscription_status === 'expired'}
              className="hover:border-red-200 hover:text-red-600 hover:bg-red-50"
              onClick={() => askConfirm(
                'Expirer l\'abonnement',
                'L\'accès du commerçant sera bloqué. Cette action est réversible.',
                () => setStatus('expired')
              )}
            >
              <XCircle size={15} className="mr-1.5 text-red-400" />
              Expirer
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent clients */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-fydly-50">
          <h2 className="text-lg font-display text-fydly-900">Clients récents</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-fydly-50/50 text-fydly-400 text-[11px] font-bold uppercase tracking-widest border-b border-fydly-50">
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3 text-right">Tampons</th>
              <th className="px-6 py-3 text-right">Dernière visite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fydly-50">
            {recentClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-fydly-400 font-medium text-sm">
                  Aucun client pour ce commerçant.
                </td>
              </tr>
            ) : (
              recentClients.map(c => (
                <tr key={c.customer_id} className="hover:bg-fydly-50/20 transition-colors">
                  <td className="px-6 py-3 font-bold text-fydly-900 text-sm">{c.first_name}</td>
                  <td className="px-6 py-3 text-sm text-fydly-400">{c.email}</td>
                  <td className="px-6 py-3 text-right font-bold text-fydly-900">{c.balance}</td>
                  <td className="px-6 py-3 text-right text-sm text-fydly-400">
                    {c.last_scan_at
                      ? new Date(c.last_scan_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : 'Jamais'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        title={confirmModal.title}
      >
        <div className="p-6 space-y-6">
          <p className="text-fydly-600 font-medium">{confirmModal.description}</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              isLoading={actionLoading}
              onClick={confirmModal.onConfirm}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
