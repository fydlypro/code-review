import { useState } from 'react'
import { Check, AlertTriangle, CreditCard } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { redirectToCheckout, redirectToCustomerPortal } from '../../lib/stripe'

type PlanSection = { sectionTitle: string }
type PlanItem = string | PlanSection

const PRO_FEATURES: PlanItem[] = [
  { sectionTitle: 'Plateforme' },
  '1 établissement',
  'Clients illimités',
  'QR code du jour — rotation automatique',
  'Tampons et points illimités',
  'Notifications push illimitées',
  'Segmentation clients (actifs / inactifs / VIP)',
  'Analytics complets (heatmap, évolution, heures d\'affluence)',
  'Recommandations IA automatiques',
  'Rapport mensuel par email',
  'Export CSV clients',
  'Récompenses automatiques',
  'Score de fidélité Fydly',
  'Historique des actions',
  { sectionTitle: 'Accompagnement' },
  'Documentation complète en français',
  'Tutoriels vidéo pas à pas',
  'Support email — réponse sous 48h',
]

const BUSINESS_FEATURES: PlanItem[] = [
  { sectionTitle: 'Tout le plan Pro inclus' },
  'Jusqu\'à 5 établissements',
  'Dashboard centralisé multi-sites',
  'Statistiques consolidées tous établissements',
  'QR code unique par établissement',
  'Notifications ciblées par établissement',
  'Clients partagés entre établissements',
  'Analyse comparative entre commerces',
  'API accès',
  'Export avancé (Excel, CSV, JSON)',
  'Personnalisation couleurs et logo du programme',
  'Tableau de bord équipe (3 utilisateurs max)',
  'Accès anticipé nouvelles fonctionnalités',
  { sectionTitle: 'Accompagnement personnalisé' },
  'Appel de lancement en visio 1h avec Mathys',
  'Audit mensuel du programme 30min/mois',
  'Conseils stratégiques personnalisés',
  'Rédaction des messages de notification par Mathys',
  'Recommandations sur offres et récompenses',
  'Rapport mensuel commenté par Mathys',
  'Formation équipes si nécessaire',
]

