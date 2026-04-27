import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'merchant' | 'customer' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function getUserRole(userId: string): Promise<UserRole> {
      // First try to check if merchant
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (merchantData) return 'merchant';

      // Then check if customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (customerData) return 'customer';

      return null;
    }

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          const role = await getUserRole(session.user.id);
          setAuthState({
            session,
            user: session.user,
            role,
            isLoading: false,
          });
        } else if (mounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        if (mounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session) {
        const role = await getUserRole(session.user.id);
        setAuthState({
          session,
          user: session.user,
          role,
          isLoading: false,
        });
      } else {
        setAuthState({
          session: null,
          user: null,
          role: null,
          isLoading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}
