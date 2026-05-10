import { ReactNode } from 'react';
import Card from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  accentColor?: string;
  iconBg?: string;
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export default function KpiCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  accentColor = '#2563EB',
  iconBg = 'bg-fydly-50',
  iconColor = 'text-fydly-500',
  className = '',
  onClick
}: KpiCardProps) {
  return (
    <div
      className={`bg-white rounded-card shadow-card border border-slate-100 flex flex-col gap-2.5 sm:gap-4 p-3.5 sm:p-5 group transition-all duration-200 overflow-hidden relative min-h-[100px] sm:min-h-0
        hover:shadow-card-hover hover:-translate-y-[2px]
        ${onClick ? 'cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fydly-500 focus-visible:ring-offset-2' : ''}
        ${className}`}
      style={{ borderLeft: `3px solid ${accentColor}` }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <div className="flex justify-between items-start">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <div className="w-4 h-4 sm:w-5 sm:h-5">{icon}</div>
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-badge font-mono ${
            trend === 'up'
              ? 'bg-success-light text-success'
              : trend === 'down'
              ? 'bg-error-light text-error'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={11} /> : trend === 'down' ? <ArrowDownRight size={11} /> : <Minus size={11} />}
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-[1.5px] block leading-tight">
          {label}
        </span>
        <span className="text-slate-900 text-2xl sm:text-[32px] font-display font-extrabold leading-none tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}
