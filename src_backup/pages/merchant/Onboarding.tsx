import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stamp, Star, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

export default function MerchantOnboarding() {
  const navigate = useNavigate()
  const toast = useToast()
  const { session, refreshMerchant } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [programType, setProgramType] = useState<'stamps' | 'points'>('stamps')
  const [rewardThreshold, setRewardThreshold] = useState(10)
  const [rewardDescription, setRewardDescription] = useState('1 café offert')

  const handleNextStep = () => setStep(2)
  const handleBack = () => setStep(1)

  const handleComplete = async () => {
    if (!session?.user?.id) {
      toast.error('Session invalide. Veuillez vous reconnecter.')
      navigate('/merchant/login')
      return
    }

    setLoading(true)

    try {
      // 1. Update merchant settings
      const { data: merchantData, error: updateError } = await supabase
        .from('merchants')
        .update({
          program_type: programType,
          reward_threshold: rewardThreshold,
          reward_description: rewardDescription,
        })
        .eq('user_id', session.user.id)
        .select('id')
        .single()

      if (updateError) throw updateError

      // 2. Generate first QR token for today
      if (merchantData?.id) {
        const todayDate = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
        
        await supabase.from('qr_tokens').upsert({
          merchant_id: merchantData.id,
          token: crypto.randomUUID(),
          valid_date: todayDate,
          is_active: true,
        }, { onConflict: 'merchant_id, valid_date' })
      }

      await refreshMerchant()
      toast.success('Configuration terminée ! Bienvenue sur Fydly.')
      navigate('/merchant/dashboard')

    } catch (err: any) {
      console.error(err)
      toast.error('Une erreur est survenue lors de la configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col pt-12 p-4 bg-fydly-50">
      <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header / Intro */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-fydly-900">
            Créez votre programme de fidélité
          </h1>
          <p className="text-fydly-600 font-medium">
            Étape {step} sur 2
          </p>
        </div>

        {/* --- STEP 1: Program Type --- */}
        {step === 1 && (
          <div className="card max-w-xl mx-auto space-y-8 shadow-card-hover p-8">
            <h2 className="text-xl font-bold text-fydly-900 text-center">
              Quel type de programme souhaitez-vous ?
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProgramType('stamps')}
                className={`p-6 rounded-2xl border-2 text-center transition-all ${
                  programType === 'stamps' 
                    ? 'border-fydly-500 bg-fydly-50 shadow-[0_0_0_2px_rgba(33,150,243,0.15)]' 
                    : 'border-fydly-100 hover:border-fydly-300'
                }`}
              >
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  programType === 'stamps' ? 'bg-fydly-500 text-white shadow-lg' : 'bg-fydly-100 text-fydly-400'
                }`}>
                  <Stamp size={32} />
                </div>
                <h3 className="font-bold text-fydly-900 text-lg mb-2">Carte à tampons</h3>
                <p className="text-sm text-fydly-600">Le classique revisité. 1 passage en caisse = 1 tampon.</p>
              </button>

              <button
                type="button"
                onClick={() => setProgramType('points')}
                className={`p-6 rounded-2xl border-2 text-center transition-all opacity-50 cursor-not-allowed ${
                  programType === 'points' 
                    ? 'border-fydly-500 bg-fydly-50 shadow-[0_0_0_2px_rgba(33,150,243,0.15)]' 
                    : 'border-fydly-100 hover:border-fydly-300'
                }`}
                disabled
              >
                <div className="mx-auto w-16 h-16 bg-fydly-100 text-fydly-400 rounded-full flex items-center justify-center mb-4">
                  <Star size={32} />
                  {/* Optionnel: indiquer que les points arriveront plus tard */}
                  <div className="absolute top-2 right-2 bg-fydly-200 text-fydly-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Bientôt</div>
                </div>
                <h3 className="font-bold text-fydly-900 text-lg mb-2">Programme à points</h3>
                <p className="text-sm text-fydly-600">1€ dépensé = X points. (En cours de développement)</p>
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-fydly-100">
              <button onClick={handleNextStep} className="btn-primary w-full sm:w-auto text-base px-8 py-3.5">
                Suivant <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: Configure Reward --- */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            
            {/* Form */}
            <div className="card space-y-6 shadow-card-hover p-8 md:sticky md:top-8">
              <h2 className="text-xl font-bold text-fydly-900 mb-6">
                Définissez la récompense
              </h2>
              
              <div>
                <label className="label">Objectif à atteindre</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={rewardThreshold}
                    onChange={(e) => setRewardThreshold(parseInt(e.target.value) || 10)}
                    className="input w-32 font-bold text-lg text-center"
                  />
                  <span className="text-fydly-700 font-medium whitespace-nowrap">tampons pour gagner la récompense</span>
                </div>
                <p className="text-xs text-fydly-500 mt-2">La plupart des commerçants choisissent 10 tampons.</p>
              </div>

              <div>
                <label className="label">Que gagne votre client ?</label>
                <input
                  type="text"
                  maxLength={50}
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  placeholder="Ex: 1 café offert, -10% sur la prochaine visite..."
                  className="input font-medium"
                />
              </div>

              <div className="pt-6 border-t border-fydly-100 flex items-center gap-4">
                <button onClick={handleBack} className="btn-secondary h-12 flex-1 sm:flex-none">
                  Retour
                </button>
                <button 
                  onClick={handleComplete} 
                  disabled={loading || rewardThreshold < 2 || !rewardDescription.trim()}
                  className="btn-primary h-12 flex-1"
                >
                  {loading ? <span className="spinner" /> : (
                    <>
                      <CheckCircle2 size={18} /> Terminer l'installation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="space-y-4">
              <h3 className="label text-center mb-6">Aperçu pour le client</h3>
              
              <div className="card w-full max-w-sm mx-auto shadow-xl relative overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-fydly-500"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="font-serif font-bold text-xl text-fydly-900">Votre boutique</h4>
                      <p className="text-fydly-500 text-sm font-medium uppercase tracking-widest mt-0.5">Fidélité</p>
                    </div>
                    <div className="w-10 h-10 bg-fydly-50 text-fydly-500 rounded-full flex items-center justify-center font-bold">
                       0
                    </div>
                  </div>

                  {/* Stamp grid preview */}
                  <div className="flex flex-wrap gap-2.5 justify-center mb-8">
                    {Array.from({ length: rewardThreshold }).map((_, i) => (
                      <div key={i} className={`flex items-center justify-center ${
                          i < 3 ? 'w-10 h-10 rounded-full bg-fydly-500 text-white shadow-md' : 'w-10 h-10 rounded-full border-2 border-fydly-100 text-fydly-200 bg-white'
                      }`}>
                        {i < 3 ? <Stamp size={18} /> : null}
                      </div>
                    ))}
                  </div>

                  {/* Progress info context */}
                  <div className="bg-fydly-50 p-4 rounded-xl border border-fydly-100">
                    <p className="text-center text-sm text-fydly-800 font-medium">
                      Plus que <strong className="text-fydly-900">{rewardThreshold - 3} tampons</strong> avant
                    </p>
                    <p className="text-center font-bold text-fydly-500 mt-1">"{rewardDescription}"</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}
