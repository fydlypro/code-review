import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, BarChart2, Bell,
  Settings, LogOut, CreditCard, LifeBuoy, X, ChevronRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const navItems = [
  { to: '/merchant/dashboard',     icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/merchant/customers',     icon: Users,           label: 'Clients' },
  { to: '/merchant/analytics',     icon: BarChart2,       label: 'Statistiques' },
  { to: '/merchant/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/merchant/billing',       icon: CreditCard,      label: 'Abonnement' },
  { to: '/merchant/settings',      icon: Settings,        label: 'Paramètres' },
  { to: '/merchant/support',       icon: LifeBuoy,        label: 'Support' },
]

// Items affichés dans la bottom nav mobile (5 max)
const bottomNavItems = [
  { to: '/merchant/dashboard',     icon: LayoutDashboard, label: 'Accueil' },
  { to: '/merchant/customers',     icon: Users,           label: 'Clients' },
  { to: '/merchant/analytics',     icon: BarChart2,       label: 'Stats' },
  { to: '/merchant/notifications', icon: Bell,            label: 'Alertes' },
  { to: '/merchant/settings',      icon: Settings,        label: 'Plus' },
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
    <div className="flex min-h-screen bg-fydly-50">

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white shadow-card border-r border-fydly-100/70 fixed top-0 left-0 z-30">

        {/* Logo + commerce */}
        <div className="px-5 pt-7 pb-6 border-b border-fydly-100/70">
          <NavLink to="/merchant/dashboard" className="flex items-center gap-3 group mb-4">
            <div className="w-9 h-9 bg-fydly-500 rounded-[10px] flex items-center justify-center shadow-md shadow-fydly-500/30 group-hover:shadow-lg group-hover:shadow-fydly-500/40 transition-all">
              <span className="font-display text-white text-sm font-bold leading-none">F</span>
            </div>
            <span className="font-display text-xl text-fydly-900 group-hover:text-fydly-700 transition-colors">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </NavLink>

          {merchant && (
            <div className="flex items-center gap-3 bg-fydly-50 border border-fydly-100 rounded-2xl px-3 py-2.5">
              {/* Avatar initiales */}
              <div className="w-9 h-9 rounded-xl bg-fydly-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-fydly-900 truncate leading-tight">{merchant.name}</p>
                <p className="text-[10px] font-medium text-fydly-400 uppercase tracking-wider mt-0.5">
                  {merchant.subscription_status === 'trial' ? 'Essai gratuit'
                    : merchant.subscription_status === 'business' ? 'Plan Business'
                    : merchant.subscription_status === 'pro' ? 'Plan Pro'
                    : merchant.subscription_status === 'expired' ? 'Expiré'
                    : merchant.subscription_status === 'cancelled' ? 'Annulé'
                    : 'Plan Pro'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-fydly-500 text-white shadow-md shadow-fydly-500/25'
                    : 'text-fydly-600 hover:bg-fydly-50 hover:text-fydly-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isActive ? 'bg-white/15' : 'bg-fydly-50 group-hover:bg-fydly-100'
                  }`}>
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="opacity-60 shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 pb-6 pt-3 border-t border-fydly-100/70">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-fydly-500 hover:text-red-500 hover:bg-red-50 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-fydly-50 group-hover:bg-red-50 flex items-center justify-center shrink-0 transition-all">
              <LogOut size={17} />
            </div>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-fydly-100/70 flex items-center justify-between px-4 h-[60px] shadow-sm">
        <NavLink to="/merchant/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-fydly-500 rounded-[10px] flex items-center justify-center shadow-sm">
            <span className="font-display text-white text-sm font-bold leading-none">F</span>
          </div>
          <span className="font-display text-xl text-fydly-900">
            Fydly<span className="text-fydly-500">·</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-2">
          {/* Avatar / nom commerce */}
          {merchant && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 bg-fydly-50 border border-fydly-100 rounded-xl px-2.5 py-1.5 hover:bg-fydly-100 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-fydly-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {initials}
              </div>
              <span className="text-[12px] font-bold text-fydly-800 max-w-[100px] truncate hidden sm:block">
                {merchant.name}
              </span>
            </button>
          )}

          {/* Burger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-xl text-fydly-400 hover:bg-fydly-50 hover:text-fydly-700 transition-all"
            aria-label="Ouvrir le menu"
          >
            <div className="flex flex-col gap-[5px] w-5">
              <span className="h-[2px] w-full bg-current rounded-full transition-all" />
              <span className="h-[2px] w-full bg-current rounded-full transition-all" />
              <span className="h-[2px] w-3/4 bg-current rounded-full transition-all" />
            </div>
          </button>
        </div>
      </header>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-fydly-100/70 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-[62px] max-w-lg mx-auto">
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 flex-1 px-1 transition-all duration-200 relative ${
                  isActive ? 'text-fydly-500' : 'text-fydly-300 hover:text-fydly-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Indicateur actif */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-fydly-500 rounded-full" />
                  )}
                  <div className={`
                    w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                    ${isActive ? 'bg-fydly-50 scale-105' : ''}
                  `}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-bold transition-all leading-none ${isActive ? 'text-fydly-500' : 'text-fydly-300'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ─── Mobile Drawer ─── */}
      {isDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-fydly-900/40 backdrop-blur-sm animate-fade-in"
          onClick={closeDrawer}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[min(300px,85vw)] bg-white shadow-2xl flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-fydly-50">
              <div className="flex items-center gap-3">
                {merchant && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-fydly-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-fydly-900 text-sm leading-tight">{merchant.name}</p>
                      <p className="text-[10px] font-medium text-fydly-400 uppercase tracking-wider mt-0.5">
                        {merchant.subscription_status === 'trial' ? 'Essai gratuit'
                          : merchant.subscription_status === 'business' ? 'Plan Business'
                          : merchant.subscription_status === 'pro' ? 'Plan Pro'
                          : merchant.subscription_status === 'expired' ? 'Expiré'
                          : merchant.subscription_status === 'cancelled' ? 'Annulé'
                          : 'Plan Pro'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-fydly-300 hover:bg-fydly-50 hover:text-fydly-700 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav drawer */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-fydly-500 text-white shadow-md shadow-fydly-500/20'
                        : 'text-fydly-600 hover:bg-fydly-50 hover:text-fydly-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight size={14} className="opacity-60" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Déconnexion drawer */}
            <div className="px-3 pb-8 pt-3 border-t border-fydly-50">
              <button
                onClick={() => { handleLogout(); closeDrawer(); }}
                className="flex items-center gap-3.5 w-full px-3.5 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={19} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Contenu principal ─── */}
      <main className="flex-1 min-w-0 lg:ml-64 pt-[60px] lg:pt-0 pb-[62px] lg:pb-0 min-h-screen flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
