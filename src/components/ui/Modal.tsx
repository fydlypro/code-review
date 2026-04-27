import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-fydly-900/50 backdrop-blur-[6px] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'relative bg-white w-full shadow-modal overflow-hidden z-10',
          'rounded-t-[28px] sm:rounded-[24px]',
          'animate-slide-up flex flex-col max-h-[90vh]',
          sizeClasses[size],
        ].join(' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-fydly-100/60 bg-gradient-to-b from-fydly-50/40 to-white">
            <div>
              <h3 className="font-display text-xl text-fydly-900 leading-snug">{title}</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-fydly-100 text-fydly-400 hover:bg-fydly-200 hover:text-fydly-700 transition-all duration-150 flex-shrink-0 active:scale-90"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
