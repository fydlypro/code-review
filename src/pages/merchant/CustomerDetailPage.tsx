import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Gift, Bell, Calendar, Mail, Hash, ShieldCheck, Clock } from 'lucide-react'
import { supabase, Customer, LoyaltyCard, Transaction, Reward } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { notifyRewardValidated } from '../../lib/notifications'

// UI Components
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type CustomerDetailState = {
  customer: Customer | null
  card: LoyaltyCard | null
  transactions: Transaction[]
  rewards: Reward[]
  availableReward: Reward | null
}

export default function CustomerDetailPage() {
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
    }
  }, [merchant?.id, id])

  const loadCustomerData = async () => {
    if (!merchant?.id || !id) return
    try {
      const { data, error } = await supabase.rpc('get_customer_detail', {
        p_customer_id: id,
        p_merchant_id: merchant.id,
      })

      if (error) throw error

      if (!data?.customer) {
        toast.error('Client introuvable')
        navigate('/merchant/customers')
        return
      }

      if (!data?.card) {
        toast.error("Ce client n'a pas de carte chez vous")
        navigate('/merchant/customers')
        return
      }

      const rewards: Reward[] = data.rewards || []
      setData({
        customer: data.customer as Customer,
        card: data.card as LoyaltyCard,
        transactions: (data.transactions || []) as Transaction[],
        rewards,
        availableReward: rewards.find((r) => r.status === 'available') || null,
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
      // Étape 1 : marquer la récompense comme utilisée
      const { error: rErr } = await supabase
        .from('rewards')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq('id', data.availableReward.id)
      if (rErr) throw rErr

      // Étape 2 : décrémente le solde de façon atomique via RPC SECURITY DEFINER.
      // La RPC vérifie balance >= threshold dans la même transaction (pas de TOCTOU),
      // contrairement à une lecture-modification côté client sur data.card.balance
      // (valeur qui peut être périmée si un tampon a été gagné depuis le chargement).
      const { data: decremented, error: cErr } = await supabase
        .rpc('decrement_loyalty_balance', {
          p_card_id: data.card.id,
          p_amount: merchant.reward_threshold,
          p_merchant_id: merchant.id,
        })
      if (cErr || !decremented) {
        // Rollback étape 1
        await supabase
          .from('rewards')
          .update({ status: 'available', redeemed_at: null })
          .eq('id', data.availableReward.id)
        if (cErr) throw cErr
        throw new Error('Solde insuffisant ou modifié entre-temps — réessayez.')
      }

      // Étape 3 : enregistrer la transaction
      const { error: tErr } = await supabase
        .from('transactions')
        .insert({
          card_id: data.card.id,
          customer_id: data.customer!.id,
          merchant_id: merchant.id,
          type: 'redeem',
          amount: merchant.reward_threshold,
        })
      if (tErr) {
        console.error('[handleValidateReward] Échec insertion transaction:', tErr)
      }

      // Notification push au client (non bloquant)
      notifyRewardValidated(
        data.customer!.id,
        merchant.reward_description || 'votre récompense'
      )

      toast.success('Récompense validée avec succès !')
      loadCustomerData()
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la validation')
    } finally {
      setValidatingReward(false)
    }
  }

  const sendPersonalNotification = async () => {
    if (!notifMessage.trim() || !merchant?.id || !data.customer?.id) return
    setSendingNotif(true)
    try {
      // Envoi réel via l'Edge Function push individuel
      const { error: pushError } = await supabase.functions.invoke('send-individual-push', {
        body: {
          customer_id: data.customer.id,
          message: notifMessage.trim(),
          type: 'personal_message',
        },
      })

      // Enregistrement en DB — statut selon le résultat du push
      const { error: dbError } = await supabase.from('notifications').insert({
        merchant_id: merchant.id,
        message: notifMessage.trim(),
        segment: 'all',
        recipients_count: 1,
        status: pushError ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
      })
      if (dbError) throw dbError

      if (pushError) {
        toast.error('Notification non reçue — le client n\'a peut-être pas activé les push.')
      } else {
        toast.success('Message envoyé à ' + data.customer.first_name)
      }
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
      <div className="space-y-8 animate-fade-in pb-12">
         <SkeletonLoader variant="rect" className="w-48 h-10 rounded-xl mb-4" />
         <div className="grid md:grid-cols-3 gap-8">
            <SkeletonLoader variant="card" className="h-96" />
            <SkeletonLoader variant="card" className="md:col-span-2 h-[600px]" />
         </div>
      </div>
    )
  }

  if (!data.customer || !data.card) return null

  const { customer, card, transactions, availableReward } = data
  const threshold = merchant?.reward_threshold || 10

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-20 lg:pb-12 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button 
            onClick={() => navigate('/merchant/customers')}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-fydly-100 text-fydly-900 flex items-center justify-center hover:bg-fydly-50 hover:border-fydly-200 transition-all shadow-sm group shrink-0"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-display text-fydly-900 leading-tight truncate">{customer.first_name}</h1>
            <p className="text-fydly-500 font-medium text-xs sm:text-sm truncate">Membre depuis le {new Date(customer.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setShowNotifModal(true)} className="shrink-0 h-11 sm:h-12 px-3 sm:px-4 bg-white border-fydly-100 hover:bg-fydly-50 text-sm">
          <Bell size={16} className="mr-1.5" />
          <span className="hidden sm:inline">Message privé</span>
          <span className="sm:hidden">Message</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column: Metrics & Profile */}
        <div className="space-y-8">
          <Card className="p-5 sm:p-8 border-2 border-fydly-100/50">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-fydly-50">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-fydly-900 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-display shrink-0">
                 {customer.first_name?.[0]?.toUpperCase() || '?'}
               </div>
               <div>
                 <p className="text-fydly-400 text-xs font-bold uppercase tracking-widest mb-0.5">Profil client</p>
                 <p className="text-fydly-900 font-bold">{customer.first_name || 'Client anonyme'}</p>
               </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-fydly-50 flex items-center justify-center text-fydly-500">
                  <Hash size={18} />
                </div>
                <div>
                  <span className="block text-[10px] text-fydly-400 font-bold uppercase tracking-wider">Identifiant</span>
                  <span className="font-mono font-bold text-fydly-700 text-sm">#{customer.id.split('-')[0].toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-fydly-50 flex items-center justify-center text-fydly-500 shrink-0">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-fydly-400 font-bold uppercase tracking-wider">Email</span>
                  <span className="font-bold text-fydly-700 text-sm break-all">{customer.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-fydly-50 flex items-center justify-center text-fydly-500">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="block text-[10px] text-fydly-400 font-bold uppercase tracking-wider">Date d'inscription</span>
                  <span className="font-bold text-fydly-700 text-sm">{new Date(customer.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-fydly-900 border-none p-5 sm:p-8 text-white relative overflow-hidden group">
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-display">Progression Fidélité</h3>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10 uppercase tracking-widest">
                    {card.balance}/{threshold}
                  </div>
               </div>
               
               <div className={`grid gap-2 sm:gap-3 mb-8 ${threshold <= 10 ? 'grid-cols-5' : threshold <= 15 ? 'grid-cols-5' : 'grid-cols-5 sm:grid-cols-5'}`}>
                 {Array.from({ length: threshold }).map((_, i) => (
                   <div key={i} className="aspect-square flex items-center justify-center">
                     {i < card.balance ? (
                       <div className="w-full h-full rounded-xl sm:rounded-2xl bg-fydly-500 flex items-center justify-center shadow-lg shadow-fydly-500/30 transform hover:scale-110 transition-all duration-500">
                         <ShieldCheck size={16} className="text-white sm:w-5 sm:h-5" />
                       </div>
                     ) : (
                       <div className="w-full h-full rounded-xl sm:rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-sm" />
                     )}
                   </div>
                 ))}
               </div>

               <div className="pt-6 border-t border-white/10 flex justify-between items-center text-sm">
                 <span className="text-white/50 font-medium">Impact total</span>
                 <span className="font-display text-lg">{card.total_earned} points gagnés</span>
               </div>
             </div>
             <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-fydly-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          </Card>

          {availableReward && (
            <Card className="p-5 sm:p-8 border-2 border-success/20 bg-success-light/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-success shadow-sm border border-success/10">
                  <Gift size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-fydly-900">Récompense prête !</h3>
                  <p className="text-sm text-success font-bold uppercase tracking-wider">Éligible depuis le {new Date(availableReward.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleValidateReward}
                disabled={validatingReward}
                className="w-full h-14 text-lg bg-success text-white border-none hover:bg-success/90"
              >
                {validatingReward ? <span className="spinner" /> : "Consommer la récompense"}
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-display text-fydly-900 mb-6 sm:mb-10 pb-4 sm:pb-6 border-b border-fydly-50 flex items-center gap-3">
              <Clock size={20} className="text-fydly-500 sm:w-6 sm:h-6" />
              Historique des activités
            </h2>
            
            {transactions.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-fydly-50 rounded-full flex items-center justify-center mx-auto mb-4 text-fydly-200">
                  <Clock size={32} />
                </div>
                <p className="text-fydly-500 font-medium italic">Aucun passage encore enregistré pour ce client.</p>
              </div>
            ) : (
              <div className="space-y-0 relative">
                 {/* Timeline vertical line */}
                 <div className="absolute left-6 top-0 bottom-0 w-px bg-fydly-100 ml-px" />
                 
                 {transactions.map((tx) => (
                   <div key={tx.id} className="relative pl-12 sm:pl-16 pb-8 sm:pb-12 last:pb-0 group">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center z-10 border-2 sm:border-4 border-white shadow-sm transition-all group-hover:scale-110 ${
                        tx.type === 'earn' ? 'bg-fydly-50 text-fydly-500' : 'bg-success-light text-success'
                      }`}>
                        {tx.type === 'earn' ? <ShieldCheck size={16} className="sm:w-5 sm:h-5" /> : <Gift size={16} className="sm:w-5 sm:h-5" />}
                      </div>

                      <div className="bg-fydly-50/30 border border-fydly-100/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 group-hover:bg-fydly-50/50 transition-colors">
                        <div className="flex flex-col gap-2 mb-2 sm:mb-3">
                           <div className="flex items-center gap-2 flex-wrap">
                             <h4 className="font-bold text-fydly-900 text-sm sm:text-lg">
                               {tx.type === 'earn' ? 'Visite en boutique' : 'Récompense débloquée'}
                             </h4>
                             <Badge className={tx.type === 'earn' ? 'bg-fydly-100 text-fydly-600' : 'bg-success-light text-success'}>
                                {tx.type === 'earn' ? `+${tx.amount} pts` : 'CADEAU'}
                             </Badge>
                           </div>
                           <time className="text-[10px] font-bold text-fydly-400 uppercase tracking-wider">
                             {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric'})} · {new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                           </time>
                        </div>
                        <p className="text-fydly-600 font-medium text-xs sm:text-sm leading-relaxed">
                          {tx.type === 'earn' 
                            ? `Passage validé en boutique. Solde actuel : ${card.balance} tampons.`
                            : `Récompense utilisée : ${merchant?.reward_description || 'Cadeau Fidélité'}.`}
                        </p>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Message Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-[100] bg-fydly-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-sm animate-slide-up shadow-2xl p-8 rounded-[40px] border-none">
             <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-fydly-50 rounded-2xl flex items-center justify-center text-fydly-500">
                  <Bell size={24} />
                </div>
                <button 
                  onClick={() => setShowNotifModal(false)}
                  className="w-10 h-10 flex items-center justify-center text-fydly-300 hover:text-fydly-900 hover:bg-fydly-50 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} className="rotate-180" />
                </button>
             </div>
             
             <h3 className="font-display text-3xl text-fydly-900 mb-2">Message à {customer.first_name}</h3>
             <p className="text-sm text-fydly-500 mb-8 font-medium italic">Envoyez une petite attention ou une relance personnalisée.</p>
             
             <textarea 
               value={notifMessage}
               onChange={(e) => setNotifMessage(e.target.value)}
               placeholder="Ex: Revenez nous voir vite, votre 9ème tampon vous attend !"
               className="w-full h-32 bg-fydly-50 border-2 border-fydly-50 rounded-3xl p-5 text-fydly-900 placeholder:text-fydly-300 focus:outline-none focus:border-fydly-500/30 focus:bg-white transition-all resize-none font-medium"
               maxLength={140}
             />
             <div className="text-right text-[10px] font-bold text-fydly-300 mb-8 mt-2 uppercase tracking-widest">{notifMessage.length}/140 CARACTÈRES</div>
             
             <Button 
               onClick={sendPersonalNotification}
               disabled={sendingNotif || !notifMessage.trim()}
               className="w-full h-14 rounded-2xl text-lg shadow-lg shadow-fydly-900/10"
              >
                {sendingNotif ? <span className="spinner" /> : "Envoyer maintenant"}
             </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
