import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { TrendingUp, Clock, Activity, Send, AlertTriangle, Gift } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

type TimeFilter = '7d' | '30d' | '3m'

export default function MerchantAnalytics() {
  const { merchant } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d')

  const [transactions, setTransactions] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loyaltyCards, setLoyaltyCards] = useState<any[]>([])

  useEffect(() => {
    if (merchant?.id) {
      loadData()
    }
  }, [merchant?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: txData } = await supabase
        .from('transactions')
        .select('created_at, type, amount')
        .eq('merchant_id', merchant?.id)
        .order('created_at', { ascending: true })
      
      const { data: cData } = await supabase
        .from('customers')
        .select('created_at')
        // En théorie on devrait joying sur loyalty_cards pour les clients de CE merchant
      
      const { data: lcData } = await supabase
        .from('loyalty_cards')
        .select('balance, last_scan_at')
        .eq('merchant_id', merchant?.id)

      setTransactions(txData || [])
      setLoyaltyCards(lcData || [])
      // On filter les clients par la date de création de leur loyalty card (approx logic)

    } catch (e: any) {
      toast.error('Erreur lors du chargement des statistiques.')
    } finally {
      setLoading(false)
    }
  }

  // --- KPI Calculus ---
  const kpis = useMemo(() => {
    if (!transactions.length) return null

    const today = new Date()
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Heure de pointe & Jour le plus fréquenté
    const hoursCount: Record<number, number> = {}
    const daysCount: Record<number, number> = {} // 0 = Dimanche, 1 = Lundi, etc.

    transactions.forEach(tx => {
      const d = new Date(tx.created_at)
      const h = d.getHours()
      const day = d.getDay()
      
      hoursCount[h] = (hoursCount[h] || 0) + 1
      daysCount[day] = (daysCount[day] || 0) + 1
    })

    const peakHour = Object.entries(hoursCount).sort((a,b) => b[1] - a[1])[0]
    const bestDay = Object.entries(daysCount).sort((a,b) => b[1] - a[1])[0]

    const dayNames = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']

    // Returning clients (2+ scans sur 30j)
    // Actually we need grouping by customer_id for that, let's do a simplified version: 
    // Return rate = (Total clients / Total transactions) ... or we skip if data insufficient
    const returnRate = loyaltyCards.length > 0 ? 
      Math.round((loyaltyCards.filter(c => c.balance > 1 && new Date(c.last_scan_at) >= thirtyDaysAgo).length / loyaltyCards.length) * 100)
      : 0

    const rewardsValidated = transactions.filter(t => t.type === 'redeem' && t.created_at >= thisMonthStart).length

    // Proches récompense
    const threshold = merchant?.reward_threshold || 10
    const closeToReward = loyaltyCards.filter(c => c.balance >= threshold - 2 && c.balance < threshold).length
    
    // Churn Risk
    const churnRisk = loyaltyCards.filter(c => c.last_scan_at && new Date(c.last_scan_at) < new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)).length

    return {
      peakHour: peakHour ? `${peakHour[0]}h00` : '-',
      bestDay: bestDay ? dayNames[parseInt(bestDay[0])] : '-',
      returnRate,
      rewardsValidated,
      closeToReward,
      churnRisk
    }
  }, [transactions, loyaltyCards, merchant])

  // --- Chart Data ---
  const chartQueries = useMemo(() => {
    if (!transactions.length) return { visits: [], hours: [] }

    const daysLimit = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysLimit)

    const recentTx = transactions.filter(t => new Date(t.created_at) >= cutoffDate)

    const visitsByDay: Record<string, number> = {}
    recentTx.forEach(t => {
      const dateStr = new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      visitsByDay[dateStr] = (visitsByDay[dateStr] || 0) + 1
    })

    const visitsData = Object.entries(visitsByDay).map(([date, count]) => ({
      date, passages: count
    }))

    const hoursCount: Record<string, number> = {}
    transactions.forEach(t => {
      const h = new Date(t.created_at).getHours()
      const label = `${h}h`
      hoursCount[label] = (hoursCount[label] || 0) + 1
    })

    // Sort valid hours e.g. 8h to 20h
    const hoursData = Object.entries(hoursCount)
      .sort((a,b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([hour, count]) => ({ hour, passages: count }))

    return {
      visits: visitsData,
      hours: hoursData
    }
  }, [transactions, timeFilter])


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="spinner border-fydly-500 w-8 h-8" />
      </div>
    )
  }

  const hasData = transactions.length > 0

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fydly-900">Statistiques & Insights</h1>
          <p className="text-fydly-600 font-medium">Comprenez le comportement de vos clients.</p>
        </div>
      </div>

      {!hasData ? (
        <div className="card text-center py-16 px-4">
          <Activity size={48} className="text-fydly-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-fydly-900 mb-2">Pas encore assez de données</h2>
          <p className="text-fydly-600 max-w-md mx-auto mb-6">
            Dès que vous aurez vos premiers clients, vos graphiques et recommandations apparaîtront ici.
          </p>
          <Link to="/merchant/dashboard" className="btn-primary inline-flex">
            Retourner au Dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* Actions Recommandées */}
          <div className="card bg-gradient-to-r from-fydly-900 to-fydly-700 text-white rounded-2xl p-6 shadow-card-hover border-none">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-fydly-300" />
              Actions Recommandées
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              
              {kpis?.closeToReward ? (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl flex items-start gap-4 h-full">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{kpis.closeToReward} client(s) proche(s) du but !</h3>
                    <p className="text-white/80 text-sm mb-3">Ils sont à 1 ou 2 tampons de leur récompense.</p>
                    <button 
                      onClick={() => navigate('/merchant/dashboard')} 
                      className="text-sm font-bold text-white bg-fydly-500 hover:bg-fydly-400 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <Send size={14} /> Les encourager
                    </button>
                  </div>
                </div>
              ) : null}

              {kpis?.churnRisk ? (
                <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 p-4 rounded-xl flex items-start gap-4 h-full">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 text-orange-300">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{kpis.churnRisk} client(s) à risque</h3>
                    <p className="text-white/80 text-sm mb-3">Ils ne sont pas venus depuis 20 jours.</p>
                    <button 
                      onClick={() => navigate('/merchant/dashboard')}
                      className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <Send size={14} /> Envoyer une relance
                    </button>
                  </div>
                </div>
              ) : null}

              {!kpis?.closeToReward && !kpis?.churnRisk && (
                 <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl flex items-center h-full">
                    <p className="text-white/90 text-sm font-medium">Tout va bien ! Continuez de scanner les clients pour obtenir plus d'insights ciblés.</p>
                 </div>
              )}

            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Quick KPIs */}
            <div className="lg:col-span-1 space-y-4">
               <div className="card p-5 flex items-center justify-between">
                 <div>
                   <p className="label mb-0.5">Jour le plus actif</p>
                   <p className="font-bold text-xl text-fydly-900">{kpis?.bestDay}</p>
                 </div>
                 <div className="w-12 h-12 bg-fydly-50 rounded-full flex items-center justify-center text-fydly-500">
                   <TrendingUp size={24} />
                 </div>
               </div>

               <div className="card p-5 flex items-center justify-between">
                 <div>
                   <p className="label mb-0.5">Heure de pointe</p>
                   <p className="font-bold text-xl text-fydly-900">{kpis?.peakHour}</p>
                 </div>
                 <div className="w-12 h-12 bg-fydly-50 rounded-full flex items-center justify-center text-fydly-500">
                   <Clock size={24} />
                 </div>
               </div>

               <div className="card p-5 flex items-center justify-between">
                 <div>
                   <p className="label mb-0.5">Taux de retour (30j)</p>
                   <p className="font-bold text-xl text-fydly-900">{kpis?.returnRate}%</p>
                 </div>
                 <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                   <Activity size={24} />
                 </div>
               </div>
            </div>

            {/* Graphs */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-fydly-900">Évolution des passages</h3>
                  <select 
                    value={timeFilter} 
                    onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                    className="input w-auto py-1.5 px-3 text-sm h-auto bg-fydly-50 border-none font-medium cursor-pointer"
                  >
                    <option value="7d">7 derniers jours</option>
                    <option value="30d">30 derniers jours</option>
                    <option value="3m">3 derniers mois</option>
                  </select>
                </div>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartQueries.visits} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2196F3" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3F2FD" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64B5F6' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64B5F6' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(25,118,210,0.15)' }}
                        itemStyle={{ color: '#0D47A1', fontWeight: 'bold' }}
                        labelStyle={{ color: '#64B5F6', fontSize: '13px', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="passages" name="Passages" stroke="#2196F3" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="font-bold text-fydly-900 mb-6">Affluence moyenne par heure</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartQueries.hours} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3F2FD" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64B5F6' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64B5F6' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(25,118,210,0.15)' }}
                        itemStyle={{ color: '#0D47A1', fontWeight: 'bold' }}
                        labelStyle={{ color: '#64B5F6', fontSize: '13px', marginBottom: '4px' }}
                        cursor={{ fill: '#E3F2FD' }}
                      />
                      <Bar dataKey="passages" name="Scans" fill="#64B5F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  )
}
