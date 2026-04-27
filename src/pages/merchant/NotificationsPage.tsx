import { useEffect, useState } from 'react'
import { Bell, Search, CheckCircle2, AlertCircle, Clock, Megaphone, Target, Radio, Users } from 'lucide-react'
import { supabase, Notification } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

// UI Components
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import SkeletonLoader from '../../components/ui/SkeletonLoader'

export default function NotificationsPage() {
  const { merchant } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (merchant?.id) {
      loadNotifications()
    }
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
    } catch (e: any) {
      toast.error("Erreur lors du chargement de l'historique.")
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifs = notifications.filter(n =>
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sentCount = notifications.filter(n => n.status === 'sent').length
  const totalRecipients = notifications.reduce((acc, n) => acc + (n.recipients_count || 0), 0)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sent':
        return {
          label: 'Envoyé',
          icon: CheckCircle2,
          className: 'bg-green-50 text-green-700 border-green-100',
          dot: 'bg-green-500',
        }
      case 'pending':
        return {
          label: 'En cours',
          icon: Clock,
          className: 'bg-orange-50 text-orange-700 border-orange-100',
          dot: 'bg-orange-400',
        }
      case 'failed':
        return {
          label: 'Échec',
          icon: AlertCircle,
          className: 'bg-red-50 text-red-700 border-red-100',
          dot: 'bg-red-500',
        }
      default:
        return {
          label: 'Inconnu',
          icon: Clock,
          className: 'bg-fydly-50 text-fydly-500 border-fydly-100',
          dot: 'bg-fydly-300',
        }
    }
  }

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'all': return 'Tous les clients'
      case 'active': return 'Clients actifs'
      case 'inactive': return 'Clients inactifs'
      default: return 'Ciblé'
    }
  }

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'active': return '🟢'
      case 'inactive': return '🟠'
      default: return '👥'
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="animate-fade-in pb-20 lg:pb-12 max-w-6xl mx-auto px-2 sm:px-0">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-fydly-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-fydly-500/25">
            <Radio size={22} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-display text-fydly-900 leading-tight">Campagnes</h1>
            <p className="text-fydly-400 font-medium text-sm">Historique et performance de vos communications push.</p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      {!loading && notifications.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <Card className="p-4 sm:p-5 border border-fydly-100/70 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-fydly-50 flex items-center justify-center text-fydly-400 shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-2xl font-display text-fydly-900 leading-none">{notifications.length}</p>
                <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest mt-0.5">Campagnes</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 border border-fydly-100/70 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-2xl font-display text-fydly-900 leading-none">{sentCount}</p>
                <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest mt-0.5">Envoyées</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 border border-fydly-100/70 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-fydly-50 flex items-center justify-center text-fydly-500 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-display text-fydly-900 leading-none">{totalRecipients}</p>
                <p className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest mt-0.5">Destinataires</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Campaign History Card ── */}
      <Card className="border border-fydly-100/70 shadow-card overflow-hidden p-0">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-fydly-50 flex items-center justify-between gap-4 bg-white">
          <div className="relative flex-1 max-w-sm group">
            <Input
              placeholder="Rechercher une campagne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-10 rounded-xl border-fydly-100 group-hover:border-fydly-300 text-sm transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fydly-300 group-focus-within:text-fydly-500 transition-colors" size={17} />
          </div>
          {!loading && filteredNotifs.length > 0 && (
            <span className="text-[11px] font-bold text-fydly-400 uppercase tracking-widest hidden sm:block whitespace-nowrap">
              {filteredNotifs.length} résultat{filteredNotifs.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Mobile Timeline View ── */}
        <div className="sm:hidden divide-y divide-fydly-50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3">
                <SkeletonLoader variant="rect" className="h-14 w-full rounded-xl" />
                <div className="flex gap-2">
                  <SkeletonLoader variant="rect" className="h-7 w-24 rounded-full" />
                  <SkeletonLoader variant="rect" className="h-7 w-20 rounded-full" />
                </div>
              </div>
            ))
          ) : filteredNotifs.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="w-16 h-16 bg-fydly-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-fydly-200">
                <Megaphone size={28} />
              </div>
              <h3 className="text-lg font-display text-fydly-900 mb-1">Aucune campagne</h3>
              <p className="text-fydly-400 font-medium text-sm">Vous n'avez pas encore envoyé de notifications.</p>
            </div>
          ) : (
            <div className="relative">
              {filteredNotifs.map((n, idx) => {
                const status = getStatusConfig(n.status)
                const StatusIcon = status.icon
                return (
                  <div key={n.id} className="relative pl-10 pr-5 py-5">
                    {/* Timeline line */}
                    {idx < filteredNotifs.length - 1 && (
                      <div className="absolute left-[22px] top-10 bottom-0 w-px bg-fydly-100" />
                    )}
                    {/* Timeline dot */}
                    <div className={`absolute left-4 top-6 w-3 h-3 rounded-full border-2 border-white shadow-sm ${status.dot}`} />

                    <div className="space-y-2.5">
                      {/* Date */}
                      {n.sent_at && (
                        <p className="text-[10px] font-bold text-fydly-300 uppercase tracking-widest">
                          {formatDate(n.sent_at)} · {formatTime(n.sent_at)}
                        </p>
                      )}
                      {/* Message bubble */}
                      <div className="bg-fydly-50/70 p-3.5 rounded-xl border border-fydly-100 text-fydly-700 font-medium text-sm italic leading-relaxed">
                        "{n.message}"
                      </div>
                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-fydly-400 text-[10px] font-bold uppercase tracking-wide">
                          <span>{getSegmentIcon(n.segment)}</span>
                          {getSegmentLabel(n.segment)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-fydly-400 text-[10px] font-bold">
                          <Target size={10} />
                          {n.recipients_count} dest.
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Desktop Table View ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-fydly-50/60 border-b border-fydly-50">
                <th className="px-6 py-4 text-[10px] font-bold text-fydly-400 uppercase tracking-widest w-[42%]">Message</th>
                <th className="px-5 py-4 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">Audience</th>
                <th className="px-5 py-4 text-[10px] font-bold text-fydly-400 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-4 text-[10px] font-bold text-fydly-400 uppercase tracking-widest text-right">Date d'envoi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fydly-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-5"><SkeletonLoader variant="rect" className="h-12 w-full rounded-xl" /></td>
                    <td className="px-5 py-5"><SkeletonLoader variant="rect" className="h-8 w-28 rounded-lg" /></td>
                    <td className="px-5 py-5"><SkeletonLoader variant="rect" className="h-7 w-20 rounded-full" /></td>
                    <td className="px-6 py-5"><SkeletonLoader variant="rect" className="h-6 w-28 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredNotifs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="w-16 h-16 bg-fydly-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-fydly-200">
                      <Megaphone size={32} />
                    </div>
                    <h3 className="text-xl font-display text-fydly-900 mb-1">Aucune campagne</h3>
                    <p className="text-fydly-400 font-medium text-sm">Vous n'avez pas encore envoyé de notifications push.</p>
                  </td>
                </tr>
              ) : (
                filteredNotifs.map(n => {
                  const status = getStatusConfig(n.status)
                  const StatusIcon = status.icon
                  return (
                    <tr key={n.id} className="group hover:bg-fydly-50/30 transition-colors">
                      {/* Message */}
                      <td className="px-6 py-5">
                        <div className="bg-white p-3.5 rounded-xl border border-fydly-100 group-hover:border-fydly-200 transition-colors relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-fydly-500 rounded-r-full" />
                          <p className="pl-3 italic text-fydly-700 font-medium text-sm leading-relaxed">
                            "{n.message}"
                          </p>
                        </div>
                      </td>

                      {/* Audience */}
                      <td className="px-5 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-fydly-800 font-semibold text-xs">
                            <span>{getSegmentIcon(n.segment)}</span>
                            <span>{getSegmentLabel(n.segment)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-fydly-400 text-[10px] font-bold uppercase tracking-wider">
                            <Target size={10} />
                            {n.recipients_count} destinataires
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5 text-right">
                        {n.sent_at ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm font-bold text-fydly-900">{formatDate(n.sent_at)}</span>
                            <span className="text-[10px] font-bold text-fydly-400 bg-fydly-50 px-2 py-0.5 rounded-full border border-fydly-100">
                              {formatTime(n.sent_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-fydly-300 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          {!loading && filteredNotifs.length > 0 && (
            <div className="px-6 py-4 bg-fydly-50/50 border-t border-fydly-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-fydly-400 uppercase tracking-widest">
                {filteredNotifs.length} campagne{filteredNotifs.length > 1 ? 's' : ''} enregistrée{filteredNotifs.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                <CheckCircle2 size={11} />
                Services opérationnels
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
