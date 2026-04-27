import React from 'react';
import { toast, ToastOptions, Toaster } from 'react-hot-toast';

export const fydlyToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      style: {
        background: '#E8F5E9',
        color: '#2E7D32',
        borderRadius: '100px',
        padding: '12px 24px',
        fontWeight: 500,
        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.18)',
      },
      iconTheme: {
        primary: '#2E7D32',
        secondary: '#E8F5E9',
      },
      ...options,
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      style: {
        background: '#FFEBEE',
        color: '#C62828',
        borderRadius: '100px',
        padding: '12px 24px',
        fontWeight: 500,
        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.18)',
      },
      iconTheme: {
        primary: '#C62828',
        secondary: '#FFEBEE',
      },
      ...options,
    });
  },
};

export function FydlyToaster() {
  return <Toaster position="top-center" />;
}
