import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export interface AnalyticsData {
  newClientsThisMonth: number
  newClientsPrevMonth: number
  returnRate: number
  totalVisitsThisMonth: number
  totalVisitsPrevMonth: number
  rewardsRedeemedThisMonth: number
  totalClients: number
  transactions: Array<{ created_at: string; type: string; customer_id: string }>
  loyaltyCards: Array<{
    balance: number
    total_earned: number
    last_scan_at: string | null
    created_at: string
  }>
  recentNotifications: Array<{
    id: string
    message: string
    sent_at: string | null
    recipients_count: number
    status: string
    visitsAfter: number
  }>
  lastNotificationDate: string | null
}

export function useAnalytics(merchantId: string | undefined, _rewardThreshold: number) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const cacheRef = useRef<{ data: AnalyticsData; timestamp: number } | null>(null)
  const loadingRef = useRef(false)

  const load = useCallback(async (force = false) => {
    if (!merchantId || loadingRef.current) return

    if (!force && cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_TTL) {
      setData(cacheRef.current.data)
      setLoading(false)
      return
    }

    loadingRef.current = true
    setLoading(true)
    setError(false)

    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // All queries use SECURITY DEFINER RPCs — no RLS issues
      const [rawRes, kpisRes, notifRes] = await Promise.all([
        supabase.rpc('get_merchant_analytics_raw', {
          p_merchant_id: merchantId,
          p_days: 90,
        }),
        supabase.rpc('get_merchant_kpis', {
          p_merchant_id: merchantId,
        }),
        supabase
          .from('notifications')
          .select('id, message, sent_at, recipients_count, status')
          .eq('merchant_id', merchantId)
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(5),
      ])

      if (rawRes.error) throw rawRes.error
      if (kpisRes.error) throw kpisRes.error

      const raw = rawRes.data as {
        transactions: Array<{ created_at: string; type: string; customer_id: string }>
        loyalty_cards: Array<{ balance: number; total_earned: number; last_scan_at: string | null; created_at: string }>
      }

      const kpis = kpisRes.data as {
        total_clients: number
        stamps_month: number
        rewards_month: number
        inactive_clients: number
      }

      const transactions = raw.transactions ?? []
      const loyaltyCards = raw.loyalty_cards ?? []
      const totalClients = kpis.total_clients ?? loyaltyCards.length
      const rewardsRedeemedThisMonth = kpis.rewards_month ?? 0

      // KPIs
      const newClientsThisMonth = loyaltyCards.filter(c => c.created_at >= startOfMonth).length
      const newClientsPrevMonth = loyaltyCards.filter(
        c => c.created_at >= startOfPrevMonth && c.created_at <= endOfPrevMonth
      ).length

      const earnTx = transactions.filter(t => t.type === 'earn')
      const totalVisitsThisMonth = earnTx.filter(t => t.created_at >= startOfMonth).length
      const totalVisitsPrevMonth = earnTx.filter(
        t => t.created_at >= startOfPrevMonth && t.created_at <= endOfPrevMonth
      ).length

      // Return rate: clients with 2+ earn transactions in last 30d / total clients
      const recentEarns = earnTx.filter(t => t.created_at >= thirtyDaysAgo)
      const visitsByCustomer: Record<string, number> = {}
      recentEarns.forEach(t => {
        visitsByCustomer[t.customer_id] = (visitsByCustomer[t.customer_id] || 0) + 1
      })
      const returningCount = Object.values(visitsByCustomer).filter(v => v >= 2).length
      const returnRate = totalClients > 0 ? Math.round((returningCount / totalClients) * 100) : 0

      // Notification performance: visits within 48h after sending
      const rawNotifs = notifRes.data || []
      const recentNotifications = rawNotifs.map(n => {
        if (!n.sent_at) return { ...n, visitsAfter: 0 }
        const plus48h = new Date(new Date(n.sent_at).getTime() + 48 * 3600 * 1000).toISOString()
        const visitsAfter = earnTx.filter(
          t => t.created_at >= n.sent_at! && t.created_at <= plus48h
        ).length
        return { ...n, visitsAfter }
      })

      const result: AnalyticsData = {
        newClientsThisMonth,
        newClientsPrevMonth,
        returnRate,
        totalVisitsThisMonth,
        totalVisitsPrevMonth,
        rewardsRedeemedThisMonth,
        totalClients,
        transactions,
        loyaltyCards,
        recentNotifications,
        lastNotificationDate: rawNotifs[0]?.sent_at ?? null,
      }

      cacheRef.current = { data: result, timestamp: Date.now() }
      setData(result)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [merchantId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime: invalidate cache on new transactions / loyalty_cards
  useEffect(() => {
    if (!merchantId) return
    const invalidate = () => { cacheRef.current = null; load(true) }
    const channel = supabase
      .channel(`analytics_rt_${merchantId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `merchant_id=eq.${merchantId}`,
      }, invalidate)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'loyalty_cards',
        filter: `merchant_id=eq.${merchantId}`,
      }, invalidate)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'loyalty_cards',
        filter: `merchant_id=eq.${merchantId}`,
      }, invalidate)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [merchantId, load])

  const reload = useCallback(() => {
    cacheRef.current = null
    load(true)
  }, [load])

  return { data, loading, error, reload }
}
