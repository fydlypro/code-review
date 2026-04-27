import React from 'react';
import Card from '../ui/Card';
import { Gift, Clock, Zap } from 'lucide-react';

interface ScanItem {
  id: string;
  customerName: string;
  newBalance: number;
  threshold: number;
  timeStr: string;
  isReward?: boolean;
}

interface RecentScansProps {
  scans: ScanItem[];
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-fydly-100 text-fydly-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function RecentScans({ scans, className = '' }: RecentScansProps) {
  return (
    <Card
      className={`flex flex-col bg-white overflow-hidden ${className}`}
      variant="base"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-fydly-50">
        <div>
          <h3 className="font-display text-2xl text-fydly-900 leading-tight">
            Activité récente
          </h3>
          <p className="text-fydly-400 text-[10px] font-bold uppercase tracking-[2px] mt-0.5">
            Derniers passages clients
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-fydly-50 flex items-center justify-center text-fydly-500 border border-fydly-100">
          <Clock size={18} />
        </div>
      </div>

      {/* Timeline feed */}
      <div className="flex-1 divide-y divide-fydly-50/70">
        {scans.length === 0 ? (
          <div className="py-16 px-8 text-center">
            <div className="w-16 h-16 bg-fydly-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-fydly-100">
              <Zap size={28} className="text-fydly-200" />
            </div>
            <p className="text-fydly-500 font-bold text-sm">Aucun scan récent</p>
            <p className="text-fydly-300 text-xs font-medium mt-1">
              L'activité de vos clients apparaîtra ici
            </p>
          </div>
        ) : (
          scans.map((scan) => {
            const progress = Math.min((scan.newBalance / scan.threshold) * 100, 100)
            return (
              <div
                key={scan.id}
                className="group flex items-center gap-4 px-6 py-4 hover:bg-fydly-50/40 transition-all duration-150"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white ${
                  scan.isReward
                    ? 'bg-emerald-100 text-emerald-700'
                    : avatarColor(scan.customerName)
                }`}>
                  {scan.isReward
                    ? <Gift size={16} />
                    : getInitials(scan.customerName)
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fydly-900 text-sm truncate">
                      {scan.customerName}
                    </span>
                    {scan.isReward && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                        <Gift size={9} /> Cadeau
                      </span>
                    )}
                  </div>
                  <p className="text-fydly-400 text-[11px] font-medium mt-0.5">
                    {scan.timeStr}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 w-24 bg-fydly-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${scan.isReward ? 'bg-emerald-400' : 'bg-fydly-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Balance */}
                <div className="shrink-0 text-right">
                  {scan.isReward ? (
                    <span className="text-emerald-600 font-bold text-sm">Offert</span>
                  ) : (
                    <span className="font-display text-fydly-500 text-lg leading-none">+{scan.newBalance}</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {scans.length > 0 && (
        <div className="px-6 py-4 border-t border-fydly-50">
          <button className="w-full py-2.5 text-fydly-500 text-xs font-bold uppercase tracking-widest hover:bg-fydly-50 rounded-xl transition-colors">
            Voir tout l'historique →
          </button>
        </div>
      )}
    </Card>
  );
}
