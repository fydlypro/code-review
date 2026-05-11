import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, AlertCircle, Clock, Megaphone, Target, Radio, Users, Send, Smartphone } from 'lucide-react'
import { supabase, Notification } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

import Card from '../../components/ui/Card'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

type Segment = 'all' | 'active' | 'inactive' | 'premium'

const SEGMENTS: { key: Segment; label: string; color: string; desc: string }[] = [
  { key: 'all', label: 'Tous', color: 'bg-fydly-500 text-white border-fydly-500', desc: 'Tous les clients' },
  { key: 'active', label: 'Actifs', color: 'bg-emerald-500 text-white border-emerald-500', desc: 'Clients actifs 30j' },
  { key: 'inactive', label: 'Inactifs', color: 'bg-amber-500 text-white border-amber-500', desc: 'Clients inactifs' },
  { key: 'premium', label: 'Premium', color: 'bg-violet-600 text-white border-violet-600', desc: 'Clients VIP' },
]

export default function NotificationsPage() {
  const { merchant } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [message, setMessage] = useState('')
  const [segment, setSegment] = useState<Segment>('all')

  useEffect(() => {
    if (merchant?.id) loadNotifications()
  }, [merchant?.id])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('merchant_id', merchant?.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotifications(data || [])
    } catch {
      toast.error("Erreur lors du chargement de l'historique.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!message.trim() || !merchant?.id) return
    setSending(true)
    try {
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: { merchant_id: merchant.id, message: message.trim(), segment },
      })
      const { data: countData } = await supabase
        .from('loyalty_cards')
        .select('id', { count: 'exact' })
        .eq('merchant_id', merchant.id)
      const { error: dbError } = await supabase.from('notifications').insert({
        merchant_id: merchant.id,
        message: message.trim(),
        segment,
        recipients_count: countData?.length || 0,
        status: pushError ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
      })
      if (dbError) throw dbError
      if (pushError) toast.error('Envoi partiel — vérifiez votre configuration OneSignal.')
      else toast.success('Campagne envoyée avec succès !')
      setMessage('')
      loadNotifications()
    } catch {
      toast.error("Erreur lors de l'envoi de la campagne.")
    } finally {
      setSending(false)
    }
  }

  const sentCount = notifications.filter(n => n.status === 'sent').length
  const totalRecipients = notifications.reduce((acc, n) => acc + (n.recipients_count || 0), 0)
  const openRate = notifications.length > 0 ? Math.round((sentCount / notifications.length) * 100) : 0

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sent': return { label: 'Envoyé', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' }
      case 'pending': return { label: 'En cours', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-400' }
      case 'failed': return { label: 'Échec', icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' }
      default: return { label: 'Inconnu', icon: Clock, className: 'bg-slate-50 text-slate-500 border-slate-100', dot: 'bg-slate-300' }
    }
  }

  const getSegmentLabel = (seg: string) => {
    switch (seg) {
      case 'all': return 'Tous les clients'
      case 'active': return 'Clients actifs'
      case 'inactive': return 'Clients inactifs'
      case 'premium': return 'Premium'
      default: return 'Ciblé'
    }
  }

  const charPct = Math.min((message.length / 280) * 100, 100)
  const charColor = message.length > 240 ? '#EF4444' : message.length > 180 ? '#F59E0B' : '#2563EB'

  return (
    <div className="animate-fade-in pb-20 lg:pb-12 space-y-6 sm:space-y-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Radio size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display text-slate-900 leading-tight">Campagnes</h1>
            <p className="text-slate-400 font-medium text-xs sm:text-sm">Envoyez des notifications push à vos clients.</p>
          </div>
        </div>
        <button
          onClick={handleSendCampaign}
          disabled={sending || !message.trim()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', minHeight: 44 }}
        >
          <Send size={16} />
          {sending ? 'Envoi...' : 'Nouvelle campagne'}
        </button>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Envoyées ce mois', value: notifications.filter(n => {
            const d = new Date(n.created_at)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length, icon: Megaphone, color: 'text-fydly-500', bg: 'bg-blue-50' },
          { label: "Taux d'ouverture", value: `${openRate}%`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Destinataires totaux', value: totalRecipients, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white shadow-card p-5 flex items-center gap-4" style={{ borderRadius: 20 }}>
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <div>
              <div className="text-2xl font-display text-slate-900 leading-none">{kpi.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── COMPOSER ── */}
      <div className="bg-white shadow-card p-6 sm:p-8" style={{ borderRadius: 20 }}>
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <Megaphone size={18} className="text-fydly-500" />
          <h2 className="text-lg font-display text-slate-900">Créer une campagne</h2>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
          <div className="space-y-6">
            {/* Textarea */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message</label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={280}
                  rows={4}
                  placeholder="Ex: Venez profiter de notre offre spéciale ce weekend ! Votre café vous attend ☕"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-fydly-500/40 focus:bg-white transition-all resize-none font-medium text-sm leading-relaxed"
                />
              </div>
              {/* Character counter */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${charPct}%`, background: charColor }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: charColor }}>
                  {message.length}/280
                </span>
              </div>
            </div>

            {/* Segments */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audience cible</label>
              <div className="flex flex-wrap gap-2">
                {SEGMENTS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSegment(s.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                      segment === s.key ? s.color : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${segment === s.key ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSendCampaign}
              disabled={sending || !message.trim()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              <Send size={16} />
              {sending ? 'Envoi en cours...' : 'Envoyer →'}
            </button>
          </div>

          {/* Phone preview */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aperçu</span>
            <div className="w-[220px] h-[420px] bg-slate-900 rounded-[32px] p-3 shadow-2xl flex flex-col relative overflow-hidden">
              {/* Screen */}
              <div className="flex-1 bg-slate-800 rounded-[24px] overflow-hidden flex flex-col">
                {/* Notch */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-16 h-1.5 bg-slate-600 rounded-full" />
                </div>
                {/* Status bar */}
                <div className="flex justify-between items-center px-4 py-1">
                  <span className="text-[8px] font-bold text-slate-400">9:41</span>
                  <div className="flex gap-1">
                    <span className="text-[8px] text-slate-400">●●●</span>
                  </div>
                </div>
                {/* Wallpaper area */}
                <div className="flex-1 p-2 flex flex-col justify-start pt-4">
                  {/* Notification card */}
                  <div className="bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                        <Bell size={12} className="text-white" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Fydly</span>
                      <span className="text-[8px] text-slate-400 ml-auto">maintenant</span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-800 leading-snug">
                      {message.trim() || 'Votre message apparaîtra ici...'}
                    </p>
                  </div>
                  {/* Faux icônes */}
                  <div className="mt-auto flex justify-center pb-2">
                    <div className="flex gap-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-white/10 rounded-xl" />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Home bar */}
                <div className="flex justify-center pb-2">
                  <div className="w-20 h-1 bg-slate-600 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Smartphone size={11} />
              Notification push live
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTORIQUE ── */}
      <div className="bg-white shadow-card overflow-hidden" style={{ borderRadius: 20 }}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-slate-400" />
            <h2 className="font-display text-slate-900 text-base">Historique des campagnes</h2>
          </div>
          {!loading && notifications.length > 0 && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {notifications.length} campagne{notifications.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3">
                <SkeletonLoader variant="rect" className="h-14 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Megaphone size={28} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-display text-slate-800 mb-1">Aucune campagne</h3>
            <p className="text-slate-400 font-medium text-sm">Composez votre premier message ci-dessus.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[45%]">Message</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audience</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {notifications.map(n => {
                    const status = getStatusConfig(n.status)
                    const StatusIcon = status.icon
                    return (
                      <tr key={n.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="bg-white border border-slate-100 group-hover:border-slate-200 rounded-xl p-3 relative overflow-hidden transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-fydly-500 rounded-r-full" />
                            <p className="pl-3 italic text-slate-600 font-medium text-sm leading-relaxed line-clamp-2">
                              "{n.message}"
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="text-slate-800 font-semibold text-xs mb-1">{getSegmentLabel(n.segment)}</div>
                          <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <Target size={10} />
                            {n.recipients_count} dest.
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                            <StatusIcon size={10} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {n.sent_at ? (
                            <div>
                              <div className="text-sm font-bold text-slate-800">
                                {new Date(n.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                {new Date(n.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-slate-50">
              {notifications.map(n => {
                const status = getStatusConfig(n.status)
                const StatusIcon = status.icon
                return (
                  <div key={n.id} className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                        <StatusIcon size={10} />
                        {status.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {getSegmentLabel(n.segment)} · {n.recipients_count} dest.
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600 text-sm font-medium leading-relaxed">
                      "{n.message}"
                    </div>
                    {n.sent_at && (
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {new Date(n.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
