import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Download, ChevronRight, User, Users, Filter, Gift } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type CustomerRow = {
  id: string
  customer_id: string
  first_name: string
  email: string
  phone: string | null
  balance: number
  total_earned: number
  last_scan_at: string | null
  created_at: string
  has_reward: boolean
}

type FilterType = 'all' | 'active' | 'inactive' | 'reward'

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
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function CustomersPage() {
  const { merchant } = useAuth()
  const toast = useToast()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) || 'all'
  )

  useEffect(() => {
    if (merchant?.id) loadCustomers()
  }, [merchant?.id])

  const loadCustomers = async () => {
    if (!merchant?.id) return
    try {
      setLoading(true)
      const { data } = await supabase.rpc('get_merchant_customers', { p_merchant_id: merchant.id })
      const cards = (data?.cards || []) as any[]
      const rewardSet = new Set((data?.reward_customer_ids || []) as string[])
      const formatted: CustomerRow[] = cards.map(c => ({
        id: c.id,
        customer_id: c.customer_id,
        first_name: c.customers?.first_name || c.customers?.email || 'Client',
        email: c.customers?.email || '',
        phone: c.customers?.phone || '',
        balance: c.balance,
        total_earned: c.total_earned,
        last_scan_at: c.last_scan_at,
        created_at: c.customers?.created_at || new Date().toISOString(),
        has_reward: rewardSet.has(c.customer_id)
      }))
      setCustomers(formatted)
    } catch {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const segmentCounts = useMemo(() => ({
    all: customers.length,
    active: customers.filter(c => c.last_scan_at && new Date(c.last_scan_at) >= thirtyDaysAgo).length,
    inactive: customers.filter(c => !c.last_scan_at || new Date(c.last_scan_at) < thirtyDaysAgo).length,
    reward: customers.filter(c => c.has_reward).length,
  }), [customers])

  const filteredCustomers = useMemo(() => {
    let result = customers
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.first_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    }
    if (activeFilter === 'active') result = result.filter(c => c.last_scan_at && new Date(c.last_scan_at) >= thirtyDaysAgo)
    else if (activeFilter === 'inactive') result = result.filter(c => !c.last_scan_at || new Date(c.last_scan_at) < thirtyDaysAgo)
    else if (activeFilter === 'reward') result = result.filter(c => c.has_reward)
    return result
  }, [customers, searchQuery, activeFilter])

  const exportCSV = () => {
    if (filteredCustomers.length === 0) { toast.info('Aucun client à exporter.'); return }
    const headers = ['Prenom', 'Email', 'Telephone', 'Tampons', 'Total_Gagne', 'Derniere_Visite', 'Date_Inscription']
    const rows = filteredCustomers.map(c => [
      c.first_name, c.email, c.phone || '', c.balance.toString(), c.total_earned.toString(),
      c.last_scan_at ? new Date(c.last_scan_at).toLocaleDateString('fr-FR') : 'Jamais',
      new Date(c.created_at).toLocaleDateString('fr-FR')
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Clients_Fydly_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'active', label: 'Actifs' },
    { key: 'inactive', label: 'Inactifs' },
    { key: 'reward', label: 'Cadeau' },
  ]

  const filterPillClass = (key: FilterType) => {
    const base = 'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border'
    if (activeFilter === key) {
      if (key === 'active') return `${base} bg-emerald-500 text-white border-emerald-500 shadow-sm`
      if (key === 'inactive') return `${base} bg-amber-500 text-white border-amber-500 shadow-sm`
      if (key === 'reward') return `${base} bg-violet-600 text-white border-violet-600 shadow-sm`
      return `${base} bg-fydly-500 text-white border-fydly-500 shadow-sm`
    }
    return `${base} bg-white text-slate-500 border-slate-200 hover:border-fydly-300 hover:text-fydly-600`
  }

  const dotColor = (key: FilterType) => {
    if (key === 'active') return 'bg-emerald-400'
    if (key === 'inactive') return 'bg-amber-400'
    if (key === 'reward') return 'bg-violet-400'
    return 'bg-fydly-400'
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-20 lg:pb-12">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display text-slate-900 leading-tight mb-1">Clients</h1>
          <div className="flex items-center gap-3 flex-wrap mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-fydly-50 text-fydly-700 border border-fydly-100">
              <Users size={11} /> {segmentCounts.all} total
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {segmentCounts.active} actifs
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {segmentCounts.inactive} inactifs
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={exportCSV}
          className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-200 text-slate-700 h-11"
        >
          <Download size={16} className="mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* ── TABLE CARD ── */}
      <div className="bg-white overflow-hidden shadow-card" style={{ borderRadius: 20 }}>

        {/* Barre de filtres */}
        <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-fydly-500 transition-colors" size={17} />
              <Input
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200 focus:border-fydly-500 text-sm"
              />
            </div>
            {/* Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)} className={filterPillClass(f.key)}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === f.key ? 'bg-white/70' : dotColor(f.key)}`} />
                  {f.label}
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === f.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {segmentCounts[f.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nom</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tampons</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dernière visite</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="px-8 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-5"><SkeletonLoader variant="rect" className="h-9 w-44 rounded-xl" /></td>
                    <td className="px-6 py-5"><SkeletonLoader variant="rect" className="h-6 w-28 rounded-lg" /></td>
                    <td className="px-6 py-5"><SkeletonLoader variant="rect" className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-6 py-5"><SkeletonLoader variant="rect" className="h-7 w-20 rounded-full" /></td>
                    <td className="px-8 py-5"></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100">
                      <Users size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-display text-slate-800 mb-2">Aucun client encore</h3>
                    <p className="text-slate-400 text-sm font-medium">Partagez votre QR Code pour commencer</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const isActive = c.last_scan_at && new Date(c.last_scan_at) >= thirtyDaysAgo
                  const progressPct = Math.min((c.balance / (merchant?.reward_threshold || 10)) * 100, 100)
                  return (
                    <tr key={c.customer_id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.first_name)}`}>
                            {getInitials(c.first_name)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{c.first_name}</div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="bg-fydly-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-xs">
                            {c.balance}/{merchant?.reward_threshold || 10}
                          </span>
                          {c.has_reward && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Gift size={9} /> Cadeau
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                        {c.last_scan_at
                          ? new Date(c.last_scan_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                          : <span className="text-slate-300">Jamais</span>}
                      </td>
                      <td className="px-6 py-5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <Link
                          to={`/merchant/customers/${c.customer_id}`}
                          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-fydly-500 hover:border-fydly-300 hover:bg-fydly-50 transition-all shadow-sm group-hover:shadow-glow-blue"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3">
                <SkeletonLoader variant="rect" className="h-6 w-1/2 rounded-md" />
                <SkeletonLoader variant="rect" className="h-4 w-1/3 rounded-md" />
              </div>
            ))
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center px-6">
              <Users size={40} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-sm">Aucun client encore</p>
              <p className="text-slate-400 text-xs mt-1">Partagez votre QR Code pour commencer</p>
            </div>
          ) : (
            filteredCustomers.map(c => {
              const isActive = c.last_scan_at && new Date(c.last_scan_at) >= thirtyDaysAgo
              const progressPct = Math.min((c.balance / (merchant?.reward_threshold || 10)) * 100, 100)
              return (
                <Link
                  key={c.customer_id}
                  to={`/merchant/customers/${c.customer_id}`}
                  className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.first_name)}`}>
                    {getInitials(c.first_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900 text-sm truncate">{c.first_name}</span>
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate mb-2">{c.email}</div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-fydly-500 h-full rounded-full" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {c.balance}/{merchant?.reward_threshold || 10}
                      </span>
                      {c.has_reward && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Gift size={8} /> Cadeau
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {c.last_scan_at
                        ? new Date(c.last_scan_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                        : 'Jamais'}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredCustomers.length} client{filteredCustomers.length > 1 ? 's' : ''} affiché{filteredCustomers.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Filter size={11} />
            <span>{activeFilter}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
