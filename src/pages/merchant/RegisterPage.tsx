import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, X, Store, Loader2, ShieldCheck, BadgeCheck, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

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

  const [isCodeValid, setIsCodeValid] = useState(false)
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Validation du code côté serveur (debounce 600ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!accessCode.trim()) {
      setIsCodeValid(false)
      setIsCheckingCode(false)
      return
    }

    setIsCheckingCode(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('validate-merchant-code', {
          body: { code: accessCode.trim() },
        })
        setIsCodeValid(!error && data?.valid === true)
      } catch {
        setIsCodeValid(false)
      } finally {
        setIsCheckingCode(false)
      }
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [accessCode])

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

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()

    if (!isCodeValid) {
      toast.error("Code d'accès professionnel invalide.")
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
      toast.error("Vous devez accepter les conditions générales d'utilisation.")
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
        // Note: Using the auth user ID as the user_id field
        const { error: insertError } = await supabase.from('merchants').insert({
          user_id: authData.user.id,
          name: formData.name,
          sector: formData.sector,
          subscription_status: 'trial',
        })

        if (insertError) {
          console.error("Merchant profile creation error:", insertError)
          throw new Error("Erreur de création du profil commerçant. Veuillez vérifier vos accès.")
        }

        await refreshMerchant()
        toast.success('Inscription réussie !')
        navigate('/merchant/onboarding')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Une erreur est survenue lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-fydly-50 py-10 px-4">
      <div className="w-full max-w-lg animate-fade-in px-0">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/merchant/login">
            <span className="font-display text-3xl text-fydly-900">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </Link>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8 px-2">
          {[
            { icon: Clock,       label: 'Essai gratuit 30 jours' },
            { icon: BadgeCheck,  label: 'Sans carte bancaire' },
            { icon: ShieldCheck, label: 'Données sécurisées' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 bg-white border border-fydly-100 text-fydly-600 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-[100px] shadow-sm"
            >
              <Icon size={12} className="text-fydly-500" />
              {label}
            </span>
          ))}
        </div>

        <Card className="sm:p-10 p-6" variant="base">

          {/* En-tête */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-fydly-50 border border-fydly-100 rounded-[20px] flex items-center justify-center mb-5 text-fydly-500 shadow-sm">
              <Store size={32} />
            </div>
            <h1 className="font-display text-4xl text-fydly-900 mb-1">Rejoignez Fydly</h1>
            <p className="text-fydly-500 font-medium text-sm">Vos clients reviendront. Promis.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Code d'accès */}
            <div className="space-y-1">
              <div className="relative">
                <Input
                  label="Code d'accès professionnel"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Ex: FYDLY2026PRO"
                  error={accessCode && !isCodeValid && !isCheckingCode ? 'Code incorrect' : ''}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  required
                />
                {accessCode && (
                  <div className="absolute right-4 top-11">
                    {isCheckingCode ? (
                      <Loader2 size={16} className="text-fydly-400 animate-spin" />
                    ) : isCodeValid ? (
                      <div className="text-success bg-success-light w-6 h-6 rounded-full flex items-center justify-center animate-bounce-stamp">
                        <Check size={14} />
                      </div>
                    ) : (
                      <div className="text-error bg-error-light w-6 h-6 rounded-full flex items-center justify-center">
                        <X size={14} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!accessCode && (
                <p className="text-xs text-fydly-400 font-medium px-1">
                  Contactez-nous pour obtenir votre code d'accès.
                </p>
              )}
              {isCodeValid && (
                <p className="text-xs text-success font-bold px-1 flex items-center gap-1">
                  <Check size={11} /> Code validé — remplissez le formulaire ci-dessous
                </p>
              )}
            </div>

            {/* Séparateur avec état visuel */}
            <div className="flex items-center gap-3">
              <div className={`flex-1 h-px transition-all duration-500 ${isCodeValid ? 'bg-fydly-200' : 'bg-fydly-100'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${isCodeValid ? 'text-fydly-500' : 'text-fydly-200'}`}>
                Informations commerce
              </span>
              <div className={`flex-1 h-px transition-all duration-500 ${isCodeValid ? 'bg-fydly-200' : 'bg-fydly-100'}`} />
            </div>

            {/* Champs commerce */}
            <div
              className="transition-all duration-500 space-y-5"
              style={{
                opacity: isCodeValid ? 1 : 0.3,
                pointerEvents: isCodeValid ? 'auto' : 'none',
                filter: isCodeValid ? 'none' : 'grayscale(0.5) blur(0.8px)'
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom du commerce"
                  type="text"
                  name="name"
                  placeholder="Le Bon Café"
                  value={formData.name}
                  onChange={handleChange}
                  required={isCodeValid}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-fydly-800 uppercase tracking-[2px]">
                    Secteur
                  </label>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className="w-full border-[1.5px] border-fydly-200 rounded-input px-[14px] py-[13px] text-base text-fydly-900 bg-white focus:outline-none focus:border-fydly-500 transition-all cursor-pointer min-h-[44px]"
                  style={{ fontSize: '16px' }}
                    required={isCodeValid}
                  >
                    <option value="" disabled>Choisir...</option>
                    {sectors.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Adresse email"
                type="email"
                name="email"
                placeholder="contact@commerce.com"
                value={formData.email}
                onChange={handleChange}
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                required={isCodeValid}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Mot de passe"
                  type="password"
                  name="password"
                  placeholder="8 caractères min."
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  required={isCodeValid}
                  minLength={8}
                />
                <Input
                  label="Confirmer"
                  type="password"
                  name="confirmPassword"
                  placeholder="Répétez le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  error={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'Différent' : ''}
                  required={isCodeValid}
                  minLength={8}
                />
              </div>

              {/* Force mot de passe */}
              {formData.password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                          formData.password.length >= level * 4
                            ? level === 1 ? 'bg-red-400' : level === 2 ? 'bg-amber-400' : 'bg-success'
                            : 'bg-fydly-100'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-fydly-400 font-medium">
                    {formData.password.length < 4 ? 'Trop court' : formData.password.length < 8 ? 'Moyen' : 'Fort — bien joué !'}
                  </p>
                </div>
              )}

              {/* CGU */}
              <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl border border-fydly-100 bg-fydly-50/50 hover:bg-fydly-50 transition-all group">
                <input
                  type="checkbox"
                  name="cguAccepted"
                  checked={formData.cguAccepted}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 rounded-lg border-fydly-200 text-fydly-500 focus:ring-fydly-500 transition-all cursor-pointer"
                  required={isCodeValid}
                />
                <span className="text-[11px] font-medium text-fydly-700 leading-relaxed group-hover:text-fydly-900">
                  J'accepte les{' '}
                  <span className="text-fydly-500 font-bold">conditions générales d'utilisation</span>
                  {' '}et la{' '}
                  <span className="text-fydly-500 font-bold">politique de confidentialité</span>.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={!isCodeValid || loading}
              isLoading={loading}
              className="w-full mt-2 min-h-[52px] py-4 text-base shadow-lg shadow-fydly-500/20"
            >
              Créer mon compte gratuitement
            </Button>
          </form>

          <p className="text-center text-sm text-fydly-500 mt-8 font-medium">
            Déjà un compte ?{' '}
            <Link to="/merchant/login" className="text-fydly-600 font-bold hover:text-fydly-800 underline-offset-4 hover:underline transition-colors">
              Se connecter
            </Link>
          </p>
        </Card>

        <p className="text-center text-[11px] text-fydly-400 mt-6 font-medium">
          Vos données sont chiffrées et ne sont jamais revendues.
        </p>
      </div>
    </div>
  )
}
