import { useState } from 'react'
import { Mail, MessageCircle, Clock, ChevronRight, LifeBuoy, BookOpen, ExternalLink, ChevronDown } from 'lucide-react'
import Card from '../../components/ui/Card'

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
    q: "Comment exporter la liste de mes clients ?",
    a: "Dans la section Clients, utilisez le bouton « Exporter CSV » en haut à droite. Vous obtiendrez un fichier avec prénom, email, téléphone, tampons et date d'inscription.",
  },
  {
    q: "Les notifications push ne sont pas envoyées.",
    a: "Les notifications nécessitent que vos clients aient accepté les notifications lors de leur inscription. Assurez-vous que votre OneSignal App ID est bien configuré. Contactez-nous si le problème persiste.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${open ? 'border-fydly-200 shadow-card' : 'border-fydly-100 shadow-sm'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-fydly-50/40 transition-colors"
      >
        <span className={`font-semibold text-sm leading-snug flex-1 transition-colors ${open ? 'text-fydly-900' : 'text-fydly-700'}`}>
          {q}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${open ? 'bg-fydly-500 text-white' : 'bg-fydly-50 text-fydly-400'}`}>
          <ChevronDown size={15} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-fydly-50">
          <p className="text-fydly-600 text-sm leading-relaxed font-medium">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function MerchantSupportPage() {
  return (
    <div className="animate-fade-in pb-16 max-w-2xl mx-auto px-2 sm:px-0">

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-fydly-500 rounded-xl flex items-center justify-center shadow-lg shadow-fydly-500/25 shrink-0">
          <LifeBuoy size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-display text-fydly-900 leading-tight">Support</h1>
          <p className="text-fydly-400 font-medium text-sm mt-0.5">
            Une question ou un problème technique ? On est là pour vous.
          </p>
        </div>
      </div>

      {/* ── Contact Section ── */}
      <section className="mb-10">
        <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest mb-3">
          Nous contacter
        </p>

        <div className="space-y-3">
          {/* Email */}
          <a
            href="mailto:fydlypro@gmail.com?subject=Support commerçant Fydly"
            className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-card border border-fydly-100 hover:border-fydly-300 hover:shadow-card-hover active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-fydly-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-fydly-100 transition-colors">
              <Mail size={20} className="text-fydly-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-fydly-900 font-bold text-sm">Email</p>
              <p className="text-fydly-400 text-xs font-medium mt-0.5 truncate">fydlypro@gmail.com</p>
            </div>
            <div className="flex items-center gap-1.5 text-fydly-300 group-hover:text-fydly-500 transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Écrire</span>
              <ChevronRight size={15} />
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/33789483883?text=Bonjour, je suis commerçant sur Fydly et j'ai une question."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-card border border-fydly-100 hover:border-green-200 hover:shadow-card-hover active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
              <MessageCircle size={20} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-fydly-900 font-bold text-sm">WhatsApp</p>
                <span className="inline-block bg-green-50 text-green-700 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-green-100">
                  Prioritaire
                </span>
              </div>
              <p className="text-fydly-400 text-xs font-medium mt-0.5">Réponse rapide pour les commerçants</p>
            </div>
            <div className="flex items-center gap-1.5 text-fydly-300 group-hover:text-green-500 transition-colors">
              <ExternalLink size={14} />
            </div>
          </a>

          {/* Hours */}
          <div className="flex items-center gap-4 bg-fydly-50/60 rounded-2xl px-5 py-4 border border-fydly-100">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Clock size={20} className="text-fydly-400" />
            </div>
            <div>
              <p className="text-fydly-700 font-bold text-sm">Horaires de support</p>
              <p className="text-fydly-400 text-xs font-medium mt-0.5">
                Lun – Ven · 9h – 18h · Réponse sous 4h ouvrées
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Documentation Card ── */}
      <section className="mb-10">
        <Card className="border border-fydly-100/70 shadow-card bg-fydly-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-fydly-500/15 rounded-full blur-[50px] pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4 p-5">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-fydly-300" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Documentation complète</p>
              <p className="text-fydly-400 text-xs font-medium mt-0.5">Guides, tutoriels et références API Fydly</p>
            </div>
            <a
              href="https://docs.fydly.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-fydly-500 hover:bg-fydly-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              Accéder
              <ExternalLink size={13} />
            </a>
          </div>
        </Card>
      </section>

      {/* ── FAQ Section ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={13} className="text-fydly-400" />
          <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest">
            Questions fréquentes
          </p>
        </div>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <p className="text-center text-fydly-300 text-xs font-medium pt-12">
        Fydly · Support commerçant · v1.0
      </p>
    </div>
  )
}
