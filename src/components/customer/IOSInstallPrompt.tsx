import { useEffect, useState } from 'react'
import { X, ArrowUpFromLine, Plus, Share2 } from 'lucide-react'

// ============================================================
// FYDLY — Guide d'installation iOS
//
// Sur iOS/Safari, on ne peut pas déclencher le prompt natif.
// On guide l'utilisateur avec un bottom sheet step-by-step.
// Affiché une seule fois (localStorage), décalé de 2s pour
// ne pas bloquer le chargement initial.
// ============================================================

const STORAGE_KEY = 'fydly_ios_prompt_shown'

function isIOSSafari(): boolean {
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  // Exclure Chrome/Firefox sur iOS (pas de Share button au même endroit)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios/i.test(ua)
  return isIOS && isSafari
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  )
}

export default function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    // Ne montrer que si : iOS Safari + pas déjà installé + pas déjà affiché
    if (!isIOSSafari() || isStandalone()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    // Délai de 2.5s pour ne pas interrompre l'arrivée sur la page
    const timer = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = (permanent = true) => {
    setClosing(true)
    if (permanent) localStorage.setItem(STORAGE_KEY, 'true')
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={() => dismiss(false)}
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 inset-x-0 z-[61] transition-transform duration-300 ease-out ${closing ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div className="bg-white rounded-t-[32px] mx-0 pb-safe shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
             style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-fydly-100 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pt-3 pb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-fydly-500 rounded-2xl flex items-center justify-center shadow-lg shadow-fydly-500/30">
                <span className="text-white text-xl font-display font-bold">F</span>
              </div>
              <div>
                <h2 className="text-lg font-display text-fydly-900 leading-tight">Installer Fydly</h2>
                <p className="text-fydly-500 text-xs font-medium">Accès rapide + notifications</p>
              </div>
            </div>
            <button
              onClick={() => dismiss(false)}
              className="w-8 h-8 rounded-full bg-fydly-50 flex items-center justify-center text-fydly-400 active:scale-90 transition-transform mt-0.5"
            >
              <X size={16} />
            </button>
          </div>

          {/* Steps */}
          <div className="px-6 space-y-4">
            <Step
              number={1}
              icon={<ArrowUpFromLine size={18} className="text-fydly-500" />}
              title="Appuyez sur Partager"
              description={
                <>
                  Touchez le bouton{' '}
                  <span className="inline-flex items-center gap-0.5 bg-fydly-50 px-1.5 py-0.5 rounded-lg border border-fydly-100">
                    <Share2 size={12} className="text-fydly-500" />
                    <span className="text-fydly-700 font-bold text-xs">Partager</span>
                  </span>{' '}
                  en bas de Safari
                </>
              }
            />

            <Step
              number={2}
              icon={<Plus size={18} className="text-fydly-500" />}
              title={`Appuyez sur "Sur l'écran d'accueil"`}
              description={`Faites défiler le menu et choisissez "Sur l'écran d'accueil"`}
            />

            <Step
              number={3}
              icon={
                <span className="text-fydly-500 font-bold text-sm">✓</span>
              }
              title='Appuyez sur "Ajouter"'
              description="Fydly apparaît sur votre écran d'accueil comme une vraie app"
            />
          </div>

          {/* Safari toolbar illustration */}
          <SafariToolbarHint />

          {/* Actions */}
          <div className="px-6 pt-5 flex gap-3">
            <button
              onClick={() => dismiss(true)}
              className="flex-1 h-12 rounded-2xl border border-fydly-100 text-fydly-500 font-bold text-sm active:scale-95 transition-transform"
            >
              Plus tard
            </button>
            <button
              onClick={() => dismiss(true)}
              className="flex-1 h-12 rounded-2xl bg-fydly-500 text-white font-bold text-sm shadow-lg shadow-fydly-500/25 active:scale-95 transition-transform"
            >
              J'ai compris !
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Composant Step ────────────────────────────────────────────────────────────

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number
  icon: React.ReactNode
  title: string
  description: React.ReactNode
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-9 h-9 rounded-xl bg-fydly-50 border border-fydly-100 flex items-center justify-center">
          {icon}
        </div>
        {number < 3 && (
          <div className="w-px h-4 bg-fydly-100 mt-1" />
        )}
      </div>
      <div className="pt-1.5">
        <p className="font-bold text-fydly-900 text-sm leading-tight">{title}</p>
        <p className="text-fydly-500 text-xs mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ── Illustration barre Safari ─────────────────────────────────────────────────

function SafariToolbarHint() {
  return (
    <div className="mx-6 mt-5 rounded-2xl bg-fydly-50 border border-fydly-100 p-4 flex flex-col items-center gap-2">
      <p className="text-fydly-400 text-[10px] font-bold uppercase tracking-widest">
        Barre Safari
      </p>
      {/* Fausse barre Safari */}
      <div className="w-full bg-white rounded-xl border border-fydly-100 shadow-sm px-3 py-2 flex items-center justify-between">
        {/* Adresse */}
        <div className="flex-1 bg-fydly-50 rounded-lg px-3 py-1.5 mx-2">
          <p className="text-fydly-400 text-xs text-center font-medium">fydly.app</p>
        </div>
        {/* Share button — pulsing pour attirer l'attention */}
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-fydly-500 flex items-center justify-center shadow-md shadow-fydly-500/30 animate-pulse">
            <ArrowUpFromLine size={16} className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-fydly-500 rounded-full animate-ping opacity-75" />
        </div>
      </div>
      <p className="text-fydly-400 text-[10px] font-medium text-center">
        Appuyez ici pour afficher le menu de partage
      </p>
    </div>
  )
}
