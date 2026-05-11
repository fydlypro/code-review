import { useState } from 'react'
import { Mail, MessageCircle, Clock, ChevronDown, BookOpen, ExternalLink, Video, LifeBuoy } from 'lucide-react'

const FAQ = [
  {
    q: "Mon QR code du jour n'apparaît pas.",
    a: "Le QR code est généré automatiquement chaque jour à 00h00 UTC. Si rien n'apparaît, rafraîchissez la page. Si le problème persiste, contactez-nous — nous le régénérerons manuellement.",
  },
  {
    q: "Un client dit ne pas avoir reçu son tampon après le scan.",
    a: "Vérifiez que le client a bien scanné le bon QR code du jour et qu'il n'a pas déjà scanné dans l'heure précédente (anti-fraude : 1 scan max / heure / client). Si tout semble correct, contactez-nous avec l'email du client.",
  },
  {
    q: "Comment valider la récompense d'un client ?",
    a: "Depuis votre tableau de bord, cliquez sur « Valider une récompense », puis scannez le QR code affiché sur le téléphone de votre client. La carte se remet à zéro automatiquement.",
  },
  {
    q: "Comment modifier le seuil ou la description de ma récompense ?",
    a: "Rendez-vous dans Paramètres → Programme de fidélité. Vous pouvez modifier le nombre de tampons requis et la description de la récompense à tout moment.",
  },
  {
    q: "Ma période d'essai est terminée, comment m'abonner ?",
    a: "Allez dans Abonnement et choisissez le plan qui correspond à votre activité. Le paiement est sécurisé via Stripe. Votre abonnement est actif immédiatement après le paiement.",
  },
  {
    q: "Comment envoyer une campagne push à mes clients ?",
    a: "Dans la section Campagnes, rédigez votre message, choisissez votre audience (Tous, Actifs, Inactifs, Premium), puis cliquez sur Envoyer. Les notifications sont délivrées via OneSignal.",
  },
  {
    q: "Les notifications push ne sont pas envoyées.",
    a: "Les notifications nécessitent que vos clients aient accepté les notifications lors de leur inscription. Assurez-vous que votre OneSignal App ID est bien configuré. Contactez-nous si le problème persiste.",
  },
]

const QUICK_ACTIONS = [
  {
    icon: BookOpen,
    label: 'Documentation',
    desc: 'Guides complets et références',
    href: 'https://docs.fydly.fr',
    external: true,
    color: 'bg-blue-50 text-fydly-500',
    hoverBorder: 'hover:border-fydly-200',
  },
  {
    icon: MessageCircle,
    label: 'Chat WhatsApp',
    desc: 'Réponse prioritaire sous 4h',
    href: 'https://wa.me/33789483883?text=Bonjour, je suis commerçant sur Fydly et j\'ai une question.',
    external: true,
    color: 'bg-emerald-50 text-emerald-600',
    hoverBorder: 'hover:border-emerald-200',
  },
  {
    icon: Video,
    label: 'Tutoriels vidéo',
    desc: 'Prise en main pas à pas',
    href: 'https://docs.fydly.fr/tutorials',
    external: true,
    color: 'bg-violet-50 text-violet-600',
    hoverBorder: 'hover:border-violet-200',
  },
  {
    icon: Mail,
    label: 'Email support',
    desc: 'fydlypro@gmail.com',
    href: 'mailto:fydlypro@gmail.com?subject=Support commerçant Fydly',
    external: false,
    color: 'bg-amber-50 text-amber-600',
    hoverBorder: 'hover:border-amber-200',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`bg-white border transition-all duration-200 overflow-hidden ${open ? 'border-fydly-200 shadow-card' : 'border-slate-100 shadow-sm'}`} style={{ borderRadius: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-slate-50/60 transition-colors"
      >
        <span className={`font-semibold text-sm leading-snug flex-1 transition-colors ${open ? 'text-slate-900' : 'text-slate-700'}`}>
          {q}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${open ? 'bg-fydly-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          <p className="text-slate-500 text-sm leading-relaxed font-medium">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function MerchantSupportPage() {
  return (
    <div className="animate-fade-in pb-16 max-w-2xl mx-auto space-y-8">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <LifeBuoy size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-slate-900 leading-tight">Support</h1>
          <p className="text-slate-400 font-medium text-sm mt-0.5">Une question ou un problème ? On est là.</p>
        </div>
      </div>

      {/* ── QUICK ACTIONS GRILLE 2×2 ── */}
      <section>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Accès rapide</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon
            return (
              <a
                key={action.label}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
                className={`flex flex-col gap-3 bg-white p-5 border border-slate-100 ${action.hoverBorder} shadow-sm hover:shadow-card transition-all active:scale-[0.97] group`}
                style={{ borderRadius: 20 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                  <Icon size={19} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{action.label}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 leading-snug">{action.desc}</p>
                </div>
                {action.external && (
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-auto self-end" />
                )}
              </a>
            )
          })}
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={13} className="text-slate-400" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions fréquentes</p>
        </div>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── CARD CONTACT GRADIENT DARK ── */}
      <section>
        <div className="relative overflow-hidden text-white p-6 sm:p-8" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)' }}>
          {/* Déco */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent)' }} />
          <div className="absolute -left-6 -top-6 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Mail size={18} className="text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Contacter le support</h3>
                <p className="text-white/50 text-xs font-medium">Réponse garantie sous 4h ouvrées</p>
              </div>
            </div>

            <p className="text-white/70 text-sm font-medium leading-relaxed mb-5">
              Notre équipe est disponible du lundi au vendredi, 9h–18h. Pour les urgences, utilisez WhatsApp — nous répondons plus vite.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:support@fydly.app?subject=Support commerçant Fydly"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white border border-white/20 hover:bg-white/10 transition-all"
                style={{ minHeight: 44 }}
              >
                <Mail size={15} />
                support@fydly.app
              </a>
              <a
                href="https://wa.me/33789483883?text=Bonjour, je suis commerçant sur Fydly."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-slate-900 bg-white hover:bg-slate-100 transition-all"
                style={{ minHeight: 44 }}
              >
                <MessageCircle size={15} className="text-emerald-600" />
                WhatsApp prioritaire
              </a>
            </div>

            <div className="mt-4 flex items-center gap-2 text-white/30 text-xs font-medium">
              <Clock size={12} />
              Lun – Ven · 9h – 18h
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <p className="text-center text-slate-300 text-xs font-medium pt-4">
        Fydly · Support commerçant · v2.0
      </p>
    </div>
  )
}
