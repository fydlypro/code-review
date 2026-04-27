import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import {
  LogOut, BellRing, BellOff, AlertTriangle,
  User, Shield, ChevronRight, Loader2, FileText, Smartphone
} from 'lucide-react'
import {
  isPushEnabled,
  requestNotificationPermission,
  disablePushNotifications,
  registerOneSignalPlayer
} from '../../lib/onesignal'

// UI Components
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

/** iOS Safari hors mode standalone (PWA) : les notifications push ne fonctionnent pas */
function isIOSSafariWithoutPWA(): boolean {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())
  if (!isIOS) return false
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  return !isStandalone
}

// Composant réutilisable ligne de settings
function SettingsRow({
  icon,
  label,
  sublabel,
  onClick,
  rightSlot,
  iconBg = 'bg-fydly-50',
  iconColor = 'text-fydly-400',
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onClick?: () => void
  rightSlot?: React.ReactNode
  iconBg?: string
  iconColor?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 transition-all duration-200 rounded-xl
        ${onClick ? 'hover:bg-fydly-50/80 active:scale-[0.99] cursor-pointer group' : ''}`}
    >
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center ${iconColor} shrink-0 transition-colors`}>
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-fydly-900 font-bold text-sm leading-tight">{label}</p>
        {sublabel && <p className="text-fydly-400 text-xs font-medium mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      {rightSlot ?? (onClick && <ChevronRight size={16} className="text-fydly-200 group-hover:translate-x-0.5 transition-transform shrink-0" />)}
    </Tag>
  )
}

