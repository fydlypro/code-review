import React, { useEffect, useState } from 'react'
import { Bell, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { supabase, Notification } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function MerchantNotifications() {
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
      toast.error('Erreur lors du chargement de l\'historique.')
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifs = notifications.filter(n =>
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'sent': return <CheckCircle2 size={16} className="text-green-500" />
      case 'pending': return <Clock size={16} className="text-orange-500" />
      case 'failed': return <AlertCircle size={16} className="text-red-500" />
      default: return null
    }
  }

  const getSegmentLabel = (segment: string) => {
    switch(segment) {
      case 'all': return 'Tous les clients'
      case 'active': return 'Clients actifs'
      case 'inactive': return 'Clients inactifs'
      default: return 'Ciblé' // ex: personnal notification specific to a user
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fydly-900">Historique des envois</h1>
          <p className="text-fydly-600 font-medium">Consultez les notifications push envoyées.</p>
        </div>
      </div>

      <div className="card space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Rechercher un message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-11"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fydly-400" size={18} />
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto rounded-xl border border-fydly-100">
          <table className="w-full text-left min-w-[700px]">
             <thead className="bg-fydly-50 border-b border-fydly-100">
               <tr>
                 <th className="table-header w-[40%]">Message envoyé</th>
                 <th className="table-header">Audience ciblée</th>
                 <th className="table-header text-center">Statut</th>
                 <th className="table-header text-right">Date d'envoi</th>
               </tr>
             </thead>
             <tbody className="bg-white hover:bg-white/50">
                {loading ? (
                   Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-fydly-50">
                      <td className="p-4"><div className="skeleton h-10 w-full rounded-lg" /></td>
                      <td className="p-4"><div className="skeleton h-6 w-24 rounded-lg" /></td>
                      <td className="p-4"><div className="skeleton h-6 w-16 mx-auto rounded-full" /></td>
                      <td className="p-4"><div className="skeleton h-6 w-32 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredNotifs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-fydly-500 font-medium">
                      <Bell size={48} className="mx-auto mb-3 text-fydly-200" />
                      Aucune notification {searchQuery && "ne correspond à votre recherche"}.
                    </td>
                  </tr>
                ) : (
                  filteredNotifs.map(n => (
                    <tr key={n.id} className="table-row">
                      <td className="table-cell">
                        <p className="text-fydly-900 font-medium">"{n.message}"</p>
                      </td>
                      <td className="table-cell">
                        <span className="font-bold text-fydly-800 text-sm">{getSegmentLabel(n.segment)}</span>
                        <span className="text-xs text-fydly-500 ml-2 bg-fydly-50 px-2 py-0.5 rounded-full">
                          {n.recipients_count} dest.
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm" title={n.status}>
                           {getStatusIcon(n.status)}
                        </div>
                      </td>
                      <td className="table-cell text-right text-fydly-600 font-medium text-sm">
                        {n.sent_at ? (
                          <>
                            {new Date(n.sent_at).toLocaleDateString('fr-FR')} à {new Date(n.sent_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          </>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}
