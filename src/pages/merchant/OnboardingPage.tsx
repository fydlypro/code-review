import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stamp, Star, ArrowRight, ShieldCheck, Zap, Sparkles, ChevronLeft, Store, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

// UI Components
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { session, merchant, refreshMerchant } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [shopName, setShopName] = useState('')
  const [programType, setProgramType] = useState<'stamps' | 'points'>('stamps')
  const [rewardThreshold, setRewardThreshold] = useState<number | string>(10)
  const [rewardDescription, setRewardDescription] = useState('1 café offert')

  const TOTAL_STEPS = 2

  useEffect(() => {
    if (merchant) {
      if (merchant.reward_description) {
        navigate('/merchant/dashboard', { replace: true })
      } else if (merchant.name) {
        setShopName((prev) => prev ? prev : merchant.name)
      }
    }
  }, [merchant, navigate])

  const handleNextStep = () => {
    if (!shopName.trim()) { toast.error('Entrez le nom de votre commerce.'); return }
    setStep(2)
  }
  const handleBack = () => setStep(1)

  const handleComplete = async () => {
    if (!session?.user?.id) {
      toast.error('Session expirée.')
      navigate('/merchant/login')
      return
    }
    setLoading(true)
    try {
      const thresholdValue = typeof rewardThreshold === 'number' ? rewardThreshold : (parseInt(rewardThreshold) || 10);

      // UPSERT is more resilient than update if the profile wasn't fully created yet
      const { data: merchantData, error: updateError } = await supabase
        .from('merchants')
        .upsert({
          user_id: session.user.id,
          name: shopName.trim(),
          program_type: programType,
          reward_threshold: thresholdValue,
          reward_description: rewardDescription,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select('id')
        .single()

      if (updateError) throw updateError

      if (merchantData?.id) {
        const todayDate = new Date().toISOString().split('T')[0]
        await supabase.from('qr_tokens').upsert({
          merchant_id: merchantData.id,
          token: crypto.randomUUID(),
          valid_date: todayDate,
          is_active: true,
        }, { onConflict: 'merchant_id, valid_date' })
      }

      await refreshMerchant()
      toast.success('Configuration terminée !')
      navigate('/merchant/dashboard')
    } catch (err: any) {
      console.error('Onboarding finalization error:', err)
      toast.error('Erreur de configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      // Use window.location to ensure a clean state after logout
      window.location.href = '/merchant/login'
    } catch (err) {
      console.error('Logout error:', err)
      navigate('/merchant/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-fydly-50 relative">

      {/* ── Barre de progression globale ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-fydly-100">
        <div
          className="h-full bg-fydly-500 transition-all duration-700 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-1 left-0 right-0 z-40 flex items-center justify-between px-5 sm:px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl text-fydly-900">
            Fydly<span className="text-fydly-500">·</span>
          </span>
          {/* Étapes desktop */}
          <div className="hidden sm:flex items-center gap-2 ml-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const s = i + 1
              const done = s < step
              const active = s === step
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300
                    ${done ? 'bg-success text-white' : active ? 'bg-fydly-500 text-white shadow-md shadow-fydly-500/30' : 'bg-fydly-100 text-fydly-300'}
                  `}>
                    {done ? <Check size={13} /> : s}
                  </div>
                  {s < TOTAL_STEPS && (
                    <div className={`w-8 h-px transition-all duration-500 ${done ? 'bg-success' : 'bg-fydly-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-white border border-fydly-100 shadow-sm rounded-2xl px-4 py-2.5 text-fydly-400 hover:text-red-500 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <ShieldCheck size={14} /> Déconnexion
        </button>
      </header>

      {/* ── Contenu principal ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-4xl animate-fade-in">

          {/* Titre de l'étape */}
          <div className="text-center mb-10 sm:mb-12">
            {/* Pill étape mobile */}
            <div className="sm:hidden inline-flex items-center gap-2 bg-fydly-100 text-fydly-600 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-[100px] mb-5">
              Étape {step} sur {TOTAL_STEPS}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-fydly-900 leading-tight mb-3">
              {step === 1 ? 'Configurons votre programme' : 'Définissez votre récompense'}
            </h1>
            <p className="text-fydly-500 font-medium text-base sm:text-lg max-w-lg mx-auto">
              {step === 1
                ? 'Choisissez le format qui correspond le mieux à votre commerce.'
                : "Quel cadeau ferez-vous à vos clients les plus fidèles ?"}
            </p>
          </div>

          {/* ── ÉTAPE 1 : Type de programme ── */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Nom du commerce */}
              <Card className="p-6 sm:p-8 border border-fydly-100">
                <label className="flex items-center gap-2 text-[10px] font-bold text-fydly-400 uppercase tracking-widest mb-3">
                  <Store size={13} className="text-fydly-500" /> Nom de votre commerce
                </label>
                <Input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ex : Boulangerie Martin, Café du Commerce..."
                  className="h-14 rounded-2xl border-fydly-100 focus:border-fydly-500 font-bold text-lg"
                  autoFocus
                />
              </Card>

              {/* Sélection du type */}
              <div className="grid md:grid-cols-2 gap-5">
                <Card
                  onClick={() => setProgramType('stamps')}
                  className={`p-7 sm:p-8 cursor-pointer transition-all duration-300 border-2 flex flex-col items-center text-center group ${
                    programType === 'stamps'
                      ? 'border-fydly-500 shadow-card-hover scale-[1.02]'
                      : 'border-transparent hover:border-fydly-100 hover:shadow-card'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-5 transition-all duration-300 ${
                    programType === 'stamps'
                      ? 'bg-fydly-500 text-white shadow-lg shadow-fydly-500/30 rotate-6'
                      : 'bg-fydly-50 text-fydly-300 group-hover:bg-fydly-100'
                  }`}>
                    <Stamp size={38} />
                  </div>
                  <h3 className="font-display text-2xl text-fydly-900 mb-2">Tampons</h3>
                  <p className="text-sm text-fydly-500 font-medium leading-relaxed mb-6">
                    Simple et visuel — vos clients adorent voir leur progression.
                  </p>
                  {programType === 'stamps' ? (
                    <span className="inline-flex items-center gap-1.5 bg-fydly-500 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-[100px]">
                      <Check size={11} /> Sélectionné
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-fydly-300 text-[10px] font-bold uppercase tracking-widest">
                      Cliquer pour choisir
                    </span>
                  )}
                </Card>

                <Card className="p-7 sm:p-8 border-2 border-transparent opacity-50 cursor-not-allowed flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-fydly-200">
                    <Sparkles size={18} />
                  </div>
                  <div className="w-20 h-20 bg-fydly-50 text-fydly-200 rounded-[2rem] flex items-center justify-center mb-5">
                    <Star size={38} />
                  </div>
                  <h3 className="font-display text-2xl text-fydly-900 mb-2">Points</h3>
                  <p className="text-sm text-fydly-500 font-medium leading-relaxed mb-6">
                    Flexible — adaptez les récompenses selon vos envies.
                  </p>
                  <span className="inline-flex items-center gap-1.5 bg-fydly-50 text-fydly-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-[100px]">
                    Bientôt disponible
                  </span>
                </Card>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNextStep}
                  className="w-full sm:w-auto h-14 sm:h-16 px-10 sm:px-14 text-base sm:text-lg shadow-xl shadow-fydly-500/20"
                >
                  Continuer <ArrowRight size={20} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Récompense ── */}
          {step === 2 && (
            <div className="grid lg:grid-cols-2 gap-10 items-start w-full">

              {/* Formulaire */}
              <Card className="p-8 sm:p-10 border border-fydly-100 shadow-card">
                <div className="space-y-8">

                  {/* Nombre de tampons */}
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">
                      <Zap size={13} className="text-fydly-500 fill-current" />
                      Tampons pour une récompense
                    </label>

                    <div className="flex items-center gap-5">
                      {/* Boutons - / + */}
                      <div className="flex items-center gap-3 bg-fydly-50 border border-fydly-100 rounded-2xl p-1.5">
                        <button
                          type="button"
                          onClick={() => setRewardThreshold(v => Math.max(2, (Number(v) || 10) - 1))}
                          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white border border-fydly-100 text-fydly-600 font-bold text-xl hover:bg-fydly-50 transition-all active:scale-95 shadow-sm flex items-center justify-center"
                        >
                          −
                        </button>
                        <Input
                          type="number"
                          min={2}
                          max={50}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={rewardThreshold}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setRewardThreshold('');
                            } else {
                              const parsed = parseInt(val);
                              if (!isNaN(parsed)) {
                                const clamped = Math.max(0, Math.min(50, parsed));
                                setRewardThreshold(clamped);
                              }
                            }
                          }}
                          className="w-20 h-14 text-center text-3xl font-display text-fydly-900 border-0 bg-transparent focus:ring-0 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setRewardThreshold(v => Math.min(50, (Number(v) || 10) + 1))}
                          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-fydly-500 text-white font-bold text-xl hover:bg-fydly-600 transition-all active:scale-95 shadow-sm flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div>
                        <span className="text-fydly-900 font-bold block">Visites requises</span>
                        <p className="text-xs text-fydly-400 font-medium italic mt-0.5">Standard : 10 tampons</p>
                      </div>
                    </div>
                  </div>

                  {/* Description de la récompense */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">
                      <Star size={13} className="text-fydly-500 fill-current" />
                      Votre récompense
                    </label>
                    <Input
                      maxLength={50}
                      value={rewardDescription}
                      onChange={(e) => setRewardDescription(e.target.value)}
                      placeholder="Ex : 1 café offert, 10% de remise..."
                      className="h-14 rounded-2xl text-lg font-bold placeholder:text-fydly-200"
                    />
                    <p className="text-xs text-fydly-400 font-medium italic">
                      Restez simple et attractif — c'est ce que vos clients verront.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-fydly-50 flex items-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={handleBack}
                      className="h-13 px-6 bg-white border-fydly-100 hover:bg-fydly-50"
                    >
                      <ChevronLeft size={18} className="mr-1" /> Retour
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={loading || !rewardDescription.trim() || Number(rewardThreshold) < 2}
                      className="h-13 flex-1 text-base shadow-lg shadow-fydly-500/20"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="spinner w-5 h-5 border-white" /> Finalisation...
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          Lancer mon programme <ArrowRight size={18} />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Aperçu carte client */}
              <div className="block relative group">
                <div className="absolute -inset-6 bg-gradient-to-tr from-fydly-500/15 to-fydly-200/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-[60px]" />

                <p className="text-center text-[10px] font-bold text-fydly-300 uppercase tracking-[0.3em] mb-6">
                  Aperçu — vue client mobile
                </p>

                <div className="w-full max-w-xs mx-auto">
                  {/* Faux phone frame */}
                  <div className="bg-fydly-900 rounded-[52px] p-3 shadow-2xl ring-4 ring-fydly-900/10 transition-transform duration-700 group-hover:rotate-1 group-hover:scale-[1.02]">
                    {/* Notch */}
                    <div className="flex justify-center mb-3">
                      <div className="w-20 h-5 bg-fydly-800 rounded-full" />
                    </div>

                    <div className="bg-white rounded-[40px] overflow-hidden">
                      {/* Header carte */}
                      <div className="bg-fydly-50 px-6 pt-6 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span className="text-[9px] font-bold text-fydly-400 uppercase tracking-widest">Carte fidélité</span>
                            <h4 className="font-display text-xl text-fydly-900 leading-tight mt-0.5">
                              {shopName || 'Votre boutique'}
                            </h4>
                          </div>
                          <div className="w-11 h-11 bg-fydly-500 rounded-2xl flex items-center justify-center text-white font-display text-lg shadow-md shadow-fydly-500/30">
                            3
                          </div>
                        </div>
                        <p className="text-[11px] text-fydly-400 font-medium">3 / {rewardThreshold || 10} tampons</p>
                        {/* Mini progress bar */}
                        <div className="mt-3 h-1.5 bg-fydly-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-fydly-500 rounded-full transition-all duration-500"
                            style={{ width: `${(3 / (Number(rewardThreshold) || 10)) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Grille de tampons */}
                      <div className="px-6 py-5">
                        <div className="grid grid-cols-5 gap-2.5">
                          {Array.from({ length: Math.min(Number(rewardThreshold) || 10, 20) }).map((_, i) => (
                            <div key={i} className="aspect-square flex items-center justify-center">
                              {i < 3 ? (
                                <div
                                  className="w-full h-full rounded-xl bg-fydly-500 flex items-center justify-center text-white shadow-md shadow-fydly-500/30"
                                  style={{ animationDelay: `${i * 100}ms` }}
                                >
                                  <Stamp size={16} />
                                </div>
                              ) : (
                                <div className="w-full h-full rounded-xl border-2 border-dashed border-fydly-100" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Récompense */}
                      <div className="mx-5 mb-6 bg-fydly-900 rounded-[24px] px-5 py-4 relative overflow-hidden">
                        <p className="text-center text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">
                          Objectif
                        </p>
                        <p className="text-center font-display text-base text-white leading-snug">
                          {rewardDescription || '1 café offert'}
                        </p>
                        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full blur-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-5">
                  <Badge className="bg-fydly-50 text-fydly-400 border-none font-bold text-[10px] tracking-widest uppercase">
                    Mode aperçu
                  </Badge>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  )
}
