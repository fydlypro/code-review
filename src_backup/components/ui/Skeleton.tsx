import React from 'react';

export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-fydly-100 rounded-md ${className}`} />
  );
}
