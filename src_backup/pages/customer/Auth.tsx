import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, upsertCustomerProfile, attributeStamp } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get('token')
  const urlMerchantId = searchParams.get('m')

  const merchantName = sessionStorage.getItem('fydly_pending_merchant_name') || 'votre commerçant'

  const [isLoginOrSignUp, setIsLoginOrSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gdprAccepted, setGdprAccepted] = useState(false)

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/customer/card?m=${urlMerchantId}&token=${urlToken}`
        }
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoginOrSignUp(true)

    try {
      // 1. Tenter la connexion
      let authResponse = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // 2. Si invalide, on tente l'inscription
      let isNewUser = false
      if (authResponse.error && authResponse.error.message.includes('Invalid login credentials')) {
        if (!gdprAccepted) {
          toast.error("Veuillez accepter les CGU pour créer un compte.")
          setIsLoginOrSignUp(false)
          return
        }

        const signUpResponse = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (signUpResponse.error) throw signUpResponse.error
        authResponse = signUpResponse
        isNewUser = true
      } else if (authResponse.error) {
        throw authResponse.error
      }

      const user = authResponse.data.user
      if (!user) throw new Error("Erreur système.")

      // 3. Upsert Profile Client
      const profile = await upsertCustomerProfile({
        userId: user.id,
        email: user.email!,
        gdprAccepted: isNewUser ? true : undefined
      })
      if (profile.error) throw profile.error

      // 4. Donner le tampon si token présent
      const token = urlToken || sessionStorage.getItem('fydly_pending_token')
      const mId = urlMerchantId || sessionStorage.getItem('fydly_pending_merchant_id')

      if (token && mId && profile.data) {
        const stampRes = await attributeStamp({
          customerId: profile.data.id,
          merchantId: mId,
          qrTokenUsed: token
        })

        if (!stampRes.success && stampRes.error !== 'too_soon') {
          toast.error(stampRes.error || "Tampon non attribué.")
        } else if (stampRes.error === 'too_soon') {
          toast.success("Connecté (Tampon déjà scanné récemment)")
        } else {
          toast.success("+1 Tampon ajouté ! \uD83C\uDF89")
        }
        
        // Clean session
        sessionStorage.removeItem('fydly_pending_token')
        sessionStorage.removeItem('fydly_pending_merchant_id')
        sessionStorage.removeItem('fydly_pending_merchant_name')

        navigate(`/customer/card?merchant=${mId}&new_stamp=true`)
      } else {
        navigate('/customer/card')
      }

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoginOrSignUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center p-6">
      
      <div className="w-full max-w-sm mt-12 mb-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-blue-900 mb-2">Fydly<span className="text-blue-500">·</span></h1>
        <p className="text-blue-700">Gagnez vos tampons chez <span className="font-bold">{merchantName}</span> !</p>
      </div>

      <div className="card w-full max-w-sm bg-white rounded-xl shadow-lg border border-blue-100 p-6">
        
        <div className="flex flex-col gap-3 mb-6">
          <button 
            type="button" 
            onClick={() => handleOAuth('google')}
            className="w-full flex justify-center items-center gap-2 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5"/>
            Continuer avec Google
          </button>
          <button 
            type="button" 
            onClick={() => handleOAuth('apple')}
            className="w-full flex justify-center items-center gap-2 border border-black bg-black rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-gray-900 transition-colors"
          >
            Continuer avec Apple
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-400">Ou par email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-blue-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="votre@email.com"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-blue-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="••••••••"
              required 
              minLength={6}
            />
          </div>

          <label className="flex items-start gap-2 mt-2">
            <input 
              type="checkbox" 
              checked={gdprAccepted}
              onChange={e => setGdprAccepted(e.target.checked)}
              className="mt-1 rounded text-blue-600 focus:ring-blue-500 border-blue-300" 
            />
            <span className="text-xs text-blue-700 leading-tight">
              Pour un nouveau compte, j'accepte les conditions générales et la politique de confidentialité de Fydly.
            </span>
          </label>

          <button 
            type="submit" 
            disabled={isLoginOrSignUp}
            className="w-full mt-2 rounded-xl bg-blue-500 px-4 py-3 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex justify-center"
          >
            {isLoginOrSignUp ? <div className="spinner w-5 h-5 border-white"></div> : "Continuer"}
          </button>
        </form>

      </div>
    </div>
  )
}
