import { useState } from 'react'
import { Mail, MessageCircle, Clock, ChevronDown, HeartHandshake, ExternalLink } from 'lucide-react'

const FAQ = [
  {
    q: "Mes tampons ont disparu, que faire ?",
    a: "Vos tampons sont liés à votre compte. Reconnectez-vous avec le même email qu'au premier scan. Si le problème persiste, contactez-nous.",
  },
  {
    q: "Le QR code ne se scanne pas.",
    a: "Assurez-vous d'être bien chez le bon commerçant et que le QR code affiché est bien celui du jour. Si le problème continue, demandez au commerçant de rafraîchir son QR code depuis son dashboard.",
  },
  {
    q: "J'ai scanné mais mon tampon n'est pas apparu.",
    a: "Il faut attendre 60 minutes entre deux scans chez le même commerçant. Si c'est votre premier scan de la journée, contactez-nous avec une capture d'écran.",
  },
  {
    q: "Comment supprimer mon compte ?",
    a: "Rendez-vous dans Profil → Supprimer mon compte. Toutes vos données seront supprimées sous 48h conformément au RGPD.",
  },
  {
    q: "Ma récompense a expiré avant que je puisse l'utiliser.",
    a: "Les récompenses sont valables 30 jours. Si vous n'avez pas pu en profiter à cause d'un problème technique, contactez-nous, nous étudierons votre demande.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`bg-white rounded-card border transition-all duration-300 overflow-hidden shadow-card
      ${open ? 'border-fydly-200' : 'border-fydly-100'}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3 group"
        aria-expanded={open}
      >
        <span className={`font-semibold text-sm leading-snug flex-1 transition-colors duration-200
          ${open ? 'text-fydly-700' : 'text-fydly-900'}`}
        >
          {q}
        </span>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
          ${open ? 'bg-fydly-500 text-white rotate-180' : 'bg-fydly-50 text-fydly-300 group-hover:bg-fydly-100'}`}
        >
          <ChevronDown size={15} />
        </div>
      </button>

      {/* Corps de la réponse — animé */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out
        ${open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="px-5 pb-5 text-fydly-600 text-sm leading-relaxed border-t border-fydly-50 pt-3">
          {a}
        </p>
      </div>
    </div>
  )
}

export default function SupportPage() {
  return (
    <div className="space-y-7 pb-8 animate-fade-in">

      {/* ── Hero ── */}
      <div className="text-center pt-2 space-y-3">
        <div className="relative inline-block">
          <div className="w-18 h-18 w-[72px] h-[72px] bg-gradient-to-br from-fydly-400 to-fydly-600 rounded-[22px] flex items-center justify-center mx-auto shadow-lg shadow-fydly-500/30">
            <HeartHandshake size={32} className="text-white" />
          </div>
          {/* Pulse */}
          <div className="absolute inset-0 rounded-[22px] bg-fydly-500/20 animate-ping opacity-30 pointer-events-none" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-[28px] font-display text-fydly-900 leading-tight">
            Service client
          </h1>
          <p className="text-fydly-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Une question ou un problème&nbsp;? Notre équipe vous répond rapidement.
          </p>
        </div>
      </div>

      {/* ── Canaux de contact ── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold text-fydly-300 uppercase tracking-widest px-1">
          Nous contacter
        </p>

        <div className="space-y-2.5">
          {/* Email */}
          <a
            href="mailto:fydlypro@gmail.com?subject=Support Fydly"
            className="flex items-center gap-4 bg-white rounded-card px-5 py-4 shadow-card border border-fydly-100 active:scale-[0.98] hover:shadow-card-hover hover:border-fydly-200 transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-blue-50 rounded-[14px] flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <Mail size={20} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-fydly-900 font-bold text-sm">Email</p>
              <p className="text-fydly-400 text-xs font-medium mt-0.5 truncate">fydlypro@gmail.com</p>
            </div>
            <ExternalLink size={15} className="text-fydly-200 group-hover:text-fydly-400 transition-colors shrink-0" />
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/33789483883?text=Bonjour, j'ai une question concernant Fydly."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white rounded-card px-5 py-4 shadow-card border border-fydly-100 active:scale-[0.98] hover:shadow-card-hover hover:border-fydly-200 transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-green-50 rounded-[14px] flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
              <MessageCircle size={20} className="text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-fydly-900 font-bold text-sm">WhatsApp</p>
              <p className="text-fydly-400 text-xs font-medium mt-0.5">Réponse sous 24h en semaine</p>
            </div>
            <ExternalLink size={15} className="text-fydly-200 group-hover:text-fydly-400 transition-colors shrink-0" />
          </a>

          {/* Horaires */}
          <div className="flex items-center gap-4 bg-fydly-50 rounded-card px-5 py-4 border border-fydly-100/60">
            <div className="w-11 h-11 bg-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm">
              <Clock size={20} className="text-fydly-400" />
            </div>
            <div>
              <p className="text-fydly-700 font-bold text-sm">Horaires de support</p>
              <p className="text-fydly-400 text-xs font-medium mt-0.5">Lundi – Vendredi · 9h00 – 18h00</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold text-fydly-300 uppercase tracking-widest px-1">
          Questions fréquentes
        </p>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <p className="text-center text-fydly-200 text-xs font-medium pb-2">
        Fydly · Support client · v1.0
      </p>
    </div>
  )
}
