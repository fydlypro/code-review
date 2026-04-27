import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Store, LogOut, ShieldCheck, ChevronRight, Menu, X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/admin/merchants', icon: Store,            label: 'Commerçants' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const toast = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Déconnecté')
    navigate('/admin/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo zone */}
      <div className="px-6 py-7 border-b border-white/[0.10]">
        <NavLink to="/admin/dashboard" className="block group" onClick={onNavClick}>
          <span className="font-display text-[1.65rem] font-bold text-white tracking-tight group-hover:opacity-90 transition-opacity">
            Fydly<span className="text-fydly-300">·</span>
          </span>
        </NavLink>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
            <ShieldCheck size={11} className="text-fydly-200" />
            <span className="text-[10px] font-bold text-fydly-100 uppercase tracking-[2px]">
              Administration
            </span>
          </div>
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-6 pb-2">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[2.5px]">Navigation</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group',
                isActive
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/[0.07]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.06] text-white/40 group-hover:text-white/70 group-hover:bg-white/10'
                }`}>
                  <Icon size={15} />
                </span>
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-fydly-300/70" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/[0.08] space-y-1">
        <div className="px-4 py-2">
          <span className="text-[10px] text-white/20 font-mono">Fydly Admin · v2.0</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white/35 hover:text-red-300 hover:bg-red-500/15 transition-all duration-150 group"
        >
          <span className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
            <LogOut size={14} />
          </span>
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-fydly-50">

      {/* ── Header mobile (lg:hidden) ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#0D47A1] flex items-center justify-between px-4 shadow-md">
        <NavLink to="/admin/dashboard" className="font-display text-[1.4rem] font-bold text-white tracking-tight">
          Fydly<span className="text-fydly-300">·</span>
        </NavLink>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── Drawer mobile overlay ── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* ── Drawer mobile panel ── */}
      <div className={[
        'lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#0D47A1] flex flex-col shadow-2xl transition-transform duration-300',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        {/* Bouton fermer */}
        <div className="flex items-center justify-end px-4 pt-4">
          <button
            onClick={closeMobileMenu}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent onNavClick={closeMobileMenu} />
      </div>

      {/* ── Sidebar desktop (hidden sur mobile) ── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0D47A1] fixed top-0 left-0 z-30 shadow-[4px_0_24px_rgba(13,71,161,0.18)]">
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 ml-0 lg:ml-64 min-h-screen bg-fydly-50 flex flex-col pt-16 lg:pt-0">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
