import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, BellRing, BellOff, AlertTriangle } from 'lucide-react'

export default function Settings() {
  const { customer, user } = useAuth()
  const navigate = useNavigate()
  const [notificationsEnabled, setNotificationsEnabled] = useState(!!customer?.onesignal_player_id)
  const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({})

  const handleLogout = async () => {
    try {
      setLoadingObj({ ...loadingObj, logout: true })
      await supabase.auth.signOut()
      navigate('/customer/auth')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingObj({ ...loadingObj, logout: false })
    }
  }

  const toggleNotifications = async () => {
    // Ideally this connects to actual OneSignal React native / web push hooks later
    // For now we simulate the state update visually
    const nextState = !notificationsEnabled
    setNotificationsEnabled(nextState)
    toast.success(nextState ? "Notifications activées" : "Notifications désactivées")
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre compte Fydly ? Cette action est irréversible et supprimera toutes vos cartes de fidélité.")) {
      return
    }

    try {
      setLoadingObj({ ...loadingObj, delete: true })
      // RPC pour appeler Edge Function / Supabase Admin pour supprimer le Auth User
      // Ou simple appel supabase.auth.admin si activé (souvent edge function est requise pour auth wipe)
      // Pour le template Frontend :
      toast.success("Votre demande de suppression a été envoyée.")
      await supabase.auth.signOut()
      navigate('/customer/auth')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingObj({ ...loadingObj, delete: false })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-[#0D47A1] mb-6 pt-4">Paramètres</h2>

      <div className="space-y-4">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
          <p className="text-sm text-blue-500 font-medium">Connecté(e) en tant que</p>
          <p className="text-lg font-bold text-blue-900">{customer?.first_name || 'Client Fydly'}</p>
          <p className="text-md text-[#1565C0]">{user?.email}</p>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-blue-50">
          <button 
            onClick={toggleNotifications}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 text-blue-900 font-medium">
              {notificationsEnabled ? <BellRing size={20} className="text-blue-500" /> : <BellOff size={20} className="text-gray-400" />}
              Notifications Push
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${notificationsEnabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-red-50 mt-8">
          <button 
            onClick={handleLogout}
            disabled={loadingObj.logout}
            className="w-full flex items-center gap-3 p-4 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
          >
            <LogOut size={20} className="text-gray-500" />
            {loadingObj.logout ? "Déconnexion..." : "Se déconnecter"}
          </button>

          <button 
            onClick={handleDeleteAccount}
            disabled={loadingObj.delete}
            className="w-full flex items-center gap-3 p-4 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors mt-2"
          >
            <AlertTriangle size={20} className="text-red-500" />
            {loadingObj.delete ? "Suppression en cours..." : "Supprimer mon compte"}
          </button>
        </div>
      </div>
    </div>
  )
}
