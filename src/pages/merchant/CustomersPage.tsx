import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Download, ChevronRight, User, Users, Filter, Gift } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

// UI Components
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
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

// Couleurs d'avatars déterministes basées sur la première lettre
const AVATAR_PALETTE = [
  'bg-fydly-100 text-fydly-700',
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

  // Filters & Search — initialise depuis l'URL (?filter=inactive, etc.)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) || 'all'
  )

  useEffect(() => {
    if (merchant?.id) {
      loadCustomers()
    }
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
    } catch (err: any) {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const segmentCounts = useMemo(() => {
    const threshold = merchant?.reward_threshold || 10
    return {
      all: customers.length,
      active: customers.filter(c => c.last_scan_at && new Date(c.last_scan_at) >= thirtyDaysAgo).length,
      inactive: customers.filter(c => !c.last_scan_at || new Date(c.last_scan_at) < thirtyDaysAgo).length,
      reward: customers.filter(c => c.has_reward).length,
    }
  }, [customers, merchant?.reward_threshold])

  const filteredCustomers = useMemo(() => {
    let result = customers
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.first_name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q)
      )
    }
    if (activeFilter === 'active') {
      result = result.filter(c => c.last_scan_at && new Date(c.last_scan_at) >= thirtyDaysAgo)
    } else if (activeFilter === 'inactive') {
      result = result.filter(c => !c.last_scan_at || new Date(c.last_scan_at) < thirtyDaysAgo)
    } else if (activeFilter === 'reward') {
      result = result.filter(c => c.has_reward)
    }
    return result
  }, [customers, searchQuery, activeFilter, merchant?.reward_threshold])

  const exportCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.info('Aucun client à exporter.')
      return
    }
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-20 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-fydly-50 rounded-2xl flex items-center justify-center text-fydly-500 shadow-sm border border-fydly-100">
            <Users size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-display text-fydly-900 leading-tight">Vos clients</h1>
            <p className="text-fydly-600 font-medium text-sm sm:text-base">Gérez votre communauté fidèle.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={exportCSV} className="w-full sm:w-auto bg-white hover:bg-fydly-50 border-fydly-100 h-11 sm:h-auto">
          <Download size={18} className="mr-2" />
          📥 Exporter
        </Button>
      </div>

      <Card className="p-0 border-2 border-fydly-100/50 overflow-hidden">
        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-6 border-b border-fydly-50 space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            <div className="relative w-full lg:w-96 group">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11 sm:h-12 rounded-2xl border-fydly-100 group-hover:border-fydly-300 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-300 group-focus-within:text-fydly-600 transition-colors" size={20} />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto no-scrollbar">
              <div className="flex items-center gap-1.5 flex-nowrap">
                {([
                  { key: 'all',      label: 'Tous',     dot: 'bg-fydly-400',   active: 'bg-fydly-500 text-white shadow-md shadow-fydly-200' },
                  { key: 'active',   label: 'Actifs',   dot: 'bg-emerald-400', active: 'bg-emerald-500 text-white shadow-md shadow-emerald-100' },
                  { key: 'inactive', label: 'Inactifs', dot: 'bg-fydly-300',   active: 'bg-fydly-400 text-white shadow-md shadow-fydly-100' },
{ key: 'reward',   label: 'Cadeau',   dot: 'bg-violet-400',  active: 'bg-violet-500 text-white shadow-md shadow-violet-100' },
                ] as { key: FilterType; label: string; dot: string; active: string }[]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                      activeFilter === f.key
                        ? f.active
                        : 'bg-fydly-50 text-fydly-500 hover:bg-fydly-100 border border-fydly-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === f.key ? 'bg-white/70' : f.dot}`} />
                    {f.label}
                    {segmentCounts[f.key] > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeFilter === f.key ? 'bg-white/20' : 'bg-fydly-100 text-fydly-500'}`}>
                        {segmentCounts[f.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table View (Hidden on Mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-fydly-50/50 text-fydly-400 text-[11px] font-bold uppercase tracking-widest border-b border-fydly-50">
                <th className="px-8 py-5">Client</th>
                <th className="px-6 py-5">Fidélité</th>
                <th className="px-6 py-5">Statut / Badges</th>
                <th className="px-6 py-5 text-right">Dernière activité</th>
                <th className="px-8 py-5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fydly-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6"><SkeletonLoader variant="rect" className="h-10 w-48 rounded-lg" /></td>
                    <td className="px-6 py-6"><SkeletonLoader variant="rect" className="h-10 w-24 rounded-lg" /></td>
                    <td className="px-6 py-6"><SkeletonLoader variant="rect" className="h-8 w-40 rounded-full" /></td>
                    <td className="px-6 py-6"><SkeletonLoader variant="rect" className="h-6 w-24 rounded-lg ml-auto" /></td>
                    <td className="px-8 py-6"></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-16 h-16 bg-fydly-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-fydly-100">
                      <User size={28} className="text-fydly-300" />
                    </div>
                    <h3 className="text-xl font-display text-fydly-900 mb-2">Aucun résultat</h3>
                    <p className="text-fydly-400 text-sm font-medium">Essayez un autre filtre ou modifiez votre recherche.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.customer_id} className="group hover:bg-fydly-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.first_name)}`}>
                          {getInitials(c.first_name)}
                        </div>
                        <div>
                          <div className="font-bold text-fydly-900 text-[15px]">{c.first_name}</div>
                          <div className="text-xs text-fydly-400 font-medium mt-0.5">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 bg-fydly-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-fydly-500 h-full transition-all duration-500" 
                            style={{ width: `${Math.min((c.balance / (merchant?.reward_threshold || 10)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-fydly-900 text-xs">{c.balance}/{merchant?.reward_threshold || 10}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-wrap gap-2">
                        {c.has_reward && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Gift size={10} /> Cadeau dispo
                          </span>
                        )}
                        {!c.has_reward && (
                          <span className="text-[10px] font-medium text-fydly-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right font-bold text-fydly-600 text-sm">
                      {c.last_scan_at ? new Date(c.last_scan_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Jamais'}
                    </td>
                    <td className="px-8 py-6">
                      <Link to={`/merchant/customers/${c.customer_id}`} className="p-2 border rounded-xl hover:bg-fydly-50 transition-all flex items-center justify-center">
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-fydly-50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 space-y-4">
                <SkeletonLoader variant="rect" className="h-6 w-1/2 rounded-md" />
                <SkeletonLoader variant="rect" className="h-4 w-1/3 rounded-md" />
              </div>
            ))
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center px-6">
              <User size={40} className="text-fydly-200 mx-auto mb-4" />
              <p className="text-fydly-500 font-medium">Aucun client trouvé.</p>
            </div>
          ) : (
            filteredCustomers.map(c => (
              <Link
                key={c.customer_id}
                to={`/merchant/customers/${c.customer_id}`}
                className="flex items-center gap-4 p-5 hover:bg-fydly-50/50 transition-all active:scale-[0.98]"
              >
                {/* Avatar initiales */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.first_name)}`}>
                  {getInitials(c.first_name)}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-fydly-900 truncate text-[15px]">{c.first_name}</span>
                  </div>
                  <div className="text-[11px] text-fydly-400 font-medium truncate mb-2">
                    {c.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-fydly-50 px-2 py-0.5 rounded-lg border border-fydly-100">
                      <span className="text-[10px] font-black text-fydly-600">{c.balance}/{merchant?.reward_threshold || 10}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-fydly-400" />
                    </div>
                    {c.has_reward && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Gift size={8} /> CADEAU
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-fydly-300 uppercase tracking-tighter">
                    {c.last_scan_at ? new Date(c.last_scan_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'JAMAIS'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-fydly-50 flex items-center justify-center text-fydly-200 border border-fydly-100">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
          
          <div className="p-6 bg-fydly-50/50 flex justify-between items-center text-xs font-bold text-fydly-400 tracking-widest uppercase border-t border-fydly-50">
            <span>{filteredCustomers.length} CLIENTS AFFICHÉS</span>
            <div className="flex items-center gap-2">
              <Filter size={12} />
              <span>FILTRE: {activeFilter.toUpperCase()}</span>
            </div>
          </div>
        </Card>
    </div>
  )
}
