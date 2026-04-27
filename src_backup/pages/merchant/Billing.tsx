import React, { useState } from 'react'
import { CreditCard, CheckCircle2, Zap, LayoutDashboard, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    description: 'Pour démarrer la fidélité digitale',
    features: [
      'Jusqu\'à 200 clients',
      '4 notifications push / mois',
      'QR code dynamique',
      'Dashboard temps réel'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'Pour développer votre activité',
    isPopular: true,
    features: [
      'Jusqu\'à 1000 clients',
      'Notifications push illimitées',
      'Statistiques détaillées',
      'Support prioritaire 7j/7'
    ]
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    description: 'Pour les commerces en croissance',
    features: [
      'Clients illimités',
      'Multi-établissements',
      'Accès API',
      'Accompagnement dédié'
    ]
  }
]

export default function MerchantBilling() {
  const { merchant } = useAuth()
  const toast = useToast()
  
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId)
    // Mock Stripe Checkout redirect
    setTimeout(() => {
      toast.info(`Redirection vers Stripe Checkout pour le plan ${planId}... (Simulation)`)
      setLoadingPlan(null)
    }, 1500)
  }

  const handlePortal = async () => {
    setLoadingPortal(true)
    setTimeout(() => {
      toast.info('Ouverture du portail client Stripe... (Simulation)')
      setLoadingPortal(false)
    }, 1000)
  }

  const calculateDaysLeft = () => {
    if (!merchant?.trial_ends_at) return 0
    const diff = new Date(merchant.trial_ends_at).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  const daysLeft = calculateDaysLeft()
  const isTrialUrl = merchant?.subscription_status === 'trial'
  const isExpired = isTrialUrl && daysLeft === 0
  const bannerColor = daysLeft <= 7 ? 'bg-orange-500' : 'bg-fydly-500'

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fydly-900">Abonnement</h1>
          <p className="text-fydly-600 font-medium">Gérez votre formule et vos factures.</p>
        </div>
        {merchant?.subscription_status !== 'trial' && (
          <button 
            onClick={handlePortal}
            disabled={loadingPortal}
            className="btn-secondary h-11 bg-white"
          >
            {loadingPortal ? <span className="spinner" /> : "Gérer mon abonnement"}
          </button>
        )}
      </div>

      {isExpired && (
         <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-red-800 mb-2">
              <AlertTriangle size={24} />
              <h2 className="text-lg font-bold">Période d'essai terminée</h2>
            </div>
            <p className="text-red-700 font-medium">
              Votre tableau de bord est repassé en lecture seule et votre QR code est désactivé.
              Veuillez choisir un plan pour réactiver votre programme de fidélité.
            </p>
         </div>
      )}

      {isTrialUrl && !isExpired && (
        <div className={`text-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden ${bannerColor}`}>
          <div className="absolute -right-12 -top-12 opacity-10 blur-xl">
             <Zap size={150} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
               <h2 className="text-xl font-bold mb-1">Vous êtes en période d'essai</h2>
               <p className="text-white/90 font-medium">
                 Il vous reste <strong className="text-2xl mx-1">{daysLeft}</strong> jours de test gratuit. 
                 N'attendez pas la dernière minute pour choisir votre plan !
               </p>
             </div>
             <div className="w-full md:w-auto shrink-0 bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/30 text-center">
               <span className="block text-xs uppercase tracking-widest font-bold opacity-80 mb-1">Fin de l'essai</span>
               <span className="font-mono text-lg font-medium">{new Date(merchant.trial_ends_at).toLocaleDateString('fr-FR')}</span>
             </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 pt-4">
        {PLANS.map((plan) => (
          <div 
            key={plan.id}
            className={`card flex flex-col relative transition-all duration-300 ${
              plan.isPopular ? 'border-2 border-fydly-500 scale-100 lg:scale-105 z-10 shadow-xl' : 'border-2 border-transparent hover:border-fydly-200'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-fydly-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-md">
                Le plus choisi
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="font-bold text-xl text-fydly-900">{plan.name}</h3>
              <p className="text-sm text-fydly-500 mt-1 mb-4 h-10">{plan.description}</p>
              <div className="flex items-end justify-center gap-1 font-serif text-fydly-900">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-xl">€</span>
                <span className="text-fydly-500 font-sans text-sm font-bold ml-1 pb-1">/ mois</span>
              </div>
            </div>

            <div className="flex-1">
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fydly-700 font-medium">
                    <CheckCircle2 size={18} className={`shrink-0 ${plan.isPopular ? 'text-fydly-500' : 'text-fydly-300'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleCheckout(plan.id)}
              disabled={loadingPlan !== null}
              className={`w-full h-12 rounded-xl font-bold flex items-center justify-center transition-all ${
                plan.isPopular 
                  ? 'bg-fydly-500 text-white hover:bg-fydly-600 shadow-lg hover:shadow-xl' 
                  : 'bg-fydly-50 text-fydly-900 hover:bg-fydly-100'
              }`}
            >
              {loadingPlan === plan.id ? <span className="spinner" /> : (
                <>
                  Choisir ce plan <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Reinsurance */}
      <div className="mt-12 pt-8 border-t border-fydly-100 grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
        <div>
           <ShieldCheck size={28} className="text-fydly-400 mx-auto mb-3" />
           <h4 className="font-bold text-fydly-900 mb-1">Paiement sécurisé</h4>
           <p className="text-xs text-fydly-500 font-medium">Vos transactions sont traitées par Stripe. Nous ne stockons aucune donnée bancaire.</p>
        </div>
        <div>
           <CreditCard size={28} className="text-fydly-400 mx-auto mb-3" />
           <h4 className="font-bold text-fydly-900 mb-1">Sans engagement</h4>
           <p className="text-xs text-fydly-500 font-medium">Annulez votre abonnement Fydly à tout moment d'un simple clic.</p>
        </div>
        <div className="sm:col-span-2 md:col-span-1">
           <LayoutDashboard size={28} className="text-fydly-400 mx-auto mb-3" />
           <h4 className="font-bold text-fydly-900 mb-1">Mises à jour incluses</h4>
           <p className="text-xs text-fydly-500 font-medium">Toutes les nouvelles fonctionnalités de Fydly sont déployées gratuitement.</p>
        </div>
      </div>

    </div>
  )
}
