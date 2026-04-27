import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Settings, Clock, Home } from 'lucide-react'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-blue-50 relative pb-20">
      {/* 
        Le fond de l'espace client est #E3F2FD (blue-50 Tailwind default works well, 
        but we'll ensure we use correct hex if needed via Tailwind config, #blue-50 is very close). 
      */}
      
      {/* Top Header / Branding minimal */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-blue-100 z-50 flex items-center justify-center px-4">
        <h1 className="text-xl font-bold text-blue-900 font-serif">Fydly<span className="text-blue-500">·</span></h1>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 px-4 max-w-md mx-auto min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-blue-100 z-50 flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => navigate('/customer/card')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            location.pathname === '/customer/card' || location.pathname === '/customer/reward'
              ? 'text-blue-600'
              : 'text-blue-300 hover:text-blue-500'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Cartes</span>
        </button>

        <button
          onClick={() => navigate('/customer/history')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            location.pathname === '/customer/history'
              ? 'text-blue-600'
              : 'text-blue-300 hover:text-blue-500'
          }`}
        >
          <Clock size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Historique</span>
        </button>

        <button
          onClick={() => navigate('/customer/settings')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            location.pathname === '/customer/settings'
              ? 'text-blue-600'
              : 'text-blue-300 hover:text-blue-500'
          }`}
        >
          <Settings size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Profil</span>
        </button>
      </nav>
    </div>
  )
}
