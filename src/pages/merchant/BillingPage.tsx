import { useState } from 'react'
import { Check, AlertTriangle, CreditCard, Download, Zap, BarChart2, Bell } from 'lucide-react'
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

// Faux historique de paiements pour la démo
const FAKE_INVOICES = [
  { date: '01 mai 2026', amount: '59,99€', status: 'payé', id: 'INV-2026-05' },
  { date: '01 avr. 2026', amount: '59,99€', status: 'payé', id: 'INV-2026-04' },
  { date: '01 mars 2026', amount: '59,99€', status: 'payé', id: 'INV-2026-03' },
]

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number | null; color: string }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  const isUnlimited = max === null
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs font-bold text-slate-400">
          {isUnlimited ? `${value.toLocaleString('fr-FR')} / ∞` : `${value.toLocaleString('fr-FR')} / ${max?.toLocaleString('fr-FR')}`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        {isUnlimited ? (
          <div className="h-full w-full rounded-full opacity-30" style={{ background: color }} />
        ) : (
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        )}
      </div>
      {!isUnlimited && pct > 80 && (
        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
          {Math.round(pct)}% utilisé — bientôt à la limite
        </p>
      )}
    </div>
  )
}

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
  const isBusiness = merchant?.subscription_status === 'business'

  const handleCheckout = async (planId: string) => {
    if (!merchant?.id) return
    setLoadingPlan(planId)
    const { error } = await redirectToCheckout(merchant.id, planId)
    if (error) { toast.error(error); setLoadingPlan(null) }
  }

  const handlePortal = async () => {
    if (!merchant?.id) return
    setLoadingPortal(true)
    const { error } = await redirectToCustomerPortal(merchant.id)
    if (error) { toast.error(error); setLoadingPortal(false) }
  }

  return (
    <div className="animate-fade-in pb-24 lg:pb-12 space-y-6 sm:space-y-8">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display text-slate-900 leading-tight mb-1">Abonnement</h1>
        <p className="text-slate-400 font-medium text-sm">Gérez votre plan et consultez vos factures.</p>
      </div>

      {/* ── BANNIÈRE TRIAL ── */}
      {isTrial && daysLeft > 0 && (
        <div className="p-4 sm:p-5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="text-2xl">🎉</span>
          <p className="text-slate-700 font-medium text-sm leading-relaxed flex-1">
            Vous êtes en <strong>période d'essai gratuite</strong>. Il vous reste{' '}
            <strong className="text-fydly-600">{daysLeft} jour{daysLeft > 1 ? 's' : ''}</strong>. Choisissez votre plan avant le{' '}
            <strong>{trialEndDate}</strong> pour ne pas perdre vos données.
          </p>
        </div>
      )}

      {/* ── BANNIÈRE EXPIRÉ ── */}
      {isExpired && (
        <div className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
          <AlertTriangle size={22} className="text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-red-900 font-semibold text-sm mb-0.5">Votre période d'essai est terminée.</p>
            <p className="text-red-700 text-sm">Choisissez un plan pour continuer à fidéliser vos clients.</p>
          </div>
          <button
            onClick={() => handleCheckout('pro')}
            disabled={loadingPlan !== null}
            className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60 w-full sm:w-auto"
            style={{ minHeight: 44 }}
          >
            {loadingPlan === 'pro' ? 'Chargement...' : 'Réactiver mon compte'}
          </button>
        </div>
      )}

      {/* ── PLAN ACTIF (si abonné) ── */}
      {hasActivePlan && (
        <div className="p-6 sm:p-8 relative overflow-hidden" style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
          border: '2px solid',
          borderColor: '#BFDBFE',
        }}>
          {/* Glow déco */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08), transparent)' }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                  <Zap size={11} /> Plan {isBusiness ? 'Business' : 'Pro'} actif
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Actif
                </span>
              </div>
              <p className="text-2xl font-display text-slate-900 mb-1">{isBusiness ? '109,99€' : '59,99€'}<span className="text-sm font-semibold text-slate-400">/mois</span></p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Clients illimités', 'Push illimités', 'Analytics complets'].map(f => (
                  <span key={f} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    <Check size={9} className="text-fydly-500" /> {f}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-fydly-700 bg-white border border-fydly-200 hover:border-fydly-400 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-60 w-full sm:w-auto justify-center shadow-sm"
              style={{ minHeight: 44 }}
            >
              <CreditCard size={15} />
              {loadingPortal ? 'Chargement...' : 'Gérer mon abonnement'}
            </button>
          </div>
        </div>
      )}

      {/* ── USAGE ── */}
      {hasActivePlan && (
        <div className="bg-white shadow-card p-6 sm:p-8" style={{ borderRadius: 20 }}>
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
            <BarChart2 size={16} className="text-fydly-500" />
            <h2 className="font-display text-slate-900 text-base">Utilisation ce mois</h2>
          </div>
          <div className="space-y-6">
            <ProgressBar label="Clients actifs" value={247} max={isBusiness ? null : 500} color="linear-gradient(90deg, #2563EB, #7C3AED)" />
            <ProgressBar label="Tampons distribués" value={1482} max={null} color="linear-gradient(90deg, #10B981, #059669)" />
            <ProgressBar label="Campagnes push envoyées" value={12} max={isBusiness ? null : 20} color="linear-gradient(90deg, #F59E0B, #D97706)" />
          </div>
        </div>
      )}

      {/* ── PLANS (si pas encore abonné) ── */}
      {!hasActivePlan && (
        <>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-display text-slate-900 mb-2">Choisissez votre plan</h2>
            <p className="text-slate-500 font-medium text-sm">30 jours gratuits sur tous les plans. Sans carte bancaire. Sans engagement.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Plan Pro */}
            <div className="bg-white flex flex-col overflow-hidden shadow-card border border-slate-100" style={{ borderRadius: 20 }}>
              <div className="py-2.5 text-center text-white text-xs font-bold uppercase tracking-widest" style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}>
                Le plus populaire
              </div>
              <div className="p-5 sm:p-8 flex flex-col flex-1">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl sm:text-4xl font-display text-slate-900 leading-none">59,99€</span>
                    <span className="text-sm font-semibold text-slate-400">/mois</span>
                  </div>
                  <p className="text-slate-400 text-xs">Puis 59,99€/mois sans engagement</p>
                </div>
                <hr className="border-slate-100 mb-6" />
                <ul className="flex-1 mb-8 space-y-0">
                  {PRO_FEATURES.map((item, i) =>
                    typeof item !== 'string' ? (
                      <li key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-5 mb-2 first:mt-0">{item.sectionTitle}</li>
                    ) : (
                      <li key={i} className="flex items-center gap-3 py-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                          <Check size={10} strokeWidth={3} className="text-white" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{item}</span>
                      </li>
                    )
                  )}
                </ul>
                <button
                  onClick={() => handleCheckout('pro')}
                  disabled={loadingPlan !== null}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', minHeight: 52 }}
                >
                  {loadingPlan === 'pro' ? 'Chargement...' : 'Démarrer 30 jours gratuits'}
                </button>
              </div>
            </div>

            {/* Plan Business */}
            <div className="bg-white flex flex-col overflow-hidden shadow-card border border-slate-100" style={{ borderRadius: 20 }}>
              <div className="py-2.5 text-center text-white text-xs font-bold uppercase tracking-widest bg-slate-900">
                Accompagnement personnalisé
              </div>
              <div className="p-5 sm:p-8 flex flex-col flex-1">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl sm:text-4xl font-display text-slate-900 leading-none">109,99€</span>
                    <span className="text-sm font-semibold text-slate-400">/mois</span>
                  </div>
                  <p className="text-slate-400 text-xs">Puis 109,99€/mois sans engagement</p>
                </div>
                <hr className="border-slate-100 mb-6" />
                <ul className="flex-1 mb-6 space-y-0">
                  {BUSINESS_FEATURES.map((item, i) => {
                    if (typeof item !== 'string') {
                      const isPersonal = item.sectionTitle === 'Accompagnement personnalisé'
                      return (
                        <li key={i} className={`text-[10px] font-bold uppercase tracking-widest mt-5 mb-2 first:mt-0 ${isPersonal ? 'text-slate-900' : 'text-slate-400'}`}>
                          {item.sectionTitle}
                          {isPersonal && (
                            <span className="ml-2 text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded-full normal-case tracking-normal font-semibold">
                              La vraie différence
                            </span>
                          )}
                        </li>
                      )
                    }
                    const personalIdx = BUSINESS_FEATURES.findIndex(f => typeof f !== 'string' && f.sectionTitle === 'Accompagnement personnalisé')
                    const isPersonalItem = i > personalIdx
                    return (
                      <li key={i} className="flex items-center gap-3 py-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isPersonalItem ? 'bg-slate-900' : 'bg-slate-200'}`}>
                          <Check size={10} strokeWidth={3} className="text-white" />
                        </div>
                        <span className={`text-sm font-medium ${isPersonalItem ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{item}</span>
                      </li>
                    )
                  })}
                </ul>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex items-start gap-3">
                  <span className="text-xl shrink-0">✉️</span>
                  <p className="text-slate-700 text-sm font-semibold leading-snug">
                    Accès WhatsApp direct avec Mathys, fondateur de Fydly.{' '}
                    <span className="font-bold text-fydly-600">Réponse garantie sous 4h.</span>
                  </p>
                </div>
                <button
                  onClick={() => handleCheckout('business')}
                  disabled={loadingPlan !== null}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-base bg-slate-900 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60"
                  style={{ minHeight: 52 }}
                >
                  {loadingPlan === 'business' ? 'Chargement...' : 'Démarrer 30 jours gratuits'}
                </button>
              </div>
            </div>
          </div>

          {/* Réassurance */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {[
              { emoji: '🔒', text: 'Sans carte bancaire pendant 30 jours' },
              { emoji: '↩️', text: 'Résiliable à tout moment' },
              { emoji: '🇫🇷', text: 'Support en français' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                <span>{emoji}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── HISTORIQUE PAIEMENTS ── */}
      {hasActivePlan && (
        <div className="bg-white shadow-card overflow-hidden" style={{ borderRadius: 20 }}>
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <CreditCard size={16} className="text-slate-400" />
            <h2 className="font-display text-slate-900 text-base">Historique des paiements</h2>
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Montant</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {FAKE_INVOICES.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{inv.date}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{inv.amount}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Payé
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toast.info('Téléchargement disponible bientôt')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-fydly-500 hover:text-fydly-700 transition-colors"
                      >
                        <Download size={13} />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-slate-50">
            {FAKE_INVOICES.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-5">
                <div>
                  <div className="text-sm font-bold text-slate-900">{inv.amount}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{inv.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Payé
                  </span>
                  <button onClick={() => toast.info('Bientôt disponible')} className="text-fydly-500">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
