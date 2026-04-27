import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { enforceHTTPS } from "@/lib/security";

/**
 * Garde de sécurité pour les routes commerçant.
 * Vérifie que l'utilisateur est connecté.
 * Sinon, redirection vers /merchant/login
 */
export const MerchantRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    enforceHTTPS();
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(true);
    };

    checkAuth();

    // S'abonner aux changements de status
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
    // Skeleton global pendant la vérification
    return (
      <div className="min-h-screen bg-[#E3F2FD] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2196F3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirection en sauvegardant la destination visée
    return <Navigate to="/merchant/login" state={{ from: location }} replace />;
  }

  // Permet d'afficher les routes enfants si authentifié
  return <Outlet />;
};
