import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Users, ArrowRight, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type GlobalStats = {
  totalMerchants: number
  trialMerchants: number
  activeMerchants: number
  expiredMerchants: number
  totalCustomers: number
  totalTransactionsThisMonth: number
}

type RecentMerchant = {
  id: string
  name: string
  sector: string | null
  subscription_status: 'trial' | 'active' | 'expired'
  trial_ends_at: string
  created_at: string
  nb_clients: number
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<GlobalStats>({
    totalMerchants: 0,
    trialMerchants: 0,
    activeMerchants: 0,
    expiredMerchants: 0,
    totalCustomers: 0,
    totalTransactionsThisMonth: 0,
  })
  const [recentMerchants, setRecentMerchants] = useState<RecentMerchant[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchRecentMerchants()])
    setLoading(false)
  }

  const fetchStats = async () => {
    const [merchantsRes, customersRes, txRes] = await Promise.all([
      supabase.from('merchants').select('subscription_status'),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    const merchants = merchantsRes.data || []
    setStats({
      totalMerchants: merchants.length,
      trialMerchants: merchants.filter(m => m.subscription_status === 'trial').length,
      activeMerchants: merchants.filter(m => m.subscription_status === 'active').length,
      expiredMerchants: merchants.filter(m => m.subscription_status === 'expired').length,
      totalCustomers: customersRes.count || 0,
      totalTransactionsThisMonth: txRes.count || 0,
    })
  }

  const fetchRecentMerchants = async () => {
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, name, sector, subscription_status, trial_ends_at, created_at, loyalty_cards(count)')
      .order('created_at', { ascending: false })
      .limit(6)

    if (!merchants) return

    setRecentMerchants(
      merchants.map(m => ({
        ...m,
        nb_clients: (m.loyalty_cards as unknown as { count: number }[])[0]?.count ?? 0,
      }))
    )
  }

  const statusBadge = (status: string) => {
    if (status === 'active') return <Badge variant="success" dot>Actif</Badge>
    if (status === 'trial')  return <Badge variant="info" dot>Trial</Badge>
    return <Badge variant="warning" dot>Expiré</Badge>
  }

  const trialDaysLeft = (trialEndsAt: string) => {
    return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonLoader variant="rect" className="h-10 w-64 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonLoader key={i} variant="rect" className="h-28 rounded-3xl" />)}
        </div>
        <SkeletonLoader variant="rect" className="h-96 rounded-3xl" />
      </div>
    )
  }

  const kpis = [
    {
      icon: Store,
      color: 'bg-fydly-500/10 text-fydly-600',
      value: stats.totalMerchants,
      label: 'Total commerçants',
      accent: 'border-l-fydly-500',
    },
    {
      icon: Clock,
      color: 'bg-blue-500/10 text-blue-600',
      value: stats.trialMerchants,
      label: 'En période d\'essai',
      accent: 'border-l-blue-400',
    },
    {
      icon: CheckCircle,
      color: 'bg-emerald-500/10 text-emerald-600',
      value: stats.activeMerchants,
      label: 'Abonnés actifs',
      accent: 'border-l-emerald-500',
    },
    {
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-500',
      value: stats.expiredMerchants,
      label: 'Accès expirés',
      accent: 'border-l-red-400',
    },
    {
      icon: Users,
      color: 'bg-violet-500/10 text-violet-600',
      value: stats.totalCustomers,
      label: 'Total clients',
      accent: 'border-l-violet-500',
    },
    {
      icon: Activity,
      color: 'bg-orange-500/10 text-orange-500',
      value: stats.totalTransactionsThisMonth,
      label: 'Transactions (mois)',
      accent: 'border-l-orange-400',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-fydly-900 tracking-tight">Vue globale</h1>
          <p className="text-fydly-400 font-medium mt-1 text-sm capitalize">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-bold px-3.5 py-2 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Système opérationnel
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(({ icon: Icon, color, value, label, accent }) => (
          <Card
            key={label}
            className={`p-5 flex flex-col gap-3 border-l-[3px] ${accent} hover:shadow-card-hover transition-all`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-[2rem] font-display text-fydly-900 leading-none">{value}</p>
              <p className="text-[11px] font-bold text-fydly-400 uppercase tracking-wider mt-1.5 leading-tight">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Merchants */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-fydly-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display text-fydly-900">Derniers commerçants inscrits</h2>
            <p className="text-fydly-400 text-xs font-medium mt-0.5">{recentMerchants.length} résultats</p>
          </div>
          <button
            onClick={() => navigate('/admin/merchants')}
            className="flex items-center gap-1.5 text-[12px] font-bold text-fydly-500 hover:text-fydly-700 bg-fydly-50 hover:bg-fydly-100 px-3.5 py-2 rounded-lg transition-all"
          >
            Voir tous <ArrowRight size={13} />
          </button>
        </div>

        {/* Version mobile : cards (sm:hidden) */}
        <div className="sm:hidden divide-y divide-fydly-50">
          {recentMerchants.map(m => {
            const daysLeft = trialDaysLeft(m.trial_ends_at)
            return (
              <button
                key={m.id}
                className="w-full text-left px-4 py-4 min-h-[64px] flex items-center gap-3 hover:bg-fydly-50/40 active:scale-[0.98] transition-all"
                onClick={() => navigate(`/admin/merchants/${m.id}`)}
              >
                {/* Initiales avatar */}
                <div className="w-10 h-10 rounded-xl bg-fydly-500/10 border border-fydly-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-fydly-600">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Infos principales */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-fydly-900 text-sm truncate">{m.name}</p>
                  <p className="text-[11px] text-fydly-400 font-medium capitalize truncate">
                    {m.sector || 'Secteur non renseigné'}
                  </p>
                </div>

                {/* Droite : statut + J-X + clients */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {statusBadge(m.subscription_status)}
                  {m.subscription_status === 'trial' && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      daysLeft <= 3 ? 'bg-red-100 text-red-600'
                      : daysLeft <= 7 ? 'bg-amber-100 text-amber-600'
                      : 'bg-fydly-100 text-fydly-600'
                    }`}>
                      {daysLeft > 0 ? `J-${daysLeft}` : 'Expiré'}
                    </span>
                  )}
                  <span className="text-[10px] text-fydly-300 font-medium">{m.nb_clients} clients</span>
                </div>

                <ArrowRight size={13} className="text-fydly-300 flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* Version desktop : table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-fydly-50/60 border-b border-fydly-100/60">
                <th className="px-6 py-3.5 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">Commerçant</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">Secteur</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">Essai restant</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-fydly-400 uppercase tracking-widest text-right">Clients</th>
                <th className="px-6 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fydly-50">
              {recentMerchants.map(m => {
                const daysLeft = trialDaysLeft(m.trial_ends_at)
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-fydly-50/40 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/admin/merchants/${m.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-fydly-900 text-sm group-hover:text-fydly-600 transition-colors">{m.name}</p>
                      <p className="text-[11px] text-fydly-300 mt-0.5 font-medium">
                        {new Date(m.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-fydly-500 font-medium capitalize">
                      {m.sector || '—'}
                    </td>
                    <td className="px-6 py-4">{statusBadge(m.subscription_status)}</td>
                    <td className="px-6 py-4">
                      {m.subscription_status === 'trial' ? (
                        <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                          daysLeft <= 3 ? 'bg-red-100 text-red-600'
                          : daysLeft <= 7 ? 'bg-amber-100 text-amber-600'
                          : 'bg-fydly-100 text-fydly-600'
                        }`}>
                          {daysLeft > 0 ? `J-${daysLeft}` : 'Expiré'}
                        </span>
                      ) : (
                        <span className="text-fydly-200 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-fydly-900 text-sm">{m.nb_clients}</td>
                    <td className="px-6 py-4">
                      <div className="w-7 h-7 rounded-lg bg-fydly-50 group-hover:bg-fydly-100 flex items-center justify-center ml-auto transition-colors">
                        <ArrowRight size={13} className="text-fydly-400 group-hover:text-fydly-600 transition-colors" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
