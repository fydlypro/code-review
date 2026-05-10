import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, BarChart2, Bell,
  Settings, LogOut, CreditCard, LifeBuoy, X, QrCode,
  Zap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const navItems = [
  { to: '/merchant/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/merchant/analytics',     icon: BarChart2,       label: 'Statistiques' },
  { to: '/merchant/customers',     icon: Users,           label: 'Clients' },
  { to: '/merchant/notifications', icon: Bell,            label: 'Campagnes' },
  { to: '/merchant/settings',      icon: Settings,        label: 'Paramètres' },
]

const navItems2 = [
  { to: '/merchant/billing',  icon: CreditCard, label: 'Facturation' },
  { to: '/merchant/support',  icon: LifeBuoy,   label: 'Support' },
]

// Bottom nav mobile — 5 items, center = scanner surélevé
const bottomNavItems = [
  { to: '/merchant/dashboard',     icon: LayoutDashboard, label: 'Accueil' },
  { to: '/merchant/analytics',     icon: BarChart2,       label: 'Stats' },
  { to: '/merchant/customers',     icon: Users,           label: 'Clients' },
  { to: '/merchant/notifications', icon: Bell,            label: 'Alertes' },
]

// Génère les initiales du commerce
function getInitials(name: string = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function MerchantLayout() {
  const { merchant } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Déconnecté avec succès')
    navigate('/merchant/login')
  }

  const closeDrawer = () => setIsDrawerOpen(false)

  const initials = getInitials(merchant?.name)

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-slate-100 fixed top-0 left-0 z-30">

        {/* Logo + commerce */}
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <NavLink to="/merchant/dashboard" className="flex items-center gap-2.5 group mb-4">
            <div className="w-8 h-8 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
              <Zap size={16} className="text-white" fill="currentColor" />
            </div>
            <span className="font-display text-[18px] font-bold text-slate-900 tracking-tight">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </NavLink>

          {merchant && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-avatar bg-fydly-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">{merchant.name}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-fydly-500 bg-fydly-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  {merchant.subscription_status === 'trial' ? 'Essai' : 'Pro'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-fydly-50 text-fydly-500 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              style={({ isActive }) => isActive
                ? { borderLeft: '3px solid #2563EB', paddingLeft: '9px' }
                : { borderLeft: '3px solid transparent', paddingLeft: '9px' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.75} />
                  <span className="flex-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="h-px bg-slate-100 my-2 mx-1" />

          {navItems2.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-fydly-50 text-fydly-500 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              style={({ isActive }) => isActive
                ? { borderLeft: '3px solid #2563EB', paddingLeft: '9px' }
                : { borderLeft: '3px solid transparent', paddingLeft: '9px' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.75} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Déconnexion */}
        <div className="px-3 pb-5 pt-3 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-avatar bg-slate-200 flex items-center justify-center text-slate-500 text-[11px] font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-700 truncate">{merchant?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 h-[58px]">
        <NavLink to="/merchant/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-bv rounded-[8px] flex items-center justify-center">
            <Zap size={14} className="text-white" fill="currentColor" />
          </div>
          <span className="font-display text-[18px] font-bold text-slate-900 tracking-tight">
            Fydly<span className="text-fydly-500">·</span>
          </span>
        </NavLink>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
          aria-label="Ouvrir le menu"
        >
          <div className="flex flex-col gap-[4px] w-4">
            <span className="h-[1.5px] w-full bg-current rounded-full" />
            <span className="h-[1.5px] w-full bg-current rounded-full" />
            <span className="h-[1.5px] w-2/3 bg-current rounded-full" />
          </div>
        </button>
      </header>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/92 backdrop-blur-xl border-t border-slate-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center h-[66px] max-w-lg mx-auto px-3 gap-1">
          {/* Left 2 items */}
          {bottomNavItems.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-fydly-500' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.75} />
                  <span className="text-[10px] font-semibold leading-none">{label}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-fydly-500" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Centre — Scanner (surélevé) */}
          <NavLink
            to="/merchant/dashboard"
            className="flex-shrink-0 mx-2"
          >
            <div
              className="w-14 h-14 rounded-full bg-gradient-bv flex items-center justify-center shadow-glow-strong"
              style={{ transform: 'translateY(-12px)' }}
            >
              <QrCode size={22} className="text-white" />
            </div>
          </NavLink>

          {/* Right 2 items */}
          {bottomNavItems.slice(2).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-fydly-500' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.75} />
                  <span className="text-[10px] font-semibold leading-none">{label}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-fydly-500" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ─── Mobile Drawer ─── */}
      {isDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={closeDrawer}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[min(280px,85vw)] bg-white shadow-modal flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              {merchant && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-avatar bg-fydly-500 flex items-center justify-center text-white text-[12px] font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{merchant.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {merchant.subscription_status === 'trial' ? 'Essai gratuit' : 'Plan Pro'}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
              {[...navItems, ...navItems2].map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all ${
                      isActive
                        ? 'bg-fydly-50 text-fydly-500 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                  style={({ isActive }) => isActive
                    ? { borderLeft: '3px solid #2563EB', paddingLeft: '9px' }
                    : { borderLeft: '3px solid transparent', paddingLeft: '9px' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.75} />
                      <span className="flex-1">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="px-3 pb-8 pt-3 border-t border-slate-100">
              <button
                onClick={() => { handleLogout(); closeDrawer(); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-error hover:bg-red-50 transition-all"
              >
                <LogOut size={17} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Contenu principal ─── */}
      <main className="flex-1 min-w-0 lg:ml-64 pt-[58px] lg:pt-0 pb-[90px] lg:pb-0 min-h-screen flex flex-col overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in w-full min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
