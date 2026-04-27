import React, { InputHTMLAttributes, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
}

export default function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold text-fydly-600 uppercase tracking-[1.5px]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full border-[1.5px] rounded-btn px-[18px] py-[14px] text-base text-fydly-900 bg-white',
          'placeholder:text-fydly-300 font-medium transition-all duration-150',
          'focus:outline-none focus:ring-[3px]',
          'disabled:opacity-50 disabled:bg-fydly-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/10'
            : 'border-fydly-200 focus:border-fydly-500 focus:ring-fydly-500/10',
        ].join(' ')}
        style={{ fontSize: '16px' }}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="text-[12px] text-fydly-400 mt-0.5 leading-snug">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} role="alert" className="text-[12px] text-red-500 font-medium mt-0.5 flex items-center gap-1.5 leading-snug">
          <AlertCircle size={13} className="flex-shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}
