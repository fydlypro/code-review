import React, { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'purple' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-[12px]',
    lg: 'px-4 py-1.5 text-[13px]',
  };

  const variants = {
    default: 'bg-fydly-100 text-fydly-700',
    info:    'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error:   'bg-red-100 text-red-600',
    purple:  'bg-violet-100 text-violet-700',
    dark:    'bg-fydly-900 text-white',
  };

  const dotColors = {
    default: 'bg-fydly-500',
    info:    'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error:   'bg-red-500',
    purple:  'bg-violet-500',
    dark:    'bg-white',
  };

  return (
    <span
      className={twMerge(baseClasses, sizeClasses[size], variants[variant], className)}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
