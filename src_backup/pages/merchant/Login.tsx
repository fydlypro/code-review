import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

export default function MerchantLogin() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refreshMerchant } = useAuth()

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
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
      toast.error('Erreur lors de l\'envoi de l\'email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-fydly-50">
      <div className="card w-full max-w-md animate-fade-in shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-fydly-100 rounded-2xl flex items-center justify-center mb-4 text-fydly-500">
            <LogIn size={32} />
          </div>
          <h1 className="text-4xl font-serif text-fydly-900 mb-2">
            Fydly<span className="text-fydly-500">·</span>
          </h1>
          <p className="text-fydly-600 text-center font-medium">Espace Commerçant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="label">Email du commerce</label>
              <input
                type="email"
                placeholder="contact@commerce.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Mot de passe</label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-xs text-fydly-500 hover:text-fydly-600 font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base mt-2"
          >
            {loading ? <span className="spinner" /> : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-fydly-700 mt-8 font-medium">
          Nouveau sur Fydly ?{' '}
          <Link to="/merchant/register" className="text-fydly-500 hover:underline">
            Créer un compte pro
          </Link>
        </p>
      </div>
    </div>
  )
}
