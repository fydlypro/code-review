import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  white?: boolean;
}

export default function Spinner({ size = 'md', white = false }: SpinnerProps) {
  const sizes = { 
    sm: 'w-4 h-4 border-2', 
    md: 'w-6 h-6 border-2', 
    lg: 'w-10 h-10 border-[3px]' 
  };
  
  const color = white 
    ? 'border-white/30 border-t-white' 
    : 'border-fydly-100 border-t-fydly-500';

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full animate-spin`}
      role="status"
      aria-label="Chargement…"
    />
  );
}
