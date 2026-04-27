import React, { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'success' | 'warning' | 'error';
}

export default function Badge({ children, variant = 'blue', className = '', ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 px-[14px] py-[6px] rounded-pill text-[12px] font-semibold';
  
  const variants = {
    blue: 'bg-fydly-100 text-fydly-800',
    success: 'bg-success-bg text-success-text',
    warning: 'bg-warning-bg text-warning-text',
    error: 'bg-error-bg text-error-text',
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
