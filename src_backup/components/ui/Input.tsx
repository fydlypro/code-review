import React, { InputHTMLAttributes, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-[12px] font-medium text-fydly-800 uppercase tracking-[2px]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border-[1.5px] border-fydly-200 rounded-md px-[18px] py-[14px] text-[15px] text-fydly-900 bg-white placeholder:text-fydly-300 transition-all focus:outline-none focus:border-fydly-500 focus:shadow-focus disabled:opacity-50 disabled:bg-fydly-50 ${
          error ? 'border-error-text focus:border-error-text focus:shadow-none' : ''
        }`}
        {...props}
      />
      {error && <span className="text-[13px] text-error-text mt-0.5">{error}</span>}
    </div>
  );
}
