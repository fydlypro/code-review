import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Lock, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../contexts/ToastContext'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Identifiants incorrects.')
      setLoading(false)
      return
    }

    const role = data.user?.app_metadata?.role
    if (role !== 'admin') {
      await supabase.auth.signOut()
      toast.error('Accès refusé. Ce compte n\'est pas administrateur.')
      setLoading(false)
      return
    }

    navigate('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#060C18] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fydly-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[420px] z-10">
        {/* Logo + badge */}
        <div className="text-center mb-10">
          <div className="font-display text-5xl text-white mb-4 tracking-tight">
            Fydly<span className="text-violet-400">·</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 px-4 py-1.5 rounded-full">
            <ShieldCheck size={13} className="text-violet-400" />
            <span className="text-violet-300 text-[11px] font-bold uppercase tracking-[2px]">
              Espace Super Admin
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-[28px] p-8 backdrop-blur-sm shadow-2xl shadow-black/40">
          <div className="mb-7">
            <h1 className="text-white text-xl font-bold mb-1">Connexion administrateur</h1>
            <p className="text-white/35 text-sm">Accès restreint au personnel Fydly.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[2px] mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  type="email"
                  placeholder="admin@fydly.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-4 py-3.5 text-[15px] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[2px] mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-4 py-3.5 text-[15px] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-bold text-[15px] rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/40 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Accéder au panneau admin
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/15 text-[11px] mt-6">
          Fydly · Plateforme de fidélité digitale · Accès restreint
        </p>
      </div>
    </div>
  )
}
