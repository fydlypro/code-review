import { useState, useEffect } from 'react'

interface UsePWAInstallReturn {
  canInstall: boolean         // Chrome/Android: événement beforeinstallprompt capté
  isIOS: boolean              // iOS Safari: faut montrer instructions manuelles
  isStandalone: boolean       // Déjà installée → ne pas re-proposer
  promptInstall: () => void   // Déclenche le prompt natif (Chrome seulement)
  dismiss: () => void         // Cache la bannière définitivement
}

const DISMISSED_KEY = 'fydly_pwa_dismissed'

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  )

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true

  useEffect(() => {
    if (isStandalone || dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone, dismissed])

  const promptInstall = () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null)
      setCanInstall(false)
    })
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
    setCanInstall(false)
  }

  return {
    canInstall: canInstall && !dismissed,
    isIOS: isIOS && !isStandalone && !dismissed,
    isStandalone,
    promptInstall,
    dismiss,
  }
}
