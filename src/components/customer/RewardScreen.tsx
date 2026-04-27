import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Sparkles, Calendar } from 'lucide-react'

interface RewardScreenProps {
  rewardQrToken: string
  merchantName: string
  rewardDescription: string
  expiresAt: string
  onClose: () => void
}

export default function RewardScreen({
  rewardQrToken,
  merchantName,
  rewardDescription,
  expiresAt,
  onClose,
}: RewardScreenProps) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    // Confettis au montage
    const launchConfetti = async () => {
      try {
        const { default: confetti } = await import('canvas-confetti')
        confetti({
          particleCount: 140,
          spread: 100,
          origin: { y: 0.25 },
          colors: ['#ffffff', '#90CAF9', '#42A5F5', '#BBDEFB', '#E3F2FD'],
        })
        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.3, x: 0.1 },
            colors: ['#ffffff', '#64B5F6'],
          })
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.3, x: 0.9 },
            colors: ['#ffffff', '#42A5F5'],
          })
        }, 400)
      } catch (_) {}
    }
    launchConfetti()

    // Wake Lock — garde l'écran allumé pendant que le client montre le QR
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        }
      } catch (_) {}
    }
    requestWakeLock()

    return () => {
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in" style={{ backgroundColor: '#0D47A1' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-white/50" />
          <span className="text-white/60 text-xs font-bold tracking-[3px] uppercase">Récompense débloquée</span>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white border border-white/20 bg-white/10 active:scale-95 transition-transform"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7 text-center pb-8 overflow-y-auto">

        {/* Titre */}
        <div className="space-y-2">
          <p className="text-4xl">🎁</p>
          <h1 className="text-3xl font-display text-white leading-tight">
            {rewardDescription}
          </h1>
          <p className="text-white/60 text-sm font-medium">
            Offert par <span className="text-white font-bold">{merchantName}</span>
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-[28px] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col items-center gap-5">
          <QRCodeSVG
            value={rewardQrToken}
            size={210}
            level="H"
            style={{ display: 'block' }}
          />
          <div className="flex items-center gap-1.5 text-[#1976D2] bg-[#E3F2FD] px-4 py-2 rounded-full">
            <span className="text-xs font-bold tracking-widest uppercase">Fydly</span>
            <span className="w-1 h-1 rounded-full bg-[#2196F3]" />
            <span className="text-xs font-bold tracking-widest uppercase">Cadeau</span>
          </div>
        </div>

        {/* Instruction */}
        <div className="space-y-1.5 max-w-xs">
          <p className="text-white text-base font-semibold leading-snug">
            Montrez ce QR code à la caisse
          </p>
          <p className="text-white/50 text-sm">
            Le commerçant le scannera pour valider votre cadeau et remettre votre carte à zéro.
          </p>
        </div>

        {/* Date expiration */}
        <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
          <Calendar size={13} />
          <span>Expire le {expiresAt}</span>
        </div>
      </div>

      {/* Indicateur de bas d'écran */}
      <div className="flex justify-center pb-10 flex-shrink-0">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
