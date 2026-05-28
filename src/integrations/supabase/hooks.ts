/**
 * Hooks customizados para usar Supabase no React
 */

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obter usuário atual
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setUser(null);
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setProfile(data || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  return { profile, loading, error };
}