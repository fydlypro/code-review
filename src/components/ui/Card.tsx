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
    base:     'shadow-card border border-fydly-100/40',
    elevated: 'shadow-modal border border-fydly-100/60',
    kpi:      'shadow-card border border-fydly-100/60 bg-gradient-to-br from-white to-fydly-50/30',
    section:  'bg-fydly-50 border border-fydly-100 shadow-none rounded-[20px]',
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
