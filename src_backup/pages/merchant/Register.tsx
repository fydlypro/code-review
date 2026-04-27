import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, X, Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

export default function MerchantRegister() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refreshMerchant } = useAuth()

  const [loading, setLoading] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cguAccepted: false,
  })

  const validAccessCode = import.meta.env.VITE_MERCHANT_ACCESS_CODE
  const isCodeValid = accessCode === validAccessCode

  const sectors = [
    'Restaurant',
    'Boulangerie',
    'Coiffeur',
    'Boutique',
    'Café',
    'Autre',
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isCodeValid) {
      toast.error('Code d\'accès professionnel invalide.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (!formData.cguAccepted) {
      toast.error('Vous devez accepter les conditions générales d\'utilisation.')
      return
    }

    setLoading(true)

    try {
      // 1. SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Insert into merchants
        const { error: insertError } = await supabase.from('merchants').insert({
          id: crypto.randomUUID(), // Assuming UUID generation for PK if not auto
          user_id: authData.user.id,
          name: formData.name,
          sector: formData.sector,
          subscription_status: 'trial',
        })

        if (insertError) {
          // Si l'insertion échoue, au moins logger, 
          // idéalement on supprimerait l'utilisateur auth créé, mais on simplifie ici
          throw insertError
        }

        await refreshMerchant() // Update AuthContext
        toast.success('Inscription réussie !')
        navigate('/merchant/onboarding')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Une erreur est survenue lors de l\'inscription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-fydly-50">
      <div className="card w-full max-w-md animate-fade-in shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-fydly-100 rounded-2xl flex items-center justify-center mb-4 text-fydly-500">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-serif text-fydly-900 mb-2">
            Fydly<span className="text-fydly-500">·</span>
          </h1>
          <p className="text-fydly-600 text-center font-medium">Inscription Professionnelle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Access Code */}
          <div>
            <label className="label">Code d'accès pro</label>
            <div className="relative">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Ex: FYDLY2026PRO"
                className={`input pr-10 ${accessCode && !isCodeValid ? 'input-error' : ''}`}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {accessCode ? (
                  isCodeValid ? (
                    <span className="text-green-500 flex items-center justify-center w-5 h-5 bg-green-100 rounded-full"><Check size={14} /></span>
                  ) : (
                    <span className="text-red-500 flex items-center justify-center w-5 h-5 bg-red-100 rounded-full"><X size={14} /></span>
                  )
                ) : null}
              </div>
            </div>
            {accessCode && !isCodeValid && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">Code incorrect</p>
            )}
          </div>

          <div className="opacity-100 transition-opacity duration-300 space-y-5" style={{ opacity: isCodeValid ? 1 : 0.4, pointerEvents: isCodeValid ? 'auto' : 'none' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nom du commerce</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Ex: Le Bon Café"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  required={isCodeValid}
                />
              </div>
              <div>
                <label className="label">Secteur</label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  className="input cursor-pointer"
                  required={isCodeValid}
                >
                  <option value="" disabled>Choisir...</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Adresse Email</label>
              <input
                type="email"
                name="email"
                placeholder="contact@commerce.com"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required={isCodeValid}
              />
            </div>

            <div>
              <label className="label">Téléphone (Optionnel)</label>
              <input
                type="tel"
                name="phone"
                placeholder="06 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  placeholder="8 caractères min."
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  required={isCodeValid}
                  minLength={8}
                />
              </div>
              <div>
                <label className="label">Confirmer</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmer"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'input-error' : ''}`}
                  required={isCodeValid}
                  minLength={8}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 mt-4 cursor-pointer p-4 rounded-xl border border-fydly-100 bg-fydly-50/50 hover:bg-fydly-50 transition-colors">
              <input
                type="checkbox"
                name="cguAccepted"
                checked={formData.cguAccepted}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-fydly-300 text-fydly-500 focus:ring-fydly-500"
                required={isCodeValid}
              />
              <span className="text-xs text-fydly-700 leading-relaxed">
                J'accepte les conditions générales d'utilisation et la politique de confidentialité.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!isCodeValid || loading}
            className="btn-primary w-full mt-6 py-4 text-base"
          >
            {loading ? <span className="spinner" /> : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm text-fydly-700 mt-6 font-medium">
          Déjà un compte ?{' '}
          <Link to="/merchant/login" className="text-fydly-500 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