export default function BillingPage() {
  const { merchant } = useAuth()
  const toast = useToast()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const daysLeft = (() => {
    if (!merchant?.trial_ends_at) return 0
    const diff = new Date(merchant.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  })()

  const trialEndDate = merchant?.trial_ends_at
    ? new Date(merchant.trial_ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const isTrial = merchant?.subscription_status === 'trial'
  const isExpired = merchant?.subscription_status === 'expired' || merchant?.subscription_status === 'cancelled'
  const hasActivePlan = merchant?.subscription_status === 'pro' || merchant?.subscription_status === 'business'

  const handleCheckout = async (planId: string) => {
    if (!merchant?.id) return
    setLoadingPlan(planId)
    const { error } = await redirectToCheckout(merchant.id, planId)
    if (error) {
      toast.error(error)
      setLoadingPlan(null)
    }
  }

  const handlePortal = async () => {
    if (!merchant?.id) return
    setLoadingPortal(true)
    const { error } = await redirectToCustomerPortal(merchant.id)
    if (error) {
      toast.error(error)
      setLoadingPortal(false)
    }
  }

  return (
    <div className="animate-fade-in pb-24 lg:pb-12 bg-slate-50 min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-display text-slate-900 mb-2">
            Choisissez votre plan
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base">
            30 jours gratuits sur tous les plans. Sans carte bancaire. Sans engagement.
          </p>
        </div>

        {/* ── Gestion abonnement actif ── */}
        {hasActivePlan && (
          <div className="mb-8 p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  Plan {merchant?.subscription_status === 'business' ? 'Business' : 'Pro'} actif
                </p>
                <p className="text-slate-400 text-xs font-medium">Abonnement en cours</p>
              </div>
            </div>
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-fydly-50 border border-fydly-100 rounded-xl text-fydly-700 font-semibold text-sm hover:bg-fydly-100 transition-colors disabled:opacity-60 w-full sm:w-auto justify-center"
            >
              <CreditCard size={15} />
              {loadingPortal ? 'Chargement...' : 'Gérer mon abonnement'}
            </button>
          </div>
        )}

        {/* ── Bannière Trial ── */}
        {isTrial && daysLeft > 0 && (
          <div className="mb-8 bg-fydly-50 border border-fydly-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-2xl">🎉</span>
            <p className="text-slate-700 font-medium text-sm leading-relaxed">
              Vous êtes en <strong>période d'essai gratuite</strong>. Il vous reste{' '}
              <strong>{daysLeft} jour{daysLeft > 1 ? 's' : ''}</strong>. Choisissez votre plan avant
              le <strong>{trialEndDate}</strong> pour ne pas perdre vos données.
            </p>
          </div>
        )}

        {/* ── Bannière Expiré / Annulé ── */}
        {isExpired && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
            <AlertTriangle size={24} className="text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-red-900 font-semibold text-sm mb-0.5">
                Votre période d'essai est terminée.
              </p>
              <p className="text-red-700 text-sm">
                Choisissez un plan pour continuer à fidéliser vos clients.
              </p>
            </div>
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loadingPlan !== null}
              className="shrink-0 px-5 py-2.5 min-h-[44px] rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60 w-full sm:w-auto"
            >
              {loadingPlan === 'pro' ? 'Chargement...' : 'Réactiver mon compte'}
            </button>
          </div>
        )}

        {/* ── Cards Plans ── */}
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 mb-10">

          {/* ── Plan Pro ── */}
          <div className="bg-white flex flex-col rounded-2xl overflow-hidden shadow-card border border-slate-100">
            <div className="py-2.5 text-center text-white text-xs font-bold uppercase tracking-widest bg-fydly-500">
              Le plus populaire
            </div>

            <div className="p-5 sm:p-8 flex flex-col flex-1">
              <div className="mb-6">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl sm:text-4xl font-display text-slate-900 leading-none">59,99€</span>
                  <span className="text-sm font-semibold text-slate-400">/mois</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm">Puis 59,99€/mois sans engagement</p>
              </div>

              <hr className="border-slate-100 mb-6" />

              <ul className="flex-1 mb-8 space-y-0">
                {PRO_FEATURES.map((item, i) =>
                  typeof item !== 'string' ? (
                    <li key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-5 mb-2 first:mt-0">
                      {item.sectionTitle}
                    </li>
                  ) : (
                    <li key={i} className="flex items-center gap-3 py-1.5">
                      <div className="w-5 h-5 rounded-full bg-fydly-500 flex items-center justify-center shrink-0">
                        <Check size={11} strokeWidth={3} className="text-white" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{item}</span>
                    </li>
                  )
                )}
              </ul>

              <button
                onClick={() => handleCheckout('pro')}
                disabled={loadingPlan !== null}
                className="w-full py-3.5 min-h-[48px] rounded-xl text-white font-bold text-base bg-fydly-500 hover:bg-fydly-600 transition-all active:scale-95 disabled:opacity-60"
              >
                {loadingPlan === 'pro' ? 'Chargement...' : 'Démarrer 30 jours gratuits'}
              </button>
            </div>
          </div>

          {/* ── Plan Business ── */}
          <div className="bg-white flex flex-col rounded-2xl overflow-hidden shadow-card border border-slate-100">
            <div className="py-2.5 text-center text-white text-xs font-bold uppercase tracking-widest bg-slate-900">
              Accompagnement personnalisé
            </div>

            <div className="p-5 sm:p-8 flex flex-col flex-1">
              <div className="mb-6">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl sm:text-4xl font-display text-slate-900 leading-none">109,99€</span>
                  <span className="text-sm font-semibold text-slate-400">/mois</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm">Puis 109,99€/mois sans engagement</p>
              </div>

              <hr className="border-slate-100 mb-6" />

              <ul className="flex-1 mb-6 space-y-0">
                {BUSINESS_FEATURES.map((item, i) => {
                  if (typeof item !== 'string') {
                    const isPersonal = item.sectionTitle === 'Accompagnement personnalisé'
                    return (
                      <li
                        key={i}
                        className={`text-[10px] font-bold uppercase tracking-widest mt-5 mb-2 first:mt-0 ${
                          isPersonal ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {item.sectionTitle}
                        {isPersonal && (
                          <span className="ml-2 text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded-full normal-case tracking-normal font-semibold">
                            La vraie différence
                          </span>
                        )}
                      </li>
                    )
                  }

                  const personalSectionIdx = BUSINESS_FEATURES.findIndex(
                    f => typeof f !== 'string' && f.sectionTitle === 'Accompagnement personnalisé'
                  )
                  const isPersonalItem = i > personalSectionIdx

                  return (
                    <li key={i} className="flex items-center gap-3 py-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isPersonalItem ? 'bg-slate-900' : 'bg-slate-200'
                      }`}>
                        <Check size={11} strokeWidth={3} className="text-white" />
                      </div>
                      <span className={`text-sm font-medium ${isPersonalItem ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                        {item}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="bg-fydly-50 border border-fydly-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">✉️</span>
                <p className="text-slate-700 text-sm font-semibold leading-snug">
                  Accès WhatsApp direct avec Mathys, fondateur de Fydly.{' '}
                  <span className="font-bold text-fydly-600">
                    Réponse garantie sous 4h.
                  </span>
                </p>
              </div>

              <button
                onClick={() => handleCheckout('business')}
                disabled={loadingPlan !== null}
                className="w-full py-3.5 min-h-[48px] rounded-xl text-white font-bold text-base bg-slate-900 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60"
              >
                {loadingPlan === 'business' ? 'Chargement...' : 'Démarrer 30 jours gratuits'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Badges réassurance ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
          {[
            { emoji: '🔒', text: 'Sans carte bancaire pendant 30 jours' },
            { emoji: '↩️', text: 'Résiliable à tout moment' },
            { emoji: '🇫🇷', text: 'Support en français' },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
              <span className="text-base">{emoji}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
