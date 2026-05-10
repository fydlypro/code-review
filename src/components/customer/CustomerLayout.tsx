import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Settings, Clock, CreditCard, Download, X, LifeBuoy } from 'lucide-react'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import IOSInstallPrompt from './IOSInstallPrompt'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  // isIOS est géré par IOSInstallPrompt — ici on garde uniquement le banner Android/Chrome
  const { canInstall, isStandalone, promptInstall, dismiss } = usePWAInstall()
  const showAndroidBanner = canInstall && !isStandalone

  const navItems = [
    { path: '/customer/card',     icon: CreditCard, label: 'Ma Carte' },
    { path: '/customer/history',  icon: Clock,      label: 'Historique' },
    { path: '/customer/support',  icon: LifeBuoy,   label: 'Aide' },
    { path: '/customer/settings', icon: Settings,   label: 'Profil' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 relative pb-32">

      {/* ── Header / Branding ── */}
      <header className="fixed top-0 inset-x-0 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50 flex items-center justify-center px-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[20px] font-display font-bold text-slate-900 leading-none tracking-tight">Fydly</span>
          <span className="w-1.5 h-1.5 rounded-full bg-fydly-500 mb-0.5 inline-block" />
        </div>
      </header>

      {/* ── Bannière Android install ── */}
      {showAndroidBanner && (
        <div className="fixed top-14 inset-x-0 z-40 px-4 pt-3">
          <div className="max-w-md mx-auto bg-slate-900 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-modal">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <Download size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Installer Fydly</p>
              <p className="text-white/50 text-xs mt-0.5">Accès rapide depuis votre écran d'accueil</p>
            </div>
            <button
              onClick={promptInstall}
              className="bg-fydly-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 active:scale-95 transition-transform"
            >
              Installer
            </button>
            <button
              onClick={dismiss}
              className="text-white/30 hover:text-white/60 transition-colors shrink-0 p-1"
              aria-label="Fermer"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      {/* ── Guide d'installation iOS ── */}
      <IOSInstallPrompt />

      {/* ── Contenu principal ── */}
      <main className={`px-4 max-w-md mx-auto min-h-[calc(100vh-80px)] animate-fade-in ${showAndroidBanner ? 'pt-36' : 'pt-[58px]'}`}>
        <Outlet />
      </main>

      {/* ── Bottom Navigation ── */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 pointer-events-none px-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <nav className="pointer-events-auto max-w-sm mx-auto h-[68px] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-modal rounded-[26px] flex items-stretch px-2 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-[20px] transition-all duration-200 relative active:scale-90
                  ${isActive ? 'text-fydly-500' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {isActive && (
                  <div className="absolute inset-y-2 inset-x-0.5 bg-fydly-50 rounded-[16px] border border-fydly-100 transition-all duration-300" />
                )}
                <Icon
                  size={20}
                  className={`relative z-10 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
                <span className={`relative z-10 text-[10px] font-semibold leading-none transition-all duration-200
                  ${isActive ? 'text-fydly-500' : 'text-slate-400'}`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
