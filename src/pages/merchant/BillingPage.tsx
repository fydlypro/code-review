import { useState } from 'react'
import { CreditCard, CheckCircle2, Zap, LayoutDashboard, ShieldCheck, ArrowRight, AlertTriangle, Star, Check, Sparkles, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

// UI Components
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    description: 'Essentiel pour lancer votre programme de fidélité digital.',
    color: 'fydly',
    features: [
      "Jusqu'à 200 clients",
      '4 notifications push / mois',
      'QR code dynamique',
      'Dashboard temps réel',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'La solution complète pour engager vos clients au quotidien.',
    isPopular: true,
    color: 'fydly',
    features: [
      "Jusqu'à 1 000 clients",
      'Notifications push illimitées',
      'Statistiques détaillées',
      'Support prioritaire 7j/7',
      'Relances automatiques',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    description: 'Performance et puissance pour les commerces en pleine croissance.',
    color: 'fydly',
    features: [
      'Clients illimités',
      'Multi-établissements',
      'Accès API',
      'Accompagnement dédié',
      'Marque blanche logicielle',
    ],
  },
]

export default function BillingPage() {
  const { merchant } = useAuth()
  const toast = useToast()

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId)
    setTimeout(() => {
      toast.info(`Redirection vers Stripe Checkout...`)
      setLoadingPlan(null)
    }, 1500)
  }

  const handlePortal = async () => {
    setLoadingPortal(true)
    setTimeout(() => {
      toast.info('Ouverture du portail Stripe...')
      setLoadingPortal(false)
    }, 1000)
  }

  const calculateDaysLeft = () => {
    if (!merchant?.trial_ends_at) return 0
    const diff = new Date(merchant.trial_ends_at).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  const daysLeft = calculateDaysLeft()
  const isTrial = merchant?.subscription_status === 'trial'
  const isExpired = isTrial && daysLeft === 0

  const currentPlan = PLANS.find(p => p.id === 'starter')

  return (
    <div className="animate-fade-in pb-20 lg:pb-12 max-w-6xl mx-auto px-2 sm:px-0">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display text-fydly-900 leading-tight mb-1">Abonnement</h1>
          <p className="text-fydly-400 font-medium text-sm">Gérez votre plan et accédez aux avantages Fydly.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Badge plan actif */}
          {merchant?.subscription_status && merchant.subscription_status !== 'trial' && (
            <div className="hidden sm:flex items-center gap-2 bg-fydly-50 border border-fydly-100 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-fydly-700 uppercase tracking-widest">Plan actif</span>
              <span className="text-xs font-bold text-fydly-500">{currentPlan?.name || 'Starter'}</span>
            </div>
          )}
          {merchant?.subscription_status !== 'trial' && (
            <Button
              variant="secondary"
              onClick={handlePortal}
              disabled={loadingPortal}
              className="h-11 bg-white border-fydly-100 hover:border-fydly-300 text-sm shrink-0"
            >
              {loadingPortal ? <span className="spinner" /> : (
                <span className="flex items-center gap-2">
                  <CreditCard size={16} />
                  Gérer mon compte Stripe
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      {isExpired ? (
        <div className="mb-10 rounded-2xl bg-red-50 border border-red-200 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20">
            <AlertTriangle size={28} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-display text-fydly-900 mb-1">Période d'essai terminée</h2>
            <p className="text-fydly-600 font-medium text-sm leading-relaxed">
              Votre tableau de bord est repassé en lecture seule. Choisissez un plan ci-dessous pour réactiver votre programme et vos QR codes.
            </p>
          </div>
          <Button
            onClick={() => handleCheckout('pro')}
            className="h-11 px-8 shrink-0 text-sm bg-fydly-500 hover:bg-fydly-600 text-white border-none shadow-md shadow-fydly-500/20"
          >
            <span className="flex items-center gap-2">Choisir un plan <ArrowRight size={16} /></span>
          </Button>
        </div>
      ) : isTrial ? (
        <div className="mb-10 rounded-2xl bg-fydly-900 text-white p-7 sm:p-10 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -right-24 -bottom-24 w-72 h-72 bg-fydly-500/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-white/3 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-fydly-500/20 text-fydly-300 border border-fydly-500/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                  <Zap size={11} className="text-fydly-400 fill-current" />
                  Essai gratuit
                </span>
                <span className="text-fydly-400 font-medium text-xs">Accès complet débloqué</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display mb-3 leading-tight">
                Maximisez vos {daysLeft} jours restants
              </h2>
              <p className="text-fydly-300 font-medium text-sm sm:text-base max-w-md leading-relaxed">
                Votre test gratuit prend fin le{' '}
                <strong className="text-white">
                  {new Date(merchant.trial_ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </strong>
                . Choisissez votre plan dès maintenant pour une transition fluide.
              </p>
            </div>

            <div className="bg-white/8 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center min-w-[160px] shrink-0">
              <div className="text-5xl font-display mb-1 leading-none">{daysLeft}</div>
              <div className="text-[10px] font-bold text-fydly-400 uppercase tracking-[0.2em] mt-1">Jours restants</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Pricing Grid ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-lg font-display text-fydly-900 mb-1">Choisissez votre plan</h2>
          <p className="text-xs text-fydly-400 font-medium">Sans engagement · Résiliable à tout moment depuis Stripe</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-full">
          <CheckCircle2 size={13} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Paiement sécurisé Stripe</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 items-stretch mb-16">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col relative transition-all duration-300 overflow-hidden ${
              plan.isPopular
                ? 'border-2 border-fydly-500 shadow-2xl shadow-fydly-500/10 lg:scale-[1.02] z-10'
                : 'border border-fydly-100/70 hover:border-fydly-200 hover:shadow-card-hover shadow-card'
            }`}
          >
            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-fydly-500 to-fydly-600 text-white py-2.5 text-center text-[10px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-1.5">
                <Sparkles size={11} />
                RECOMMANDÉ PAR FYDLY
              </div>
            )}

            <div className={`p-6 sm:p-8 flex flex-col flex-1 ${plan.isPopular ? 'pt-14' : ''}`}>
              {/* Plan Name & Price */}
              <div className="mb-7">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-2xl text-fydly-900">{plan.name}</h3>
                      {plan.isPopular && (
                        <span className="inline-flex items-center gap-1 bg-fydly-500/10 text-fydly-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-fydly-200 uppercase tracking-widest">
                          <Star size={9} className="fill-current" /> Best-seller
                        </span>
                      )}
                    </div>
                    <p className="text-fydly-400 font-medium text-xs leading-relaxed max-w-[180px]">{plan.description}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mt-5 pb-5 border-b border-fydly-50">
                  <span className="text-5xl font-display text-fydly-900 leading-none">{plan.price}€</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest leading-tight">/ mois</span>
                    <span className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest leading-tight">HT</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3.5 flex-1 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-fydly-700 font-medium">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      plan.isPopular
                        ? 'bg-fydly-500 text-white'
                        : 'bg-fydly-100 text-fydly-500'
                    }`}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span className={plan.isPopular ? 'text-fydly-900 font-semibold' : ''}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan !== null}
                className={`w-full h-13 py-3.5 rounded-xl text-base font-bold transition-all active:scale-95 ${
                  plan.isPopular
                    ? 'bg-fydly-500 text-white hover:bg-fydly-600 shadow-lg shadow-fydly-500/25 border-none'
                    : 'bg-fydly-900 text-white hover:bg-fydly-700 border-none'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <span className="spinner border-white" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Activer le plan {plan.name}
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
              {plan.isPopular && (
                <p className="text-center text-[10px] text-fydly-400 font-medium mt-3">
                  30 jours satisfait ou remboursé
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Reassurance Footer ── */}
      <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 pt-10 border-t border-fydly-50">
        {[
          {
            icon: ShieldCheck,
            title: 'Paiement 100% sécurisé',
            text: "Vos transactions sont chiffrées et traitées par Stripe. Nous n'avons jamais accès à vos coordonnées bancaires.",
          },
          {
            icon: CreditCard,
            title: 'Zéro engagement',
            text: "Résiliez à tout moment depuis votre portail Stripe, sans frais ni préavis. Vous gardez le contrôle.",
          },
          {
            icon: TrendingUp,
            title: 'Technologie évolutive',
            text: "Bénéficiez de toutes les mises à jour et nouvelles fonctionnalités sans surcoût. Votre outil s'améliore chaque semaine.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-fydly-50 rounded-xl flex items-center justify-center text-fydly-400">
              <Icon size={24} />
            </div>
            <div>
              <h4 className="font-display text-lg text-fydly-900 mb-1">{title}</h4>
              <p className="text-xs text-fydly-400 font-medium leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
