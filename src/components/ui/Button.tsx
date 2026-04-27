import { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {

  const baseClasses =
    'relative inline-flex items-center justify-center font-semibold rounded-btn transition-all duration-200 ' +
    'focus:outline-none focus:ring-4 focus:ring-fydly-500/15 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] select-none touch-manipulation';

  const sizeClasses = {
    sm: 'px-4 py-2 text-[13px] gap-1.5 h-9',
    md: 'px-6 py-3 text-[14px] gap-2 h-11',
    lg: 'px-8 py-3.5 text-[15px] gap-2.5 h-14',
  };

  const variants = {
    primary:
      'bg-fydly-500 text-white shadow-sm shadow-fydly-500/20 ' +
      'hover:bg-fydly-600 hover:-translate-y-[1px] hover:shadow-md hover:shadow-fydly-500/30 ' +
      'focus:ring-fydly-500/15',
    secondary:
      'bg-white text-fydly-800 border border-fydly-200 shadow-sm ' +
      'hover:bg-fydly-50 hover:border-fydly-300 hover:-translate-y-[1px] hover:shadow-sm ' +
      'focus:ring-fydly-500/10',
    ghost:
      'bg-transparent text-fydly-700 ' +
      'hover:bg-fydly-50 hover:text-fydly-900 ' +
      'focus:ring-fydly-500/10',
    danger:
      'bg-red-500 text-white shadow-sm shadow-red-500/20 ' +
      'hover:bg-red-600 hover:-translate-y-[1px] hover:shadow-md hover:shadow-red-500/30 ' +
      'focus:ring-red-500/15',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={twMerge(baseClasses, sizeClasses[size], variants[variant], className)}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin opacity-80" />
        </span>
      )}
      <span className={isLoading ? 'invisible' : 'inline-flex items-center gap-[inherit]'}>
        {children}
      </span>
    </button>
  );
}
