import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { enforceHTTPS } from "@/lib/security";

/**
 * Garde de sécurité pour l'espace client.
 * Évite qu'un visiteur non connecté accède à sa carte de fidélité.
 * Redirige vers la page d'authentification client.
 */
export const CustomerRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    enforceHTTPS();

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Bonus: On pourrait vérifier ici si l'utilisateur est bien de rôle 'customer'
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    // Loader pendant la vérif auth
    return (
      <div className="min-h-screen bg-[#E3F2FD] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2196F3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Retour à l'écran de scan ou auth avec message
    return <Navigate to="/scan" replace />;
  }

  return <Outlet />;
};
