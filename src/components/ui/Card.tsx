import { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'kpi' | 'section';
  hoverable?: boolean;
}

export default function Card({
  children,
  variant = 'base',
  hoverable = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = 'bg-white rounded-card transition-all duration-200';

  const variants = {
    base:     'shadow-card border border-slate-100',
    elevated: 'shadow-modal border border-slate-100',
    kpi:      'shadow-card border border-slate-100',
    section:  'bg-slate-50 border border-slate-100 shadow-none rounded-[20px]',
  };

  const hoverClass = hoverable
    ? 'hover:shadow-card-hover hover:-translate-y-[2px] cursor-pointer'
    : '';

  return (
    <div
      className={twMerge(baseClasses, variants[variant], hoverClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}
