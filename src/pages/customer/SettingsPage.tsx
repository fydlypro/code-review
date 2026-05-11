import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import {
  LogOut, BellRing, BellOff, Trash2,
  User, Mail, ChevronRight, Loader2, Smartphone, Phone
} from 'lucide-react'
import {
  isPushEnabled,
  requestNotificationPermission,
  disablePushNotifications,
  registerOneSignalPlayer
} from '../../lib/onesignal'

function isIOSSafariWithoutPWA(): boolean {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())
  if (!isIOS) return false
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  return !isStandalone
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
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          toast.error("Notifications bloquées — activez-les dans Réglages > Notifications > Fydly")
          return
        }
        const granted = await requestNotificationPermission()
        if (granted) {
          if (customer?.id) {
            registerOneSignalPlayer(customer.id).catch(() => {})
          }
          setNotificationsEnabled(true)
          toast.success("Notifications activées !")
        } else {
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

  const firstName = customer?.first_name || 'Client'
  const firstInitial = firstName[0]?.toUpperCase() || 'C'
  const initials = firstInitial

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 18px 100px' }}>

      {/* H1 */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 0 }}>Mon compte</h1>

      {/* CARD PROFIL */}
      <div style={{
        marginTop: 16, background: '#fff', borderRadius: 20, padding: 16,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', lineHeight: 1.2 }}>
            {firstName}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{user?.email}</p>
          {memberSince && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
              fontSize: 11, fontWeight: 600, color: '#059669',
              background: '#ECFDF5', borderRadius: 100, padding: '3px 10px'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Client depuis {memberSince}
            </span>
          )}
        </div>
      </div>

      {/* SECTION PROFIL */}
      <p style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 20, marginBottom: 8 }}>
        PROFIL
      </p>
      <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {/* Prénom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f8fafc' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={16} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>Prénom</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{firstName}</p>
          </div>
        </div>
        {/* Email */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f8fafc' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={16} style={{ color: '#94a3b8' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>Email</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>{user?.email}</p>
          </div>
        </div>
        {/* Téléphone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Phone size={16} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>Téléphone (optionnel)</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>Non renseigné</p>
          </div>
        </div>
      </div>
      <button
        style={{
          width: '100%', marginTop: 12, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700
        }}
      >
        Enregistrer
      </button>

      {/* SECTION NOTIFICATIONS */}
      <p style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 20, marginBottom: 8 }}>
        NOTIFICATIONS
      </p>
      <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {iosWithoutPWA ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Smartphone size={18} style={{ color: '#94a3b8' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Notifications Push</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>
                Installez Fydly sur l'écran d'accueil pour activer les notifications.
              </p>
            </div>
          </div>
        ) : notifBlocked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BellOff size={18} style={{ color: '#F97316' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Notifications bloquées</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Activez-les dans Réglages › Notifications › Fydly</p>
            </div>
          </div>
        ) : (
          <button
            onClick={toggleNotifications}
            disabled={notifLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: notificationsEnabled ? '#ECFDF5' : '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {notifLoading
                ? <Loader2 size={18} style={{ color: '#94a3b8' }} className="animate-spin" />
                : notificationsEnabled
                  ? <BellRing size={18} style={{ color: '#10B981' }} />
                  : <BellOff size={18} style={{ color: '#2563EB' }} />
              }
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Notifications Push</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {notifLoading ? "Chargement…" : notificationsEnabled ? "Activées" : "Désactivées"}
              </p>
            </div>
            {/* Toggle switch */}
            {!notifLoading && (
              <div style={{
                width: 48, height: 28, borderRadius: 100, position: 'relative', flexShrink: 0,
                background: notificationsEnabled ? '#10B981' : '#e2e8f0',
                transition: 'background 0.3s'
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute',
                  top: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  left: notificationsEnabled ? 24 : 4, transition: 'left 0.3s'
                }} />
              </div>
            )}
          </button>
        )}
      </div>

      {/* SECTION DONNÉES */}
      <p style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 20, marginBottom: 8 }}>
        DONNÉES
      </p>
      <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {[
          { label: 'Mes données (export RGPD)' },
          { label: 'Politique de confidentialité' },
          { label: "Conditions d'utilisation" },
        ].map((item, i, arr) => (
          <button
            key={item.label}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none'
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.label}</span>
            <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
          </button>
        ))}
      </div>

      {/* DANGER ZONE */}
      <div style={{
        marginTop: 20, border: '1px solid #FEE2E2', background: '#FFF5F5',
        borderRadius: 20, padding: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={18} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#EF4444' }}>Supprimer mon compte</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Action irréversible.</p>
          </div>
        </div>
        <button
          onClick={handleDeleteAccount}
          disabled={loadingObj.delete}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700
          }}
        >
          {loadingObj.delete ? "Suppression en cours…" : "Supprimer"}
        </button>
      </div>

      {/* BOUTON DÉCONNEXION */}
      <button
        onClick={handleLogout}
        disabled={loadingObj.logout}
        style={{
          width: '100%', marginTop: 16, padding: '14px 0', borderRadius: 12,
          background: '#fff', border: '1px solid #e2e8f0', color: '#EF4444',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}
      >
        {loadingObj.logout
          ? <Loader2 size={16} className="animate-spin" style={{ color: '#EF4444' }} />
          : <LogOut size={16} style={{ color: '#EF4444' }} />
        }
        Se déconnecter
      </button>

      {/* FOOTER */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 16 }}>
        Fydly v2.0 — Fait avec ❤️ pour le commerce local
      </p>
    </div>
  )
}