export default function SettingsPage() {
  const { customer, user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({})
  const iosWithoutPWA = isIOSSafariWithoutPWA()
  const notifBlocked = typeof Notification !== "undefined" && Notification.permission === "denied"

  useEffect(() => {
    const checkPush = async () => {
      const enabled = await isPushEnabled()
      setNotificationsEnabled(enabled)
    }
    checkPush()
  }, [])

  const handleLogout = async () => {
    try {
      setLoadingObj(prev => ({ ...prev, logout: true }))
      await supabase.auth.signOut()
      navigate('/customer/auth')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingObj(prev => ({ ...prev, logout: false }))
    }
  }

  const toggleNotifications = async () => {
    if (notifLoading) return
    setNotifLoading(true)
    try {
      if (!notificationsEnabled) {
        // Permission bloquée au niveau OS
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          toast.error("Notifications bloquées — activez-les dans Réglages > Notifications > Fydly")
          return
        }

        const granted = await requestNotificationPermission()
        if (granted) {
          if (customer?.id) {
            // Fire-and-forget — APNs peut prendre 20-30s sur iOS
            registerOneSignalPlayer(customer.id).catch(() => {})
          }
          setNotificationsEnabled(true)
          toast.success("Notifications activées !")
        } else {
          // Permission refusée par l'utilisateur dans le navigateur
          if (typeof Notification !== "undefined" && Notification.permission === "denied") {
            toast.error("Bloquées dans les réglages — activez-les dans Réglages > Notifications > Fydly")
          } else {
            toast.error("Vous avez refusé. Réessayez depuis les réglages de votre navigateur.")
          }
        }
      } else {
        await disablePushNotifications()
        setNotificationsEnabled(false)
        toast.success("Notifications désactivées")
      }
    } catch (err: any) {
      toast.error("Erreur lors de la modification des notifications")
    } finally {
      setNotifLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Êtes-vous sûr ? Cette action supprimera définitivement vos cartes et tampons.")
    if (!confirmed) return

    try {
      setLoadingObj(prev => ({ ...prev, delete: true }))
      const { error } = await supabase.functions.invoke('delete-customer-account')
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/customer/auth')
    } catch (e: any) {
      toast.error("Erreur lors de la suppression. Contactez le support si le problème persiste.")
    } finally {
      setLoadingObj(prev => ({ ...prev, delete: false }))
    }
  }

  const initials = customer?.first_name?.[0]?.toUpperCase() || 'C'

  return (
    <div className="space-y-7 pb-10 animate-fade-in">

      {/* Header page */}
      <div className="pt-1">
        <h2 className="text-[28px] font-display text-fydly-900 leading-tight">Paramètres</h2>
        <p className="text-fydly-400 font-medium text-sm mt-0.5">Votre compte & préférences</p>
      </div>

      {/* ── Section : Profil ── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold text-fydly-300 uppercase tracking-widest px-1">Mon profil</p>

        <Card className="p-5 border border-fydly-100 shadow-card">
          <div className="flex items-center gap-4">
            {/* Avatar initiales */}
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-fydly-400 to-fydly-600 text-white rounded-2xl flex items-center justify-center text-2xl font-display shadow-md shadow-fydly-500/20 shrink-0">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-fydly-900 truncate leading-tight">
                {customer?.first_name || 'Client Fydly'}
              </p>
              <p className="text-fydly-400 font-medium text-sm truncate mt-0.5">{user?.email}</p>
            </div>

            <Badge variant="default" className="hidden sm:flex rounded-[100px] shrink-0">Membre</Badge>
          </div>
        </Card>
      </section>

      {/* ── Section : Notifications ── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold text-fydly-300 uppercase tracking-widest px-1">Préférences</p>

        <Card className="border border-fydly-100 shadow-card overflow-hidden p-0">
          {iosWithoutPWA ? (
            /* iOS Safari hors mode PWA */
            <SettingsRow
              icon={<Smartphone size={18} />}
              label="Notifications Push"
              sublabel="Sur iPhone, installez Fydly sur l'écran d'accueil (Partager → Sur l'écran d'accueil) pour activer les notifications."
              iconBg="bg-fydly-50"
              iconColor="text-fydly-300"
            />
          ) : notifBlocked ? (
            /* Permission bloquée OS */
            <SettingsRow
              icon={<BellOff size={18} />}
              label="Notifications bloquées"
              sublabel="Activez-les dans Réglages › Notifications › Fydly"
              iconBg="bg-orange-50"
              iconColor="text-orange-400"
            />
          ) : (
            /* Toggle normal */
            <button
              onClick={toggleNotifications}
              disabled={notifLoading}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-fydly-50/80 transition-all duration-200 disabled:opacity-60 disabled:cursor-wait rounded-xl"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0
                ${notificationsEnabled ? 'bg-green-50 text-green-500' : 'bg-fydly-50 text-fydly-300'}`}
              >
                {notifLoading
                  ? <Loader2 size={18} className="animate-spin text-fydly-400" />
                  : notificationsEnabled ? <BellRing size={18} /> : <BellOff size={18} />
                }
              </div>
              <div className="flex-1 text-left">
                <p className="text-fydly-900 font-bold text-sm">Notifications Push</p>
                <p className="text-fydly-400 text-xs font-medium mt-0.5">
                  {notifLoading
                    ? "Chargement…"
                    : notificationsEnabled
                      ? "Activées — tampons et cadeaux en temps réel"
                      : "Activez les alertes de tampons & cadeaux"
                  }
                </p>
              </div>
              {/* Toggle switch */}
              {!notifLoading && (
                <div className={`w-12 h-7 rounded-full relative flex items-center shrink-0 transition-colors duration-300 shadow-inner
                  ${notificationsEnabled ? 'bg-green-500' : 'bg-fydly-150 bg-fydly-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute shadow-md transition-all duration-300
                    ${notificationsEnabled ? 'translate-x-[24px]' : 'translate-x-1'}`}
                  />
                </div>
              )}
            </button>
          )}
        </Card>
      </section>

      {/* ── Section : Légal & Sécurité ── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold text-fydly-300 uppercase tracking-widest px-1">Légal & Sécurité</p>

        <Card className="border border-fydly-100 shadow-card overflow-hidden p-0 divide-y divide-fydly-50">
          <SettingsRow
            icon={<Shield size={18} />}
            label="Confidentialité"
            sublabel="Politique de données & RGPD"
            onClick={() => {}}
          />
          <SettingsRow
            icon={<FileText size={18} />}
            label="Conditions d'utilisation"
            sublabel="CGU Fydly"
            onClick={() => {}}
          />
        </Card>
      </section>

      {/* ── Actions compte ── */}
      <div className="space-y-3 pt-2">
        <Button
          variant="secondary"
          className="w-full h-13 bg-fydly-50 border-fydly-100 text-fydly-700 hover:bg-fydly-100 font-bold"
          onClick={handleLogout}
          isLoading={loadingObj.logout}
        >
          <div className="flex items-center justify-center gap-2.5">
            <LogOut size={18} className="text-fydly-400" />
            <span>Se déconnecter</span>
          </div>
        </Button>

        {/* Zone danger */}
        <div className="rounded-card border border-red-100 bg-red-50/40 overflow-hidden">
          <button
            onClick={handleDeleteAccount}
            disabled={loadingObj.delete}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-4 text-red-500 font-bold text-sm hover:bg-red-100/50 transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            <AlertTriangle size={16} />
            {loadingObj.delete ? "Suppression en cours…" : "Supprimer mon compte définitivement"}
          </button>
        </div>
      </div>

      {/* Version */}
      <p className="text-center text-fydly-200 text-xs font-medium pb-2">Fydly · v1.0</p>
    </div>
  )
}
