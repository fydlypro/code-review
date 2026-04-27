import React, { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, BarChart2, Bell,
  Settings, LogOut, CreditCard, Menu, X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const navItems = [
  { to: '/merchant/dashboard',      icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/merchant/customers',      icon: Users,           label: 'Clients' },
  { to: '/merchant/analytics',      icon: BarChart2,       label: 'Statistiques' },
  { to: '/merchant/notifications',  icon: Bell,            label: 'Notifications' },
  { to: '/merchant/billing',        icon: CreditCard,      label: 'Abonnement' },
  { to: '/merchant/settings',       icon: Settings,        label: 'Paramètres' },
]

export default function MerchantLayout() {
  const { merchant } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Déconnecté avec succès')
    navigate('/merchant/login')
  }

  return (
    <div className="flex min-h-screen bg-fydly-50">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white shadow-card border-r border-fydly-100 fixed top-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-fydly-100">
          <NavLink to="/merchant/dashboard" className="block">
            <span className="font-serif text-2xl font-bold text-fydly-900">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </NavLink>
          {merchant && (
            <p className="text-xs text-fydly-700 mt-1 truncate font-medium">{merchant.name}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-fydly-100">
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left text-fydly-700 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut size={19} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header + Drawer ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-fydly-100 flex items-center px-4 h-14 shadow-card">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-fydly-700 hover:bg-fydly-50"
        >
          <Menu size={22} />
        </button>
        <div className="flex-1 flex justify-center">
          <span className="font-serif text-xl font-bold text-fydly-900">
            Fydly<span className="text-fydly-500">·</span>
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-64 bg-white h-full shadow-modal flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-fydly-100 flex items-center justify-between">
              <span className="font-serif text-2xl font-bold text-fydly-900">
                Fydly<span className="text-fydly-500">·</span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl text-fydly-600 hover:bg-fydly-50">
                <X size={20} />
              </button>
            </div>
            {merchant && (
              <div className="px-6 py-3 border-b border-fydly-100">
                <p className="text-xs text-fydly-700 font-medium truncate">{merchant.name}</p>
              </div>
            )}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-fydly-100">
              <button
                onClick={handleLogout}
                className="nav-item w-full text-left text-fydly-700 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut size={19} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/30 backdrop-blur-sm" />
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
