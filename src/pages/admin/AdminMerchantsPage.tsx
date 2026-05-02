import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type MerchantRow = {
  id: string
  name: string
  sector: string | null
  subscription_status: 'trial' | 'pro' | 'business' | 'expired' | 'cancelled'
  trial_ends_at: string
  stripe_subscription_id: string | null
  created_at: string
  nb_clients: number
}

type FilterStatus = 'all' | 'trial' | 'pro' | 'business' | 'expired'

export default function AdminMerchantsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [merchants, setMerchants] = useState<MerchantRow[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    loadMerchants()
  }, [])

  const loadMerchants = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('merchants')
      .select('id, name, sector, subscription_status, trial_ends_at, stripe_subscription_id, created_at, loyalty_cards(count)')
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    setMerchants(
      data.map(m => ({
        ...m,
        nb_clients: (m.loyalty_cards as unknown as { count: number }[])[0]?.count ?? 0,
      }))
    )
    setLoading(false)
  }

  const counts = useMemo(() => ({
    all:      merchants.length,
    trial:    merchants.filter(m => m.subscription_status === 'trial').length,
    pro:      merchants.filter(m => m.subscription_status === 'pro').length,
    business: merchants.filter(m => m.subscription_status === 'business').length,
    expired:  merchants.filter(m => m.subscription_status === 'expired' || m.subscription_status === 'cancelled').length,
  }), [merchants])

  const filtered = useMemo(() => {
    let list = merchants
    if (filter === 'expired') list = list.filter(m => m.subscription_status === 'expired' || m.subscription_status === 'cancelled')
    else if (filter !== 'all') list = list.filter(m => m.subscription_status === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.sector?.toLowerCase().includes(q))
    }
    return list
  }, [merchants, filter, search])

  const trialDaysLeft = (trialEndsAt: string) => {
    return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
  }

  const statusBadge = (m: MerchantRow) => {
    if (m.subscription_status === 'pro')       return <Badge variant="success" dot>Pro</Badge>
    if (m.subscription_status === 'business')  return <Badge variant="success" dot>Business</Badge>
    if (m.subscription_status === 'cancelled') return <Badge variant="warning" dot>Annulé</Badge>
    if (m.subscription_status === 'trial') {
      const d = trialDaysLeft(m.trial_ends_at)
      return (
        <div className="flex items-center gap-2">
          <Badge variant="info" dot>Trial</Badge>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            d <= 3 ? 'bg-red-100 text-red-600'
            : d <= 7 ? 'bg-amber-100 text-amber-600'
            : 'bg-fydly-100 text-fydly-500'
          }`}>
            {d > 0 ? `J-${d}` : 'expiré'}
          </span>
        </div>
      )
    }
    return <Badge variant="warning" dot>Expiré</Badge>
  }

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all',      label: 'Tous' },
    { key: 'trial',    label: 'Trial' },
    { key: 'pro',      label: 'Pro' },
    { key: 'business', label: 'Business' },
    { key: 'expired',  label: 'Expirés' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-fydly-500/10 border border-fydly-500/20 rounded-2xl flex items-center justify-center text-fydly-600">
          <Store size={22} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-fydly-900 tracking-tight">Commerçants</h1>
          <p className="text-fydly-400 font-medium text-sm">
            {counts.all} commerçant{counts.all !== 1 ? 's' : ''} enregistré{counts.all !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-fydly-50 flex flex-col gap-3 bg-white">
          {/* Barre de recherche */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-300 pointer-events-none" size={16} />
            <input
              type="search"
              inputMode="search"
              placeholder="Rechercher par nom ou secteur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-[14px] border-[1.5px] border-fydly-100 rounded-xl text-fydly-900 placeholder:text-fydly-300 focus:outline-none focus:border-fydly-400 focus:ring-2 focus:ring-fydly-400/10 transition-all bg-fydly-50/50"
            />
          </div>

          {/* Filter tabs — défilables horizontalement sur mobile */}
          <div className="flex items-center gap-1 bg-fydly-50 p-1 rounded-xl border border-fydly-100 overflow-x-auto">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all duration-150 flex-shrink-0',
                  filter === f.key
                    ? 'bg-white text-fydly-900 shadow-sm border border-fydly-100/60'
                    : 'text-fydly-400 hover:text-fydly-700 hover:bg-white/60',
                ].join(' ')}
              >
                {f.label}
                <span className={[
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  filter === f.key ? 'bg-fydly-100 text-fydly-600' : 'bg-fydly-100/60 text-fydly-400',
                ].join(' ')}>
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Version mobile : cards (sm:hidden) */}
        <div className="sm:hidden divide-y divide-fydly-50">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-3">
                <SkeletonLoader variant="rect" className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonLoader variant="rect" className="h-4 rounded-lg w-3/4" />
                  <SkeletonLoader variant="rect" className="h-3 rounded-lg w-1/2" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 bg-fydly-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store size={24} className="text-fydly-200" />
              </div>
              <p className="text-fydly-400 font-bold text-sm">Aucun commerçant trouvé</p>
              <p className="text-fydly-300 text-xs mt-1">Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                className="w-full text-left px-4 py-4 min-h-[64px] flex items-center gap-3 hover:bg-fydly-50/40 active:scale-[0.98] transition-all"
                onClick={() => navigate(`/admin/merchants/${m.id}`)}
              >
                {/* Avatar initiales */}
                <div className="w-10 h-10 rounded-xl bg-fydly-500/10 border border-fydly-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-fydly-600">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-fydly-900 text-sm truncate">{m.name}</p>
                  <p className="text-[11px] text-fydly-400 font-medium mt-0.5">
                    Inscrit le {new Date(m.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Badge statut */}
                <div className="flex-shrink-0">
                  {statusBadge(m)}
                </div>

                <ChevronRight size={14} className="text-fydly-300 flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Version desktop : table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-fydly-50/60 border-b border-fydly-100/60">
                {['Commerçant', 'Secteur', 'Statut', 'Stripe', 'Clients', 'Inscrit le', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-6 py-3.5 text-[10px] font-bold text-fydly-400 uppercase tracking-widest ${i >= 4 && i < 6 ? 'text-right' : ''} ${i === 6 ? 'w-12' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-fydly-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <SkeletonLoader variant="rect" className="h-5 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="w-14 h-14 bg-fydly-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Store size={24} className="text-fydly-200" />
                    </div>
                    <p className="text-fydly-400 font-bold text-sm">Aucun commerçant trouvé</p>
                    <p className="text-fydly-300 text-xs mt-1">Essayez de modifier vos filtres ou votre recherche.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr
                    key={m.id}
                    className="hover:bg-fydly-50/40 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/admin/merchants/${m.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-fydly-900 text-sm group-hover:text-fydly-600 transition-colors">{m.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-fydly-500 font-medium capitalize">{m.sector || '—'}</span>
                    </td>
                    <td className="px-6 py-4">{statusBadge(m)}</td>
                    <td className="px-6 py-4">
                      {m.stripe_subscription_id ? (
                        <span className="text-[11px] font-mono text-fydly-400 bg-fydly-50 border border-fydly-100 px-2.5 py-1 rounded-lg">
                          {m.stripe_subscription_id.slice(0, 14)}…
                        </span>
                      ) : (
                        <span className="text-xs text-fydly-200 italic">Non lié</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-fydly-900 text-sm">{m.nb_clients}</td>
                    <td className="px-6 py-4 text-right text-sm text-fydly-400 font-medium">
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-7 h-7 rounded-lg bg-fydly-50 group-hover:bg-fydly-100 flex items-center justify-center ml-auto transition-colors">
                        <ChevronRight size={14} className="text-fydly-300 group-hover:text-fydly-600 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-fydly-50/40 border-t border-fydly-50 flex items-center justify-between">
          <span className="text-[11px] font-bold text-fydly-400 uppercase tracking-widest">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-[11px] font-bold text-fydly-400 hover:text-fydly-700 transition-colors"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
