import { useState } from 'react'
import { Store, Star, Upload, Trash2, KeyRound, BellRing, Check, ShieldCheck, Mail, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

type SettingsTab = 'profil' | 'programme' | 'notifications' | 'securite' | 'danger'

const TABS: { key: SettingsTab; label: string; icon: any; danger?: boolean }[] = [
  { key: 'profil', label: 'Profil', icon: Store },
  { key: 'programme', label: 'Programme', icon: Star },
  { key: 'notifications', label: 'Notifications', icon: BellRing },
  { key: 'securite', label: 'Sécurité', icon: KeyRound },
  { key: 'danger', label: 'Danger', icon: Trash2, danger: true },
]

const SECTORS = ['Restaurant', 'Boulangerie', 'Coiffeur', 'Boutique', 'Café', 'Salon de Thé', 'Beauté', 'Autre']

function PasswordStrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Excellent']
  const colors = ['', '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#10B981']

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : '#E2E8F0' }}
          />
        ))}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
    </div>
  )
}

export default function MerchantSettingsPage() {
  const { session, merchant, refreshMerchant } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profil')
  const [loading, setLoading] = useState(false)

  // Profil
  const [name, setName] = useState(merchant?.name || '')
  const [sector, setSector] = useState(merchant?.sector || '')

  // Programme
  const [threshold, setThreshold] = useState(merchant?.reward_threshold?.toString() || '10')
  const [description, setDescription] = useState(merchant?.reward_description || '')

  // Notifications
  const [autoReminders, setAutoReminders] = useState(merchant?.auto_reminders_enabled || false)
  const [autoMessage, setAutoMessage] = useState(merchant?.auto_reminder_message || 'Vous nous manquez ! Venez nous voir pour compléter votre carte de fidélité.')

  // Sécurité
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const initials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  const handleUpdateCommerce = async () => {
    if (!merchant?.id) return
    setLoading(true)
    try {
      const { error } = await supabase.from('merchants').update({ name, sector }).eq('id', merchant.id)
      if (error) throw error
      await refreshMerchant()
      toast.success('Informations enregistrées.')
    } catch { toast.error('Erreur lors de la mise à jour.') } finally { setLoading(false) }
  }

  const handleUpdateReward = async () => {
    if (!merchant?.id) return
    setLoading(true)
    try {
      const { error } = await supabase.from('merchants').update({
        reward_threshold: parseInt(threshold) || 10,
        reward_description: description,
      }).eq('id', merchant.id)
      if (error) throw error
      await refreshMerchant()
      toast.success('Récompense mise à jour.')
    } catch { toast.error('Erreur lors de la mise à jour.') } finally { setLoading(false) }
  }

  const handleUpdateReminders = async () => {
    if (!merchant?.id) return
    setLoading(true)
    try {
      const { error } = await supabase.from('merchants').update({
        auto_reminders_enabled: autoReminders,
        auto_reminder_message: autoMessage,
      }).eq('id', merchant.id)
      if (error) throw error
      await refreshMerchant()
      toast.success('Relances automatiques mises à jour.')
    } catch { toast.error('Erreur de configuration.') } finally { setLoading(false) }
  }

  const handleUpdatePassword = async () => {
    if (password.length < 8) { toast.error('8 caractères minimum requis.'); return }
    if (password !== confirmPassword) { toast.error('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Mot de passe mis à jour.')
      setOldPassword(''); setPassword(''); setConfirmPassword('')
    } catch { toast.error('Erreur de mise à jour.') } finally { setLoading(false) }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Cette action est irréversible. Toutes vos données clients et historiques seront effacées définitivement. Confirmer ?'
    )
    if (!confirmed || !merchant?.id || !session?.user?.id) return
    setLoading(true)
    try {
      const { error } = await supabase.functions.invoke('delete-merchant-account')
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/merchant/login')
    } catch { toast.error('Erreur lors de la suppression. Contactez le support si le problème persiste.') } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-24 lg:pb-8">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display text-xl shadow-md shrink-0 select-none" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          {initials}
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-slate-900 leading-tight">Paramètres</h1>
          <p className="text-slate-400 font-medium text-sm">Configurez votre boutique et vos préférences.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">

        {/* ── SIDEBAR DESKTOP ── */}
        <aside className="hidden lg:block sticky top-8">
          <div className="bg-white shadow-card p-2" style={{ borderRadius: 20 }}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-2">Navigation</p>
            <nav className="flex flex-col gap-0.5">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left border-l-2 ${
                      isActive
                        ? tab.danger
                          ? 'bg-red-50 text-red-600 border-red-500'
                          : 'bg-blue-50 text-fydly-500 border-fydly-500'
                        : tab.danger
                          ? 'text-red-400 hover:bg-red-50 hover:text-red-600 border-transparent'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* ── TABS MOBILE ── */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex gap-2 flex-nowrap">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all shrink-0 ${
                    isActive
                      ? tab.danger
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-fydly-500 text-white border-fydly-500'
                      : tab.danger
                        ? 'bg-white text-red-400 border-red-200'
                        : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div>

          {/* PROFIL */}
          {activeTab === 'profil' && (
            <div className="bg-white shadow-card p-6 sm:p-8" style={{ borderRadius: 20 }}>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-fydly-500">
                  <Store size={17} />
                </div>
                <div>
                  <h2 className="font-display text-lg text-slate-900">Profil Boutique</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Informations visibles par vos clients</p>
                </div>
              </div>

              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <div className="relative shrink-0 group/av">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display text-2xl shadow-md select-none" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                    {initials}
                  </div>
                  <button
                    onClick={() => toast.info('Bientôt disponible')}
                    className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover/av:opacity-100 transition-opacity"
                  >
                    <Upload size={18} className="text-white" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Logo de la boutique</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3">PNG ou JPG · 512×512 recommandé</p>
                  <Button variant="secondary" className="h-9 px-4 text-xs bg-white border-slate-200 hover:border-slate-300">
                    <Upload size={12} className="mr-1.5" /> Choisir un fichier
                  </Button>
                </div>
              </div>

              {/* Fields */}
              <div className="grid sm:grid-cols-2 gap-5 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom commercial</label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl border-slate-200 focus:border-fydly-500 font-semibold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secteur d'activité</label>
                  <select
                    value={sector}
                    onChange={e => setSector(e.target.value)}
                    className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-semibold appearance-none hover:border-slate-300 focus:border-fydly-500 focus:outline-none transition-all"
                  >
                    <option value="" disabled>Choisir un secteur...</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className="h-12 rounded-xl bg-slate-50 opacity-60 cursor-not-allowed pl-10 font-medium"
                    />
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Non modifiable</p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex justify-end">
                <Button onClick={handleUpdateCommerce} disabled={loading || !name.trim() || !sector} className="h-13 px-8 text-sm" style={{ height: 52 }}>
                  {loading ? <span className="spinner" /> : <><Check size={15} className="mr-1.5" /> Sauvegarder</>}
                </Button>
              </div>
            </div>
          )}

          {/* PROGRAMME */}
          {activeTab === 'programme' && (
            <div className="bg-white shadow-card p-6 sm:p-8" style={{ borderRadius: 20 }}>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <Star size={15} className="fill-current" />
                </div>
                <div>
                  <h2 className="font-display text-lg text-slate-900">Programme Fidélité</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Définissez l'offre que vos clients voient</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                {/* Threshold */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tampons requis</label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={threshold}
                    onChange={e => setThreshold(e.target.value)}
                    className="w-full h-20 rounded-2xl text-center font-display text-slate-900 border-2 border-slate-200 focus:border-fydly-500 focus:ring-4 focus:ring-blue-50 focus:outline-none bg-white transition-all text-4xl"
                  />
                  <p className="text-[11px] text-slate-400 font-medium text-center">Entre 2 et 20 tampons</p>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Récompense offerte</label>
                  <Input
                    maxLength={50}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex : Un café offert, -10% sur votre achat..."
                    className="h-12 rounded-xl font-semibold border-slate-200"
                  />
                  <p className="text-[11px] text-slate-400 font-medium italic">Soignez votre offre !</p>
                </div>
              </div>

              {/* Preview mini carte */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Aperçu carte client</p>
                <div className="bg-slate-900 rounded-2xl p-4 text-white max-w-xs mx-auto">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-display text-sm">Carte Fidélité</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono">0/{threshold}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {Array.from({ length: Math.min(parseInt(threshold) || 10, 10) }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-lg border-2 border-white/20 bg-white/5" />
                    ))}
                    {(parseInt(threshold) || 10) > 10 && (
                      <span className="text-[10px] text-white/40 self-center">+{(parseInt(threshold) || 10) - 10}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 font-medium">Récompense : <span className="text-white font-bold">{description || 'Votre récompense'}</span></p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex justify-end">
                <Button onClick={handleUpdateReward} disabled={loading || !description.trim() || parseInt(threshold) < 2} className="h-13 px-8 text-sm" style={{ height: 52 }}>
                  {loading ? <span className="spinner" /> : <><Check size={15} className="mr-1.5" /> Mettre à jour l'offre</>}
                </Button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white shadow-card p-6 sm:p-8" style={{ borderRadius: 20 }}>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${autoReminders ? 'bg-fydly-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <BellRing size={16} />
                </div>
                <div>
                  <h2 className="font-display text-lg text-slate-900">Notifications Push</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Relances automatiques clients</p>
                </div>
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${autoReminders ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  {autoReminders ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {/* Toggle push */}
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Notifications push activées</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Relancez les clients absents depuis 30 jours.</p>
                </div>
                <button
                  onClick={() => setAutoReminders(!autoReminders)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative flex items-center px-1 shrink-0 ml-4 ${autoReminders ? 'bg-fydly-500' : 'bg-slate-200'}`}
                  aria-label="Activer les notifications"
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${autoReminders ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Info OneSignal */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-5">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <BellRing size={14} className="text-fydly-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Connecté à OneSignal</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Les notifications sont acheminées via OneSignal. Assurez-vous que votre App ID est configuré.</p>
                </div>
              </div>

              {autoReminders && (
                <div className="space-y-3 mb-5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message de relance</label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      maxLength={140}
                      value={autoMessage}
                      onChange={e => setAutoMessage(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 pt-4 pb-8 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-fydly-500 transition-all resize-none font-medium text-sm"
                    />
                    <span className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {autoMessage.length}/140
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-5 border-t border-slate-100 flex justify-end">
                <Button onClick={handleUpdateReminders} disabled={loading || (autoReminders && !autoMessage.trim())} className="h-13 px-8 text-sm" style={{ height: 52 }}>
                  {loading ? <span className="spinner" /> : <><Check size={15} className="mr-1.5" /> Enregistrer</>}
                </Button>
              </div>
            </div>
          )}

          {/* SECURITE */}
          {activeTab === 'securite' && (
            <div className="bg-white shadow-card p-6 sm:p-8" style={{ borderRadius: 20 }}>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-fydly-500">
                  <KeyRound size={17} />
                </div>
                <div>
                  <h2 className="font-display text-lg text-slate-900">Accès & Sécurité</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Identifiants et protection du compte</p>
                </div>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Protégé
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mb-6">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email administrateur</label>
                  <div className="relative">
                    <Input type="email" value={session?.user?.email || ''} disabled className="h-12 rounded-xl bg-slate-50 opacity-60 cursor-not-allowed pl-10 font-medium" />
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">L'email ne peut pas être modifié.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mot de passe actuel</label>
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-slate-200 focus:border-fydly-500 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nouveau mot de passe</label>
                  <div className="relative">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="8 caractères minimum"
                      className="h-12 rounded-xl border-slate-200 focus:border-fydly-500 font-medium pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={password} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmer le mot de passe</label>
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Répéter le nouveau mot de passe"
                    className={`h-12 rounded-xl font-medium ${confirmPassword && confirmPassword !== password ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-fydly-500'}`}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[10px] text-red-500 font-bold">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Chiffrement AES-256 · Supabase Auth
                </div>
                <Button
                  variant="secondary"
                  onClick={handleUpdatePassword}
                  disabled={loading || password.length < 8 || password !== confirmPassword}
                  className="h-12 px-8 text-sm bg-white border-slate-200 hover:border-slate-300 w-full sm:w-auto"
                >
                  {loading ? <span className="spinner" /> : 'Mettre à jour le mot de passe'}
                </Button>
              </div>
            </div>
          )}

          {/* DANGER */}
          {activeTab === 'danger' && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 overflow-hidden" style={{ borderRadius: 20 }}>
              <div className="flex items-center gap-2 px-6 py-3 bg-red-100 border-b border-red-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-red-300" />
                  <div className="w-2 h-2 rounded-full bg-red-200" />
                </div>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Zone de danger — Actions irréversibles</p>
              </div>
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white text-red-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      Supprimer mon compte commerçant
                      <span className="text-[9px] font-bold text-red-500 bg-white border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-widest">Irréversible</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mt-1">
                      Toutes les données clients, cartes de fidélité et l'historique seront définitivement effacés.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all active:scale-95 disabled:opacity-60 shrink-0 w-full sm:w-auto justify-center"
                  style={{ minHeight: 44 }}
                >
                  {loading ? <span className="spinner border-white" /> : <><Trash2 size={14} /> Fermer mon commerce</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
