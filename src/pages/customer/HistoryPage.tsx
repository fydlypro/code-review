import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Transaction, Merchant } from '../../lib/supabase'
import { ChevronLeft, Calendar, RefreshCw } from 'lucide-react'

type PopulatedTransaction = Transaction & { merchants: Pick<Merchant, 'name'> }

type FilterTab = 'all' | 'stamps' | 'rewards'

function groupByDate(transactions: PopulatedTransaction[]): { label: string; items: PopulatedTransaction[] }[] {
  const groups: Record<string, PopulatedTransaction[]> = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  transactions.forEach(t => {
    const d = new Date(t.created_at)
    const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    let label: string
    if (dDay.getTime() === today.getTime()) label = "Aujourd'hui"
    else if (dDay.getTime() === yesterday.getTime()) label = 'Hier'
    else label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(t)
  })

  return Object.entries(groups).map(([label, items]) => ({ label, items }))
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function HistoryPage() {
  const { customer } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<PopulatedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  useEffect(() => {
    if (!customer?.id) return
    loadHistory()
  }, [customer?.id])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setHasError(false)
      const { data, error } = await supabase.rpc('get_customer_history')
      if (error) throw error
      setTransactions((data as PopulatedTransaction[]) || [])
    } catch (e) {
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  const filtered = transactions.filter(t => {
    if (activeFilter === 'stamps') return t.type === 'earn'
    if (activeFilter === 'rewards') return t.type !== 'earn'
    return true
  })

  const groups = groupByDate(filtered)

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'stamps', label: 'Tampons' },
    { key: 'rewards', label: 'Récompenses' },
  ]

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 18px 100px' }}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-200 rounded-[10px]" />
            <div className="h-7 w-32 bg-slate-200 rounded-full" />
          </div>
          <div className="h-10 bg-slate-200 rounded-[12px]" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-[16px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 18px 100px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: 10, background: '#fff',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0
          }}
        >
          <ChevronLeft size={18} style={{ color: '#334155' }} />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', flex: 1 }}>Mes visites</h1>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#64748b',
          background: '#f1f5f9', borderRadius: 100, padding: '4px 12px'
        }}>
          {transactions.length} visite{transactions.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* FILTRE TABS */}
      <div style={{
        marginTop: 16, display: 'flex', gap: 6, padding: 4,
        background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeFilter === tab.key ? '#0f172a' : 'transparent',
              color: activeFilter === tab.key ? '#fff' : '#94a3b8'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ERREUR */}
      {hasError && (
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
          </div>
          <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Erreur de chargement</p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Impossible de récupérer votre historique.</p>
          <button
            onClick={loadHistory}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 700,
              fontSize: 13, background: 'none', border: 'none', cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
        </div>
      )}

      {/* ÉTAT VIDE */}
      {!hasError && filtered.length === 0 && (
        <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Calendar size={28} style={{ color: '#93c5fd' }} />
          </div>
          <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 6 }}>Aucune visite pour l'instant</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>Vos visites apparaîtront ici</p>
        </div>
      )}

      {/* GROUPES PAR DATE (TIMELINE) */}
      {!hasError && groups.map(group => (
        <div key={group.label} style={{ marginTop: 16 }}>
          {/* Label groupe */}
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 10
          }}>
            {group.label}
          </p>

          {/* Timeline verticale */}
          <div style={{ position: 'relative', paddingLeft: 18 }}>
            {/* Ligne verticale */}
            <div style={{
              position: 'absolute', left: 5, top: 6, bottom: 6,
              width: 2, background: '#f1f5f9', borderRadius: 2, pointerEvents: 'none'
            }} />

            {group.items.map(t => {
              const isEarn = t.type === 'earn'
              const date = new Date(t.created_at)
              const merchantInitials = getInitials(t.merchants.name)

              return (
                <div key={t.id} style={{ position: 'relative', marginBottom: 10 }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -16, top: 14,
                    width: 12, height: 12, borderRadius: '50%',
                    background: isEarn ? '#2563EB' : '#FBBF24',
                    border: '3px solid #f8fafc', zIndex: 1
                  }} />

                  {/* Card */}
                  <div style={{
                    background: '#fff', borderRadius: 16, padding: 12, border: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    {/* Avatar initiales */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#2563EB'
                    }}>
                      {merchantInitials}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', flex: 1, minWidth: 0 }} className="truncate">
                          {t.merchants.name}
                        </p>
                        <span style={{
                          fontSize: 11, fontWeight: 600, borderRadius: 100, padding: '3px 10px', flexShrink: 0,
                          background: isEarn ? '#EFF6FF' : '#FEF3C7',
                          color: isEarn ? '#2563EB' : '#92400e'
                        }}>
                          {isEarn ? '⚡ Tampon gagné' : '🎁 Récompense'}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace', marginTop: 2 }}>
                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
