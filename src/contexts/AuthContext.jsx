import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { api, setAccessToken } from '@/lib/apiClient';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const refreshed = await api.refresh();
      if (refreshed?.accessToken) {
        setAccessToken(refreshed.accessToken);
        setUser(refreshed.user);
        setSession({ user: refreshed.user });
        setLoading(false);
        return;
      }
    } catch {
      // ignore
    }

    setAccessToken(null);
    setUser(null);
    setSession(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const signUp = useCallback(async (email, password) => {
    try {
      await api.signup(email, password);
      const result = await api.login(email, password);
      setAccessToken(result.accessToken);
      setUser(result.user);
      setSession({ user: result.user });
      return { error: null };
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Cadastro falhou',
        description: error.message || 'Não foi possível criar sua conta',
      });
      return { error };
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    try {
      const result = await api.login(email, password);
      setAccessToken(result.accessToken);
      setUser(result.user);
      setSession({ user: result.user });
      return { error: null };
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login falhou',
        description: error.message || 'Credenciais inválidas',
      });
      return { error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    setSession(null);
    return { error: null };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};