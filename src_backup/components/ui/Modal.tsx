import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-fydly-900/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in p-6 z-10">
        {children}
      </div>
    </div>
  );
}
