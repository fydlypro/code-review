import React from 'react';

interface LogoProps {
  className?: string;
  inverted?: boolean;
}

export default function Logo({ className = '', inverted = false }: LogoProps) {
  const textColor = inverted ? 'text-white' : 'text-fydly-900';
  const dotColor = inverted ? 'text-white/80' : 'text-fydly-500';

  return (
    <div className={`font-display text-4xl flex items-baseline ${textColor} ${className}`}>
      Fydly<span className={dotColor}>·</span>
    </div>
  );
}
