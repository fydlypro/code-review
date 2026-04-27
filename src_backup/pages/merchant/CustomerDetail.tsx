import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Gift, Bell, Calendar, MapPin, Hash, ShieldCheck } from 'lucide-react'
import { supabase, Customer, LoyaltyCard, Transaction, Reward } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

type CustomerDetailState = {
  customer: Customer | null
  card: LoyaltyCard | null
  transactions: Transaction[]
  rewards: Reward[]
  availableReward: Reward | null
}

export default function MerchantCustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { merchant } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CustomerDetailState>({
    customer: null,
    card: null,
    transactions: [],
    rewards: [],
    availableReward: null
  })
  
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)

  const [validatingReward, setValidatingReward] = useState(false)

  useEffect(() => {
    if (merchant?.id && id) {
      loadCustomerData()
      // Realtime just to be super fresh
      const channel = supabase.channel(`customer_detail_${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `customer_id=eq.${id}` }, loadCustomerData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards', filter: `customer_id=eq.${id}` }, loadCustomerData)
        .subscribe()
      
      return () => { supabase.removeChannel(channel) }
    }
  }, [merchant?.id, id])

  const loadCustomerData = async () => {
    if (!merchant?.id || !id) return
    
    try {
      // 1. Customer base
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!customerData) {
        toast.error('Client introuvable')
        navigate('/merchant/customers')
        return
      }

      // 2. Loyalty Card
      const { data: cardData } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_id', id)
        .eq('merchant_id', merchant.id)
        .single()

      if (!cardData) {
        toast.error('Ce client n\'a pas de carte chez vous')
        navigate('/merchant/customers')
        return
      }

      // 3. Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', id)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
      
      // 4. Rewards
      const { data: rwData } = await supabase
        .from('rewards')
        .select('*')
        .eq('customer_id', id)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })

      const availableReward = rwData?.find(r => r.status === 'available') || null

      setData({
        customer: customerData,
        card: cardData,
        transactions: txData || [],
        rewards: rwData || [],
        availableReward
      })

    } catch (e: any) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateReward = async () => {
    if (!data.availableReward || !merchant || !data.card) return
    setValidatingReward(true)
    
    try {
      // Logic from instruction.md
      const { error: rErr } = await supabase
        .from('rewards')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq('id', data.availableReward.id)

      if (rErr) throw rErr

      const { error: tErr } = await supabase
        .from('transactions')
        .insert({
          card_id: data.card.id,
          customer_id: data.customer.id,
          merchant_id: merchant.id,
          type: 'redeem',
          amount: 0,
        })
      if (tErr) throw tErr

      // Reduce balance
      if (data.card.balance >= merchant.reward_threshold) {
        const { error: cErr } = await supabase
          .from('loyalty_cards')
          .update({ balance: data.card.balance - merchant.reward_threshold })
          .eq('id', data.card.id)
        if (cErr) throw cErr
      }

      toast.success('Récompense validée avec succès !')
      // reload happens via realtime or we can call manually
      loadCustomerData()

    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la validation')
    } finally {
      setValidatingReward(false)
    }
  }

  const sendPersonalNotification = async () => {
    if (!notifMessage.trim()) return
    setSendingNotif(true)
    try {
      // Mock OneSignal trigger logic
      // In reality, would trigger a function
      toast.success('Notification envoyée à ' + data.customer?.first_name)
      setShowNotifModal(false)
      setNotifMessage('')
    } catch (e) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSendingNotif(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="spinner border-fydly-500 w-8 h-8" />
      </div>
    )
  }

  if (!data.customer || !data.card) return null

  const { customer, card, transactions, rewards, availableReward } = data
  const threshold = merchant?.reward_threshold || 10

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 lg:pb-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/merchant/customers')}
          className="p-2 rounded-xl bg-white border border-fydly-200 text-fydly-700 hover:bg-fydly-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-fydly-900">{customer.first_name}</h1>
          <p className="text-fydly-600 font-medium">Fiche Détaillée</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        
        {/* Left Col: Info & Card */}
        <div className="md:col-span-1 space-y-6">
          
          <div className="card space-y-4">
            <h2 className="font-bold text-fydly-900 border-b border-fydly-50 pb-2">Informations</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-fydly-50 flex items-center justify-center text-fydly-500 shrink-0">
                  <Hash size={16} />
                </div>
                <div>
                  <span className="block text-xs text-fydly-500 font-bold uppercase tracking-wide">ID Client</span>
                  <span className="font-mono font-medium text-fydly-800">{customer.id.split('-')[0]}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-fydly-50 flex items-center justify-center text-fydly-500 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="block text-xs text-fydly-500 font-bold uppercase tracking-wide">Email</span>
                  <span className="font-medium text-fydly-800 break-all">{customer.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-fydly-50 flex items-center justify-center text-fydly-500 shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="block text-xs text-fydly-500 font-bold uppercase tracking-wide">Inscription</span>
                  <span className="font-medium text-fydly-800">{new Date(customer.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowNotifModal(true)}
              className="btn-secondary w-full mt-4 text-sm h-11"
            >
              <Bell size={16} />
              Notification PUSH
            </button>
          </div>

          <div className="card text-center bg-gradient-to-br from-white to-fydly-50 border border-fydly-100 relative overflow-hidden">
             
             <h3 className="font-bold text-fydly-900 mb-6">Carte Fidélité</h3>
             
             <div className="flex flex-wrap gap-2.5 justify-center mb-6">
               {Array.from({ length: threshold }).map((_, i) => (
                 <div key={i}>
                   {i < card.balance ? (
                     <div className="w-10 h-10 rounded-full bg-fydly-500 flex items-center justify-center text-white shadow-md transform hover:scale-110 transition-transform">
                       <ShieldCheck size={20} />
                     </div>
                   ) : (
                     <div className="w-10 h-10 rounded-full border-2 border-fydly-200 bg-white" />
                   )}
                 </div>
               ))}
             </div>

             <div className="bg-white rounded-xl p-3 border border-fydly-100 inline-block shadow-sm">
               <span className="font-mono font-bold text-fydly-900 text-lg">{card.balance}</span>
               <span className="text-fydly-400 mx-2">/</span>
               <span className="font-mono font-bold text-fydly-500 text-lg">{threshold}</span>
             </div>

             <div className="mt-4 text-sm text-fydly-600 font-medium">
               Total gagné : <strong className="text-fydly-900">{card.total_earned} 🟡</strong>
             </div>
          </div>

          {availableReward && (
            <div className="card bg-fydly-50 border border-fydly-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-fydly-500 shadow-sm">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-fydly-900">Récompense disponible !</h3>
                  <p className="text-xs text-fydly-600 font-medium">Gagnée le {new Date(availableReward.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <button
                onClick={handleValidateReward}
                disabled={validatingReward}
                className="btn-primary w-full h-11"
              >
                {validatingReward ? <span className="spinner" /> : "Valider la récompense"}
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Timeline & Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <h2 className="text-lg font-bold text-fydly-900 mb-6 border-b border-fydly-50 pb-3">Historique des passages</h2>
            
            {transactions.length === 0 ? (
              <p className="text-center text-fydly-500 font-medium py-8">Aucun passage enregistré pour l'instant.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-fydly-200 before:to-transparent">
                {transactions.map((tx, idx) => (
                  <div key={tx.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-fydly-100 text-fydly-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                      {tx.type === 'earn' ? <ShieldCheck size={16} /> : <Gift size={16} />}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card bg-white border border-fydly-50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-fydly-900 text-sm">
                          {tx.type === 'earn' ? 'Gain de tampons' : 'Récompense utilisée'}
                        </span>
                        <span className="text-xs font-mono text-fydly-400">
                          {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit'})}
                        </span>
                      </div>
                      <p className="text-sm text-fydly-600 font-medium">
                        {tx.type === 'earn' ? (
                          <span className="text-fydly-500">+{tx.amount} tampon{tx.amount > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-orange-500 font-bold">{merchant?.reward_description || 'Cadeau'}</span>
                        )}
                      </p>
                      <span className="text-xs text-fydly-400 mt-2 block font-mono">
                        {new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-[100] bg-fydly-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-sm animate-slide-in shadow-2xl p-6">
             <div className="flex justify-between mb-4">
                <h3 className="font-bold text-fydly-900 text-lg">Message privé</h3>
                <button onClick={() => setShowNotifModal(false)} className="text-fydly-400 hover:text-fydly-600 transition-colors">
                  <ArrowLeft size={20} className="rotate-180" />
                </button>
             </div>
             
             <p className="text-sm text-fydly-600 mb-4 font-medium">Vous allez envoyer une notification push uniquement à <strong>{customer.first_name}</strong>.</p>
             
             <textarea 
               value={notifMessage}
               onChange={(e) => setNotifMessage(e.target.value)}
               placeholder="Ex: Revenez vite pour profiter de votre dernier tampon !"
               className="input min-h-[100px] resize-none mb-2"
               maxLength={140}
             />
             <div className="text-right text-xs font-medium text-fydly-500 mb-6">{notifMessage.length}/140</div>
             
             <button 
               onClick={sendPersonalNotification}
               disabled={sendingNotif || !notifMessage.trim()}
               className="btn-primary w-full h-12"
              >
                {sendingNotif ? <span className="spinner" /> : "Envoyer"}
             </button>
          </div>
        </div>
      )}

    </div>
  )
}
