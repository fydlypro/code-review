import { ReactNode } from 'react';
import Card from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
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
  iconColor = 'bg-fydly-100 text-fydly-500',
  className = '',
  onClick
}: KpiCardProps) {
  return (
    <Card
      className={`flex flex-col gap-3 sm:gap-5 p-4 sm:p-6 group hover:shadow-card-hover hover:border-fydly-200 transition-all duration-200 border border-transparent ${onClick ? 'cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fydly-500 focus-visible:ring-offset-2' : ''} ${className}`}
      variant="kpi"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <div className="flex justify-between items-start">
        {/* Icon in colored circle */}
        <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${iconColor}`}>
          <div className="w-5 h-5 sm:w-6 sm:h-6">
            {icon}
          </div>
        </div>

        {/* Trend badge */}
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full ${
            trend === 'up'
              ? 'bg-emerald-50 text-emerald-600'
              : trend === 'down'
              ? 'bg-red-50 text-red-500'
              : 'bg-fydly-50 text-fydly-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={13} /> : trend === 'down' ? <ArrowDownRight size={13} /> : <Minus size={13} />}
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-0.5 sm:space-y-1.5">
        <span className="text-fydly-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-[2px] block leading-tight">
          {label}
        </span>
        <span className="text-fydly-900 text-2xl sm:text-4xl font-display leading-none tabular-nums">
          {value}
        </span>
      </div>
    </Card>
  );
}
