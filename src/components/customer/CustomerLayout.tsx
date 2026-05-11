import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Gift, Clock, Scan, User, HelpCircle, Download, X, Zap } from 'lucide-react'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import IOSInstallPrompt from './IOSInstallPrompt'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { canInstall, isStandalone, promptInstall, dismiss } = usePWAInstall()
  const showAndroidBanner = canInstall && !isStandalone

  const navItems = [
    { path: '/customer/card',     icon: Gift,       label: 'Carte' },
    { path: '/customer/history',  icon: Clock,      label: 'Visites' },
    { path: '/customer/scan',     icon: Scan,       label: 'Scanner', isCenter: true },
    { path: '/customer/settings', icon: User,       label: 'Compte' },
    { path: '/customer/support',  icon: HelpCircle, label: 'Aide' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 relative">

      {/* ── Header ── */}
      <header className="fixed top-0 inset-x-0 h-14 z-50 flex items-center justify-center px-4 border-b border-slate-100"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Logo carré */}
          <div
            className="w-7 h-7 bg-gradient-bv flex items-center justify-center shrink-0"
            style={{ borderRadius: 8 }}
          >
            <Zap size={14} className="text-white fill-white" />
          </div>
          <span className="text-slate-900 font-display font-bold text-[20px] leading-none tracking-tight">
            Fydly·
          </span>
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
      <main
        className={`max-w-[480px] mx-auto min-h-screen animate-fade-in ${showAndroidBanner ? 'pt-36' : 'pt-14'}`}
        style={{ paddingBottom: 90 }}
      >
        <Outlet />
      </main>

      {/* ── Bottom Navigation (barre plate) ── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-100 flex items-center justify-around"
        style={{
          height: 70,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center active:scale-90 transition-transform"
                aria-label={item.label}
                style={{ flex: 1 }}
              >
                <div
                  className="bg-gradient-bv shadow-glow-strong flex items-center justify-center"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    transform: 'translateY(-12px)',
                  }}
                >
                  <Icon size={22} className="text-white" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 active:scale-90 transition-all duration-200"
              style={{ flex: 1 }}
            >
              <Icon
                size={20}
                className={isActive ? 'text-fydly-500' : 'text-slate-300'}
                strokeWidth={isActive ? 2.2 : 1.75}
              />
              <span
                className="font-semibold"
                style={{
                  fontSize: 10,
                  color: isActive ? '#2563EB' : '#CBD5E1',
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  className="rounded-full bg-fydly-500"
                  style={{ width: 4, height: 4, marginTop: -2 }}
                />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
