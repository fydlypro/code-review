import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, Star, AlertTriangle, Gift, ChevronRight, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

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

type FilterType = 'all' | 'active' | 'inactive' | 'vip' | 'reward'

export default function MerchantCustomers() {
  const { merchant } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  useEffect(() => {
    if (merchant?.id) {
      loadCustomers()
      setupRealtime()
    }
  }, [merchant?.id])

  // Pour la démo, le realtime sur des requêtes complexes avec JOIN nécessite souvent
  // soit de re-fetcher toute la liste au moindre changement, soit d'utiliser une vue matérialisée.
  // Ici on re-fetch à chaque INSERT sur loyalty_cards ou transactions lié à ce merchant_id.
  const setupRealtime = () => {
    if (!merchant?.id) return
    const channel = supabase.channel('merchant_customers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_cards', filter: `merchant_id=eq.${merchant.id}` }, () => {
        loadCustomers()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `merchant_id=eq.${merchant.id}` }, () => {
        loadCustomers()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards', filter: `merchant_id=eq.${merchant.id}` }, () => {
        loadCustomers()
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }

  const loadCustomers = async () => {
    if (!merchant?.id) return
    try {
      // 1. Fetch loyalty cards with customer details
      const { data: cards, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select(`
          id, customer_id, balance, total_earned, last_scan_at,
          customers (email, first_name, phone, created_at)
        `)
        .eq('merchant_id', merchant.id)
        .order('last_scan_at', { ascending: false, nullsFirst: false })

      if (cardsError) throw cardsError

      // 2. Fetch active rewards to check 'has_reward'
      const { data: rewards } = await supabase
        .from('rewards')
        .select('customer_id')
        .eq('merchant_id', merchant.id)
        .eq('status', 'available')
      
      const customersWithRewards = new Set(rewards?.map(r => r.customer_id) || [])

      const formatted: CustomerRow[] = (cards || []).map(c => ({
        id: c.id,
        customer_id: c.customer_id,
        first_name: c.customers?.first_name || 'Inconnu',
        email: c.customers?.email || '',
        phone: c.customers?.phone || '',
        balance: c.balance,
        total_earned: c.total_earned,
        last_scan_at: c.last_scan_at,
        created_at: c.customers?.created_at || new Date().toISOString(),
        has_reward: customersWithRewards.has(c.customer_id)
      }))

      setCustomers(formatted)
    } catch (err: any) {
      console.error(err)
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const filteredCustomers = useMemo(() => {
    let result = customers

    // 1. Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.first_name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q)
      )
    }

    // 2. Apply Filters
    if (activeFilter === 'active') {
      result = result.filter(c => c.last_scan_at && new Date(c.last_scan_at) >= thirtyDaysAgo)
    } else if (activeFilter === 'inactive') {
      result = result.filter(c => !c.last_scan_at || new Date(c.last_scan_at) < thirtyDaysAgo)
    } else if (activeFilter === 'vip') {
      const threshold = merchant?.reward_threshold || 10
      result = result.filter(c => c.total_earned >= threshold * 2)
    } else if (activeFilter === 'reward') {
      result = result.filter(c => c.has_reward)
    }

    return result
  }, [customers, searchQuery, activeFilter, merchant?.reward_threshold, thirtyDaysAgo])

  const exportCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.info('Aucun client à exporter.')
      return
    }

    const headers = ['Prenom', 'Email', 'Telephone', 'Tampons', 'Total_Gagne', 'Derniere_Visite', 'Date_Inscription']
    
    const rows = filteredCustomers.map(c => [
      c.first_name,
      c.email,
      c.phone || '',
      c.balance.toString(),
      c.total_earned.toString(),
      c.last_scan_at ? new Date(c.last_scan_at).toLocaleDateString('fr-FR') : 'Jamais',
      new Date(c.created_at).toLocaleDateString('fr-FR')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Clients_Fydly_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isInactive = (dateStr: string | null) => {
    if (!dateStr) return true
    return new Date(dateStr) < thirtyDaysAgo
  }

  const isVip = (totalElements: number) => {
    return totalElements >= (merchant?.reward_threshold || 10) * 2
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fydly-900">Base Clients</h1>
          <p className="text-fydly-600 font-medium">Gérez votre communauté et attribuez des récompenses.</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary w-full sm:w-auto h-11 text-sm bg-white hover:bg-fydly-50">
          <Download size={18} />
          Exporter CSV
        </button>
      </div>

      <div className="card space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-11"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-400" size={18} />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {(['all', 'active', 'inactive', 'vip', 'reward'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeFilter === f 
                    ? 'bg-fydly-500 text-white shadow-md' 
                    : 'bg-fydly-50 text-fydly-700 hover:bg-fydly-100'
                }`}
              >
                {f === 'all' && 'Tous les clients'}
                {f === 'active' && 'Actifs (< 30j)'}
                {f === 'inactive' && 'Inactifs (> 30j)'}
                {f === 'vip' && '⭐ VIP'}
                {f === 'reward' && '🎁 Récompense dispo'}
              </button>
            ))}
          </div>

        </div>

        {/* Client List */}
        <div className="overflow-x-auto rounded-xl border border-fydly-100">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-fydly-50 border-b border-fydly-100">
              <tr>
                <th className="table-header">Client</th>
                <th className="table-header">Solde actuel</th>
                <th className="table-header">Statut</th>
                <th className="table-header text-right">Dernier passage</th>
                <th className="table-header w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-fydly-50">
                    <td className="p-4"><div className="skeleton h-10 w-48 rounded-lg" /></td>
                    <td className="p-4"><div className="skeleton h-8 w-24 rounded-lg" /></td>
                    <td className="p-4"><div className="skeleton h-6 w-32 rounded-full" /></td>
                    <td className="p-4 text-right"><div className="skeleton h-6 w-24 rounded-lg ml-auto" /></td>
                    <td className="p-4"></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-fydly-500 font-medium">
                    <User size={48} className="mx-auto mb-3 text-fydly-200" />
                    Aucun client trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.customer_id} className="table-row group">
                    <td className="table-cell">
                      <div className="font-bold text-fydly-900">{c.first_name}</div>
                      <div className="text-xs text-fydly-500 mt-0.5">{c.email}</div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-fydly-100 text-fydly-800 px-2 py-1 rounded-md text-sm">
                          {c.balance} / {merchant?.reward_threshold || 10}
                        </span>
                        <span className="text-fydly-400 text-sm">🟡</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {c.has_reward && <span className="badge-success text-[11px] py-1 px-2.5">🎁 Récompense</span>}
                        {isVip(c.total_earned) && <span className="badge-warning text-[11px] py-1 px-2.5 bg-yellow-100 text-yellow-800"><Star size={10} className="fill-current" /> VIP</span>}
                        {isInactive(c.last_scan_at) && <span className="badge-warning text-[11px] py-1 px-2.5">⚠️ Inactif</span>}
                      </div>
                    </td>
                    <td className="table-cell text-right text-fydly-600 font-medium text-sm">
                      {c.last_scan_at ? new Date(c.last_scan_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Jamais'}
                    </td>
                    <td className="table-cell text-center pr-4">
                      <Link 
                        to={`/merchant/customers/${c.customer_id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-fydly-400 hover:text-fydly-600 hover:bg-fydly-100 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && <div className="p-4 border-t border-fydly-100 bg-fydly-50 text-sm text-fydly-600 flex justify-between font-medium">
            <span>Total: {filteredCustomers.length} client(s)</span>
          </div>}

        </div>
      </div>
    </div>
  )
}
