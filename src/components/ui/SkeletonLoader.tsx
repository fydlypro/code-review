import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'stamp-card';
}

export default function SkeletonLoader({ className = '', variant = 'rect' }: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-fydly-100";
  
  const variants = {
    text: "h-4 rounded-md w-3/4",
    circle: "rounded-full aspect-square",
    rect: "rounded-md",
    card: "h-48 rounded-card",
    'stamp-card': "h-64 rounded-card h-full"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} />
  );
}
