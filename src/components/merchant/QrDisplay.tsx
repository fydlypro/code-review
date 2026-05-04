import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Clock, Scan, X, Maximize2 } from 'lucide-react';

interface QrDisplayProps {
  url: string;
  expiresInMinutes?: number;
  onRefresh?: () => Promise<void> | void;
  className?: string;
}

export default function QrDisplay({
  url,
  expiresInMinutes = 15,
  onRefresh,
  className = ''
}: QrDisplayProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [percentage, setPercentage] = useState(100)
  const [timeLabel, setTimeLabel] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Barre de progression : temps restant jusqu'à la fin de la journée locale
  useEffect(() => {
    const updatePercentage = () => {
      const now = new Date()
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999)
      const total = endOfDay.getTime() - startOfDay.getTime()
      const remaining = Math.max(0, endOfDay.getTime() - now.getTime())
      const pct = (remaining / total) * 100
      setPercentage(pct)

      const h = Math.floor(remaining / 3600000)
      const m = Math.floor((remaining % 3600000) / 60000)
      setTimeLabel(h > 0 ? `${h}h ${m}min restantes` : `${m} min restantes`)
    }
    updatePercentage()
    const interval = setInterval(updatePercentage, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  const urgency = percentage < 20 ? 'text-red-500' : percentage < 50 ? 'text-amber-500' : 'text-fydly-500'
  const barColor = percentage < 20 ? 'bg-red-400' : percentage < 50 ? 'bg-amber-400' : 'bg-fydly-500'

  return (
    <>
    <Card
      className={`flex flex-col items-center bg-white overflow-hidden ${className}`}
      variant="base"
    >
      {/* Color accent top bar */}
      <div className="w-full h-1 bg-fydly-500" />

      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-fydly-50">
        <div>
          <h3 className="font-display text-xl sm:text-2xl text-fydly-900 leading-tight">QR Code du jour</h3>
          <p className="text-fydly-400 text-[10px] font-bold uppercase tracking-[2px] mt-0.5">
            À scanner par le client
          </p>
        </div>
        <button
          onClick={() => setIsFullscreen(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-fydly-50 hover:bg-fydly-100 flex items-center justify-center text-fydly-500 border border-fydly-100 transition-all active:scale-95"
          title="Afficher en grand"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* QR Code frame */}
      <div className="flex flex-col items-center gap-4 sm:gap-5 p-4 sm:p-6 w-full">
        <div className="relative w-full">
          {/* Outer decorative frame */}
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-fydly-50 to-white rounded-2xl sm:rounded-3xl border-2 border-fydly-100 shadow-card mx-auto" style={{ width: 'fit-content' }}>
            {/* Inner white area */}
            <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm">
              {/* Responsive QR: smaller on mobile */}
              <div className="hidden sm:block">
                <QRCodeSVG
                  value={url}
                  size={180}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/favicon.png",
                    x: undefined,
                    y: undefined,
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
              </div>
              <div className="sm:hidden">
                <QRCodeSVG
                  value={url}
                  size={140}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/favicon.png",
                    x: undefined,
                    y: undefined,
                    height: 28,
                    width: 28,
                    excavate: true,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Refreshing overlay */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <RefreshCw size={32} className="text-fydly-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Countdown section */}
        <div className="w-full space-y-3">
          {/* Time info row */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${urgency}`}>
              <Clock size={13} />
              <span>{timeLabel}</span>
            </div>

            {/* Refresh button — discreet */}
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 text-xs font-bold text-fydly-400 hover:text-fydly-600 transition-colors disabled:opacity-40 px-2 py-1 rounded-lg hover:bg-fydly-50"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                Actualiser
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-fydly-50 rounded-full overflow-hidden border border-fydly-100">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-center text-[10px] font-bold text-fydly-300 uppercase tracking-wider">
            Valide jusqu'à 23h59 aujourd'hui
          </p>
        </div>
      </div>
    </Card>

    {/* ── Fullscreen modal ── */}
    {isFullscreen && (
      <div
        className="fixed inset-0 z-[200] bg-fydly-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in"
        onClick={() => setIsFullscreen(false)}
      >
        <div
          className="bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="font-display text-2xl text-fydly-900">QR Code</h3>
              <p className="text-fydly-400 text-[10px] font-bold uppercase tracking-[2px]">À scanner par le client</p>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="w-10 h-10 rounded-2xl bg-fydly-50 hover:bg-fydly-100 flex items-center justify-center text-fydly-400 border border-fydly-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 bg-gradient-to-br from-fydly-50 to-white rounded-3xl border-2 border-fydly-100 shadow-card">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <QRCodeSVG
                value={url}
                size={240}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/favicon.png",
                  x: undefined,
                  y: undefined,
                  height: 48,
                  width: 48,
                  excavate: true,
                }}
              />
            </div>
          </div>

          <div className={`flex items-center gap-2 text-sm font-bold ${urgency}`}>
            <Clock size={15} />
            <span>{timeLabel}</span>
          </div>

          <p className="text-[11px] font-bold text-fydly-300 uppercase tracking-wider text-center">
            Valide jusqu'à 23h59 aujourd'hui
          </p>
        </div>
      </div>
    )}
    </>
  );
}
