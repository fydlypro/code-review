import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Transaction, Merchant } from '../../lib/supabase'

// UI Components
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import { Clock, Ticket, Gift, History as HistoryIcon, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react'

type PopulatedTransaction = Transaction & { merchants: Pick<Merchant, 'name'> }

export default function HistoryPage() {
  const { customer } = useAuth()
  const [transactions, setTransactions] = useState<PopulatedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!customer?.id) return
    loadHistory()
  }, [customer?.id])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setHasError(false)
      const { data, error } = await supabase.rpc('get_customer_history')
      if (error) throw error
      setTransactions((data as PopulatedTransaction[]) || [])
    } catch (e) {
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in pt-2">
        <SkeletonLoader variant="rect" className="w-2/3 h-9 rounded-2xl" />
        <SkeletonLoader variant="rect" className="w-1/3 h-5 rounded-xl mb-2" />
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonLoader key={i} variant="rect" className="h-[76px] rounded-card" />
        ))}
      </div>
    )
  }

  // Calculer les stats
  const stampCount = transactions.filter(t => t.type === 'earn').length
  const giftCount = transactions.filter(t => t.type !== 'earn').length

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-fydly-500/10 rounded-2xl flex items-center justify-center text-fydly-500 border border-fydly-200/50">
            <HistoryIcon size={22} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-[28px] font-display text-fydly-900 leading-tight">Mon Historique</h2>
            <p className="text-fydly-400 font-medium text-sm">Tampons & cadeaux</p>
          </div>
        </div>
      </div>

      {/* Stats rapides (masquées si vide) */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div className="bg-white rounded-card border border-fydly-100 px-4 py-3.5 flex items-center gap-3 shadow-card">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Ticket size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-display text-fydly-900 leading-none">{stampCount}</p>
              <p className="text-fydly-400 text-xs font-semibold mt-0.5">Tampon{stampCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="bg-white rounded-card border border-fydly-100 px-4 py-3.5 flex items-center gap-3 shadow-card">
            <div className="w-9 h-9 bg-fydly-50 rounded-xl flex items-center justify-center shrink-0">
              <Gift size={18} className="text-fydly-500" />
            </div>
            <div>
              <p className="text-2xl font-display text-fydly-900 leading-none">{giftCount}</p>
              <p className="text-fydly-400 text-xs font-semibold mt-0.5">Cadeau{giftCount > 1 ? 'x' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {hasError ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-fydly-100 bg-fydly-50/30 shadow-none">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h3 className="font-bold text-fydly-900 text-base">Erreur de chargement</h3>
          <p className="text-fydly-400 text-sm mt-1.5 max-w-[220px] leading-relaxed">
            Impossible de récupérer votre historique.
          </p>
          <button
            onClick={loadHistory}
            className="mt-5 flex items-center gap-2 text-fydly-500 font-bold text-sm hover:text-fydly-700 transition-colors"
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
        </Card>

      ) : transactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-fydly-100 bg-fydly-50/20 shadow-none">
          <div className="relative mb-5">
            <div className="w-20 h-20 bg-fydly-50 rounded-full flex items-center justify-center">
              <TrendingUp size={32} className="text-fydly-200" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-fydly-100 rounded-full flex items-center justify-center">
              <Clock size={14} className="text-fydly-300" />
            </div>
          </div>
          <h3 className="font-bold text-fydly-900 text-lg">Pas encore d'activité</h3>
          <p className="text-fydly-400 text-sm max-w-[200px] mt-2 leading-relaxed">
            Scannez votre premier QR code pour voir vos tampons apparaître ici.
          </p>
        </Card>

      ) : (
        <div className="space-y-3">

          {/* Label de section */}
          <p className="text-[11px] font-bold text-fydly-300 uppercase tracking-widest px-1">
            {transactions.length} activité{transactions.length > 1 ? 's' : ''}
          </p>

          {/* Timeline */}
          <div className="relative">
            {/* Ligne verticale de timeline */}
            <div className="absolute left-[27px] top-8 bottom-8 w-px bg-fydly-100 pointer-events-none" />

            <div className="space-y-3">
              {transactions.map((t, index) => {
                const date = new Date(t.created_at)
                const isEarn = t.type === 'earn'
                const isFirst = index === 0

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 group animate-fade-in"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* Icône timeline */}
                    <div className={`relative z-10 w-11 h-11 sm:w-[54px] sm:h-[54px] rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105
                      ${isEarn
                        ? 'bg-green-50 border border-green-100'
                        : 'bg-fydly-50 border border-fydly-100'
                      }`}
                    >
                      {isEarn
                        ? <Ticket size={22} className="text-green-500" />
                        : <Gift size={22} className="text-fydly-500" />
                      }
                      {/* Badge +1 */}
                      {isEarn && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          +1
                        </div>
                      )}
                    </div>

                    {/* Contenu de la carte */}
                    <div className="flex-1 bg-white rounded-card border border-fydly-100 px-4 py-3.5 flex items-center justify-between shadow-card hover:shadow-card-hover hover:border-fydly-200 transition-all duration-300 min-w-0">
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-bold text-fydly-900 text-base leading-tight truncate">
                          {t.merchants.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-fydly-300 font-semibold text-xs">
                          <Clock size={11} />
                          <span>
                            {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-fydly-200">·</span>
                          <span>{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <Badge
                        variant={isEarn ? 'success' : 'default'}
                        className="shrink-0 ml-3 h-7 px-2.5 text-[10px] uppercase tracking-widest font-bold rounded-[100px]"
                      >
                        {isEarn ? 'Tampon' : 'Cadeau'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
