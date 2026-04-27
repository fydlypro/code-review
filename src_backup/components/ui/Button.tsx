import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  
  const baseClasses = "relative inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-15 focus:ring-fydly-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Padding et taille de texte selon les guidelines (14px 24px, font-size 15px)
  const sizeClasses = "px-6 py-3.5 text-[15px]";

  const variants = {
    primary: "bg-fydly-500 text-white hover:bg-fydly-600 hover:-translate-y-[2px] active:translate-y-0 active:scale-98",
    secondary: "bg-fydly-50 text-fydly-800 border border-fydly-200 hover:bg-fydly-100 hover:-translate-y-[2px] active:translate-y-0 active:scale-98",
    ghost: "bg-transparent text-fydly-700 border-[1.5px] border-fydly-300 hover:bg-fydly-50 hover:-translate-y-[2px] active:translate-y-0 active:scale-98"
  };

  const currentVariant = variants[variant];
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${currentVariant} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="w-5 h-5 animate-spin" />
        </span>
      )}
      <span className={isLoading ? 'invisible' : ''}>
        {children}
      </span>
    </button>
  );
}
