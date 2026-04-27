import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Transaction, Merchant } from '../../lib/supabase'

type PopulatedTransaction = Transaction & { merchants: Pick<Merchant, 'name'> }

export default function History() {
  const { customer } = useAuth()
  const [transactions, setTransactions] = useState<PopulatedTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customer) return
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          merchants (name)
        `)
        .eq('customer_id', customer!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="spinner border-blue-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-[0_2px_12px_rgba(25,118,210,0.10)] p-6 mt-4">
      <h2 className="text-2xl font-bold text-[#0D47A1] mb-6">Mon Historique</h2>

      {transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-4xl mb-4 text-gray-300">⏳</span>
          <p className="text-blue-700">Aucune transaction pour le moment.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {transactions.map((t) => {
            const date = new Date(t.created_at)
            const isEarn = t.type === 'earn'
            
            return (
              <div 
                key={t.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-blue-50 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                    ${isEarn ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}
                  `}>
                    {isEarn ? '+1' : '🎁'}
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">{t.merchants.name}</p>
                    <p className="text-xs text-blue-500">
                      {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-md text-xs font-bold
                  ${isEarn ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}
                `}>
                  {isEarn ? 'Gain' : 'Récompense'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
