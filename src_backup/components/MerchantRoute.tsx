import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function MerchantRoute() {
  const { session, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-fydly-50">
        <Loader2 className="w-8 h-8 animate-spin text-fydly-500" />
      </div>
    );
  }

  // Si on n'est pas connecté ou si on n'est pas un commerçant
  if (!session || role !== 'merchant') {
    return <Navigate to="/merchant/login" replace />;
  }

  return <Outlet />;
}
