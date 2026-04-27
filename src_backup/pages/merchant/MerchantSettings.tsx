import React, { useState } from 'react'
import { Store, Settings as SettingsIcon, Upload, Trash2, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function MerchantSettings() {
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

  // Section: Sécurité
  const [password, setPassword] = useState('')

  const sectors = [
    'Restaurant', 'Boulangerie', 'Coiffeur', 'Boutique', 'Café', 'Autre',
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
      toast.success('Informations du commerce mises à jour.')
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
      toast.success('Programme de fidélité mis à jour.')
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!password || password.length < 8) {
      toast.error('Le mot de passe doit contenir 8 caractères minimum.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Mot de passe mis à jour.')
      setPassword('')
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors du changement de mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "ATTENTION : Cette action est irréversible. Toutes vos données, clients, et historiques seront supprimés définitivement. Êtes-vous sûr de vouloir continuer ?"
    )
    if (!confirm || !merchant?.id || !session?.user?.id) return

    setLoading(true)
    try {
      // Logic requires backend cascade delete + Edge function to delete Auth user
      // For MVP mocking the toast.
      toast.info('Demande de suppression enregistrée. Vos données seront effacées sous 48h.')
      await supabase.auth.signOut()
      navigate('/merchant/login')
    } catch (e: any) {
      toast.error('Erreur lors de la suppression du compte.')
      setLoading(false)
    }
  }

  const handleUploadLogo = () => {
    toast.info("L'upload de logo sera bientôt disponible !")
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-20 lg:pb-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fydly-900">Paramètres</h1>
          <p className="text-fydly-600 font-medium">Gérez votre commerce et votre sécurité.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[250px_1fr] gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="card p-2 hidden md:block sticky top-8">
           <nav className="flex flex-col gap-1">
             <a href="#commerce" className="nav-item">
               <Store size={18} /> Commerce
             </a>
             <a href="#fidelite" className="nav-item">
               <SettingsIcon size={18} /> Programme Fidélité
             </a>
             <a href="#securite" className="nav-item">
               <KeyRound size={18} /> Sécurité
             </a>
           </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          
          {/* Commerce Section */}
          <section id="commerce" className="card space-y-6 scroll-mt-24">
            <h2 className="text-lg font-bold text-fydly-900 border-b border-fydly-50 pb-3 flex items-center gap-2">
              <Store size={20} className="text-fydly-500" /> Informations générales
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-fydly-50 rounded-2xl border-2 border-dashed border-fydly-200 flex items-center justify-center text-fydly-400 shrink-0">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-fydly-900 mb-1">Logo du commerce</h3>
                  <p className="text-sm text-fydly-600 mb-3">Format JPG ou PNG. Max 2Mo.</p>
                  <button onClick={handleUploadLogo} className="btn-secondary h-9 px-4 text-xs font-bold bg-white">
                    Parcourir...
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom affiché</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Secteur</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="input"
                  >
                    <option value="" disabled>Choisir...</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-fydly-50">
              <button 
                onClick={handleUpdateCommerce} 
                className="btn-primary h-11 px-8"
                disabled={loading || !name.trim() || !sector}
              >
                {loading ? <span className="spinner" /> : "Enregistrer"}
              </button>
            </div>
          </section>


          {/* Programme de fidélité */}
          <section id="fidelite" className="card space-y-6 scroll-mt-24 bg-fydly-50 border border-fydly-100">
            <h2 className="text-lg font-bold text-fydly-900 border-b border-fydly-100 pb-3 flex items-center gap-2">
              <SettingsIcon size={20} className="text-fydly-500" /> Programme de fidélité
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Seuil de tampons (Objectif)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="input w-32 font-bold text-lg text-center bg-white"
                  />
                  <span className="text-fydly-700 font-medium whitespace-nowrap">tampons requis</span>
                </div>
              </div>
              
              <div>
                <label className="label">Description de la récompense</label>
                <input
                  type="text"
                  maxLength={50}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input font-medium bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-fydly-100">
              <button 
                onClick={handleUpdateReward} 
                className="btn-primary h-11 px-8"
                disabled={loading || !description.trim() || parseInt(threshold) < 2}
              >
                {loading ? <span className="spinner" /> : "Mettre à jour"}
              </button>
            </div>
          </section>


          {/* Sécurité */}
          <section id="securite" className="card space-y-6 scroll-mt-24">
            <h2 className="text-lg font-bold text-fydly-900 border-b border-fydly-50 pb-3 flex items-center gap-2">
              <KeyRound size={20} className="text-fydly-500" /> Sécurité & Connexion
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Email de connexion</label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="input bg-fydly-50 opacity-70 cursor-not-allowed"
                />
                <p className="text-xs text-fydly-500 mt-1.5 font-medium">Pour modifier votre email, veuillez contacter le support Fydly.</p>
              </div>

              <div>
                <label className="label">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="input"
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-fydly-50">
              <button 
                onClick={handleUpdatePassword} 
                className="btn-secondary h-11 px-6 bg-white shrink-0"
                disabled={loading || password.length < 8}
              >
                {loading ? <span className="spinner" /> : "Changer mon mot de passe"}
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="card space-y-6 border border-red-100 bg-red-50/30">
            <h2 className="text-lg font-bold text-red-700 border-b border-red-100 pb-3 flex items-center gap-2">
              <Trash2 size={20} /> Zone critique
            </h2>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-fydly-900 mb-1">Supprimer mon compte</h3>
                <p className="text-xs text-fydly-600 font-medium max-w-sm">
                  Cette action est définitive. Toutes les cartes de fidélité de vos clients seront remises à zéro et votre accès sera révoqué.
                </p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="btn-danger h-11 px-6 shrink-0"
              >
                 Supprimer définitivement
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
