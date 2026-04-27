import { useState } from 'react'
import { Store, Settings as SettingsIcon, Upload, Trash2, KeyRound, BellRing, ChevronRight, ShieldCheck, Mail, Star, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

// UI Components
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function MerchantSettingsPage() {
  const { session, merchant, refreshMerchant } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  // Section: Commerce
  const [name, setName] = useState(merchant?.name || '')
  const [sector, setSector] = useState(merchant?.sector || '')

  // Section: Prestations
  const [threshold, setThreshold] = useState(merchant?.reward_threshold?.toString() || '10')
  const [description, setDescription] = useState(merchant?.reward_description || '')

  // Section: Relances
  const [autoReminders, setAutoReminders] = useState(merchant?.auto_reminders_enabled || false)
  const [autoMessage, setAutoMessage] = useState(merchant?.auto_reminder_message || 'Vous nous manquez ! Venez nous voir pour compléter votre carte de fidélité.')

  // Section: Sécurité
  const [password, setPassword] = useState('')

  const sectors = [
    'Restaurant', 'Boulangerie', 'Coiffeur', 'Boutique', 'Café', 'Salon de Thé', 'Beauté', 'Autre',
  ]

  const handleUpdateCommerce = async () => {
    if (!merchant?.id) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('merchants')
        .update({ name, sector })
        .eq('id', merchant.id)

      if (error) throw error
      await refreshMerchant()
      toast.success('Informations enregistrées.')
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReward = async () => {
    if (!merchant?.id) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          reward_threshold: parseInt(threshold) || 10,
          reward_description: description
        })
        .eq('id', merchant.id)

      if (error) throw error
      await refreshMerchant()
      toast.success('Récompense mise à jour.')
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReminders = async () => {
    if (!merchant?.id) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          auto_reminders_enabled: autoReminders,
          auto_reminder_message: autoMessage
        })
        .eq('id', merchant.id)

      if (error) throw error
      await refreshMerchant()
      toast.success('Relances automatiques activées.')
    } catch (e: any) {
      toast.error('Erreur de configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!password || password.length < 8) {
      toast.error('8 caractères minimum requis.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Mot de passe sécurisé.')
      setPassword('')
    } catch (e: any) {
      toast.error('Erreur de mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Cette action est irréversible. Toutes vos données clients et historiques seront effacées définitivement. Confirmer ?"
    )
    if (!confirmed || !merchant?.id || !session?.user?.id) return
    setLoading(true)
    try {
      const { error } = await supabase.functions.invoke('delete-merchant-account')
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/merchant/login')
    } catch (e: any) {
      toast.error('Erreur lors de la suppression. Contactez le support si le problème persiste.')
    } finally {
      setLoading(false)
    }
  }

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-fydly-500 hover:bg-fydly-50 hover:text-fydly-900 transition-all group"
    >
      <Icon size={18} className="shrink-0 text-fydly-400 group-hover:text-fydly-600 transition-colors" />
      <span>{label}</span>
      <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
    </a>
  )

  // Avatar initiales
  const initials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-32 lg:pb-16 px-2 sm:px-0">
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-5 mb-4">
          {/* Avatar initiales */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fydly-500 to-fydly-700 flex items-center justify-center text-white font-display text-xl shadow-lg shadow-fydly-500/20 shrink-0 select-none">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-display text-fydly-900 leading-tight mb-0.5">Paramètres</h1>
            <p className="text-fydly-400 font-medium text-sm sm:text-base">
              Configurez votre boutique, votre programme fidélité et vos préférences.
            </p>
          </div>
        </div>
        {/* Breadcrumb sections rapides */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { href: '#commerce', label: 'Profil' },
            { href: '#fidelite', label: 'Programme' },
            { href: '#relances', label: 'Marketing' },
            { href: '#securite', label: 'Sécurité' },
            { href: '#danger', label: 'Danger zone', danger: true },
          ].map(({ href, label, danger }) => (
            <a
              key={href}
              href={href}
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-colors ${
                danger
                  ? 'text-red-400 border-red-100 hover:bg-red-50'
                  : 'text-fydly-400 border-fydly-100 hover:bg-fydly-50 hover:text-fydly-700'
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10 items-start">

        {/* Sidebar Navigation */}
        <aside className="hidden lg:block sticky top-8">
          <Card className="p-2 border border-fydly-100/70 shadow-card">
            <p className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest px-4 pt-2 pb-3">Navigation</p>
            <nav className="flex flex-col gap-0.5">
              <NavItem href="#commerce" icon={Store} label="Profil Boutique" />
              <NavItem href="#fidelite" icon={Star} label="Programme Fidélité" />
              <NavItem href="#relances" icon={BellRing} label="Marketing Auto" />
              <NavItem href="#securite" icon={KeyRound} label="Accès & Sécurité" />
            </nav>
            <div className="mt-4 mx-2 mb-2 h-px bg-fydly-50" />
            <a
              href="#danger"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all group"
            >
              <Trash2 size={18} className="shrink-0" />
              <span>Danger Zone</span>
            </a>
          </Card>
        </aside>

        {/* Settings Content */}
        <div className="space-y-8">

          {/* ── Section: Profil Boutique ── */}
          <section id="commerce" className="scroll-mt-8">
            <Card className="border border-fydly-100/70 shadow-card overflow-hidden">
              {/* Section Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-fydly-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-fydly-50 flex items-center justify-center text-fydly-500">
                    <Store size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display text-fydly-900 leading-tight">Profil Boutique</h2>
                    <p className="text-[11px] text-fydly-400 font-medium">Informations visibles par vos clients</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-fydly-50 text-fydly-500 border-none font-bold tracking-widest text-[9px] hidden sm:flex">
                  GÉNÉRAL
                </Badge>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* Logo Upload + Avatar preview */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-fydly-50/80 to-white p-5 rounded-2xl border border-fydly-100/60">
                  <div className="relative shrink-0 group/avatar">
                    {/* Avatar actuel — initiales */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fydly-500 to-fydly-700 flex items-center justify-center text-white font-display text-2xl shadow-md shadow-fydly-500/20 select-none">
                      {initials}
                    </div>
                    {/* Overlay upload */}
                    <button
                      onClick={() => toast.info('Bientôt disponible')}
                      className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                      title="Changer le logo"
                    >
                      <Upload size={20} className="text-white" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-bold text-fydly-900 text-base mb-1">Logo de la boutique</h3>
                    <p className="text-xs text-fydly-400 font-medium mb-1">PNG ou JPG · 512×512 recommandé</p>
                    <p className="text-[10px] text-fydly-300 font-medium mb-3">En attendant, vos initiales sont utilisées automatiquement.</p>
                    <Button variant="secondary" className="h-9 px-5 text-xs bg-white border-fydly-100 hover:border-fydly-300">
                      <span className="flex items-center gap-1.5"><Upload size={13} /> Choisir un fichier</span>
                    </Button>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest pl-1">Nom commercial</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl border-fydly-100 focus:border-fydly-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest pl-1">Secteur d'activité</label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full h-12 px-4 bg-white border-2 border-fydly-100 rounded-xl text-fydly-900 font-semibold appearance-none hover:border-fydly-200 focus:border-fydly-500 focus:outline-none transition-all"
                    >
                      <option value="" disabled>Choisir un secteur...</option>
                      {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-fydly-50 flex flex-col sm:flex-row justify-end">
                  <Button
                    onClick={handleUpdateCommerce}
                    disabled={loading || !name.trim() || !sector}
                    className="h-11 px-8 text-sm w-full sm:w-auto"
                  >
                    {loading ? <span className="spinner" /> : (
                      <span className="flex items-center gap-2"><Check size={16} /> Enregistrer</span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Section: Programme Fidélité ── */}
          <section id="fidelite" className="scroll-mt-8">
            <Card className="border border-fydly-100/70 shadow-card overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-fydly-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-fydly-900 flex items-center justify-center text-white">
                    <Star size={16} className="fill-current" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display text-fydly-900 leading-tight">Programme Fidélité</h2>
                    <p className="text-[11px] text-fydly-400 font-medium">Définissez l'offre que vos clients voient</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-fydly-900 text-white border-none font-bold tracking-widest text-[9px] hidden sm:flex">
                  CORE VALUE
                </Badge>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-start">
                  {/* Threshold Counter */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest pl-1">Tampons requis</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        className="w-full h-20 rounded-2xl text-center font-display text-fydly-900 border-2 border-fydly-200 focus:border-fydly-500 focus:ring-[3px] focus:ring-fydly-500/10 focus:outline-none bg-white transition-all duration-150"
                        style={{ fontSize: '2.5rem' }}
                      />
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white text-[9px] font-bold text-fydly-400 uppercase tracking-widest px-3 py-0.5 border border-fydly-100 rounded-full whitespace-nowrap shadow-sm">
                        points / carte
                      </span>
                    </div>
                    <p className="text-[11px] text-fydly-400 font-medium text-center pt-1">Entre 2 et 20</p>
                  </div>

                  {/* Reward Description */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      <Star size={12} className="text-fydly-500 fill-current" />
                      Récompense offerte
                    </label>
                    <Input
                      maxLength={50}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex : Un café offert, -10% sur votre achat..."
                      className="h-14 rounded-xl text-base font-semibold placeholder:text-fydly-200"
                    />
                    <div className="bg-fydly-50/80 rounded-xl p-4 border border-fydly-100">
                      <p className="text-xs text-fydly-600 font-medium leading-relaxed">
                        <span className="font-bold text-fydly-800">Aperçu client :</span> Après {threshold} tampons, votre client remporte <span className="font-bold text-fydly-900">"{description || 'votre récompense'}"</span>.
                      </p>
                    </div>
                    <p className="text-[11px] text-fydly-400 font-medium italic">
                      Soignez votre offre, c'est ce qui fera revenir vos clients !
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-fydly-100 flex flex-col sm:flex-row justify-end">
                  <Button
                    variant="secondary"
                    onClick={handleUpdateReward}
                    className="h-11 px-8 text-sm bg-white border-fydly-200 hover:border-fydly-400 w-full sm:w-auto"
                    disabled={loading || !description.trim() || parseInt(threshold) < 2}
                  >
                    {loading ? <span className="spinner" /> : (
                      <span className="flex items-center gap-2"><Check size={16} /> Mettre à jour l'offre</span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Section: Marketing Automatique ── */}
          <section id="relances" className="scroll-mt-8">
            <Card className="border border-fydly-100/70 shadow-card overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-fydly-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${autoReminders ? 'bg-fydly-500 text-white shadow-md shadow-fydly-500/30' : 'bg-fydly-50 text-fydly-400'}`}>
                    <BellRing size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display text-fydly-900 leading-tight">Marketing Automatique</h2>
                    <p className="text-[11px] text-fydly-400 font-medium">Relances intelligentes sans effort</p>
                  </div>
                </div>
                <Badge variant="default" className={`border-none font-bold tracking-widest text-[9px] hidden sm:flex ${autoReminders ? 'bg-green-50 text-green-700' : 'bg-fydly-50 text-fydly-400'}`}>
                  {autoReminders ? 'ACTIF' : 'INACTIF'}
                </Badge>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* Toggle Row */}
                <div className="flex items-center justify-between p-5 bg-fydly-50/60 rounded-2xl border border-fydly-100/60">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div>
                      <h3 className="font-bold text-fydly-900 text-base">Notifications de rappel</h3>
                      <p className="text-xs text-fydly-400 font-medium mt-0.5">Relancez les clients absents depuis 30 jours.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoReminders(!autoReminders)}
                    className={`w-14 h-8 rounded-full transition-all duration-300 relative flex items-center px-1 shrink-0 ml-4 ${autoReminders ? 'bg-fydly-500' : 'bg-fydly-200'}`}
                    aria-label="Activer les relances automatiques"
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${autoReminders ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Message textarea (conditional) */}
                {autoReminders && (
                  <div className="space-y-3 animate-slide-down">
                    <label className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest pl-1">
                      Message de relance personnalisé
                    </label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        maxLength={140}
                        value={autoMessage}
                        onChange={(e) => setAutoMessage(e.target.value)}
                        className="w-full bg-white border-2 border-fydly-100 rounded-xl px-4 pt-4 pb-8 text-fydly-900 placeholder:text-fydly-300 focus:outline-none focus:border-fydly-500 transition-all resize-none font-medium text-sm leading-relaxed"
                      />
                      <span className="absolute bottom-3 right-4 text-[10px] font-bold text-fydly-300 uppercase tracking-widest">
                        {autoMessage.length}/140
                      </span>
                    </div>
                    <div className="flex items-start gap-2 bg-fydly-50/80 rounded-xl p-3 border border-fydly-100">
                      <span className="text-base mt-0.5">💡</span>
                      <p className="text-xs text-fydly-600 font-medium leading-relaxed">
                        Ce message sera envoyé automatiquement par Fydly aux clients n'ayant pas visité votre boutique depuis 30 jours.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-fydly-50 flex flex-col sm:flex-row justify-end">
                  <Button
                    onClick={handleUpdateReminders}
                    disabled={loading || (autoReminders && !autoMessage.trim())}
                    className="h-11 px-8 text-sm w-full sm:w-auto"
                  >
                    {loading ? <span className="spinner" /> : (
                      <span className="flex items-center gap-2"><Check size={16} /> Enregistrer les relances</span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Section: Accès & Sécurité ── */}
          <section id="securite" className="scroll-mt-8">
            <Card className="border border-fydly-100/70 shadow-card overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-fydly-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-fydly-50 flex items-center justify-center text-fydly-500">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display text-fydly-900 leading-tight">Accès & Sécurité</h2>
                    <p className="text-[11px] text-fydly-400 font-medium">Identifiants et protection du compte</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-50 text-green-700 border-none font-bold tracking-widest text-[9px] hidden sm:flex">
                  PROTÉGÉ
                </Badge>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest pl-1">Email administrateur</label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={session?.user?.email || ''}
                        disabled
                        className="h-12 rounded-xl bg-fydly-50 opacity-70 cursor-not-allowed pl-11 font-medium text-fydly-500"
                      />
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-300" />
                    </div>
                    <p className="text-[11px] text-fydly-400 font-medium pl-1">L'email ne peut pas être modifié.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest pl-1">Nouveau mot de passe</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8 caractères minimum"
                      className="h-12 rounded-xl border-fydly-100 focus:border-fydly-500 font-medium"
                    />
                    <p className="text-[11px] text-fydly-400 font-medium pl-1">Laissez vide pour ne pas modifier.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-fydly-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-fydly-400 font-medium">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Chiffrement AES-256 · Supabase Auth</span>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleUpdatePassword}
                    className="h-11 px-8 text-sm bg-white border-fydly-100 hover:border-fydly-300 w-full sm:w-auto"
                    disabled={loading || password.length < 8}
                  >
                    {loading ? <span className="spinner" /> : 'Mettre à jour le mot de passe'}
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Danger Zone ── */}
          <section id="danger" className="scroll-mt-8">
            <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50/60 to-white overflow-hidden">
              {/* Header danger */}
              <div className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-red-500/10 border-b border-red-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-red-300" />
                  <div className="w-2 h-2 rounded-full bg-red-200" />
                </div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Zone de danger — Actions irréversibles</p>
              </div>
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-fydly-900 text-base flex items-center gap-2">
                      Supprimer le compte
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Irréversible</span>
                    </h3>
                    <p className="text-xs text-fydly-500 font-medium leading-relaxed max-w-sm mt-1">
                      Toutes les données clients, cartes de fidélité et l'historique seront définitivement effacés. Cette action ne peut pas être annulée.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white border-none h-11 px-8 rounded-xl shadow-md shadow-red-600/20 font-bold text-sm shrink-0 transition-all active:scale-95"
                  disabled={loading}
                >
                  {loading ? <span className="spinner border-white" /> : (
                    <span className="flex items-center gap-2"><Trash2 size={15} /> Fermer mon commerce</span>
                  )}
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
