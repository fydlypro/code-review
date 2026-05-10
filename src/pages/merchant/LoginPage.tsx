import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Store, TrendingUp, Users, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function MerchantLogin() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refreshMerchant } = useAuth()

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await refreshMerchant()
        toast.success('Connexion réussie')
        navigate('/merchant/dashboard')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : 'Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Veuillez entrer votre email pour réinitialiser le mot de passe.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/merchant/settings',
      })
      if (error) throw error
      toast.success('Lien de réinitialisation envoyé par email.')
    } catch (err: any) {
      toast.error("Erreur lors de l'envoi de l'email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ── Panneau gauche — visuel desktop ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] min-h-screen bg-slate-900 p-12 relative overflow-hidden">
        {/* Blobs décoratifs */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-[300px] h-[300px] rounded-full bg-fydly-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <div>
            <span className="font-display text-2xl text-white tracking-tight">
              Fydly<span className="text-fydly-400">·</span>
            </span>
            <p className="text-slate-400 text-xs font-medium mt-0.5">Fidélité digitale pour commerçants</p>
          </div>
        </div>

        {/* Headline centrale */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-5xl text-white leading-tight mb-4">
              Vos clients<br />
              <span className="text-gradient-bv italic">reviennent.</span><br />
              Toujours.
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xs">
              Pilotez votre programme de fidélité depuis un seul endroit, simplement.
            </p>
          </div>

          {/* Stats de réassurance */}
          <div className="grid grid-cols-1 gap-3 max-w-xs">
            {[
              { icon: Store,      stat: '7',        label: 'commerces actifs' },
              { icon: Users,      stat: '300+',     label: 'clients fidélisés' },
              { icon: TrendingUp, stat: '+47 %',    label: 'de visites en plus' },
            ].map(({ icon: Icon, stat, label }) => (
              <div key={label} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-fydly-500/20 flex items-center justify-center text-fydly-400 shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-white font-display text-xl leading-none">{stat}</p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mention légale bas */}
        <p className="relative z-10 text-slate-500 text-xs font-medium">© 2026 Fydly — Tous droits réservés</p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">

        {/* Logo mobile uniquement */}
        <div className="lg:hidden mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-bv rounded-[8px] flex items-center justify-center">
              <Zap size={14} className="text-white" fill="currentColor" />
            </div>
            <span className="font-display text-2xl text-slate-900">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </div>
        </div>

        <div className="w-full max-w-[420px] animate-fade-in">

          {/* En-tête form */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-fydly-50 text-fydly-600 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-[100px] mb-6 border border-fydly-100">
              <ShieldCheck size={13} />
              Espace commerçant
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight mb-3">
              Bon retour&nbsp;!
            </h1>
            <p className="text-slate-500 font-medium text-base">
              Vos clients vous attendent. Connectez-vous pour reprendre là où vous en étiez.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email du commerce"
              type="email"
              placeholder="contact@commerce.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={handleResetPassword}
                className="absolute right-0 top-0 text-[11px] text-fydly-500 hover:text-fydly-700 font-bold uppercase tracking-wider transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={loading}
                className="w-full py-4 text-base"
              >
                Se connecter
              </Button>
            </div>
          </form>

          {/* Lien inscription */}
          <p className="text-center text-sm text-slate-500 mt-8 font-medium">
            Pas encore de compte ?{' '}
            <Link
              to="/merchant/register"
              className="text-fydly-600 hover:text-fydly-700 font-bold underline-offset-4 hover:underline transition-colors"
            >
              Rejoindre Fydly
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
