import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', variant = 'default', size = 'md' }: LogoProps) {
  const textColor =
    variant === 'light' ? 'text-white' :
    variant === 'dark'  ? 'text-fydly-900' :
    'text-fydly-900';

  const dotColor =
    variant === 'light' ? 'text-fydly-300' :
    'text-fydly-500';

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  return (
    <div className={`font-display inline-flex items-baseline select-none tracking-tight ${sizeClasses[size]} ${textColor} ${className}`}>
      Fydly
      <span className={`${dotColor} font-display leading-none`}>·</span>
    </div>
  );
}
