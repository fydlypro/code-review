import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'kpi' | 'section';
}

export default function Card({ children, variant = 'base', className = '', ...props }: CardProps) {
  const baseClasses = 'bg-white rounded-[16px] shadow-card transition-all duration-200';
  
  const variants = {
    base: 'p-6',
    kpi: 'p-6 px-7',
    section: 'bg-fydly-50 border border-fydly-100 p-8 shadow-none'
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
