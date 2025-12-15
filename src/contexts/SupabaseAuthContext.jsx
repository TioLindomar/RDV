import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      // 1. Pega a sessão do cache local
      const { data: { session: localSession } } = await supabase.auth.getSession();
      
      if (localSession?.user) {
        // 2. BLINDAGEM: Verifica no servidor se o usuário ainda existe
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // Se der erro (usuário deletado), forçamos logout
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else {
          // Se tudo ok, segue o jogo
          handleSession(localSession);
        }
      } else {
         handleSession(null);
      }
      setLoading(false);
    };

    getSession();
    
    // ... resto do código (subscription) ...

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
        if (event === 'PASSWORD_RECOVERY') {
          // The user is in a password recovery state.
          // You can redirect them to a password reset page here.
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no cadastro",
        description: error.message || "Algo deu errado",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("ERRO REAL DO SUPABASE:", error); // <--- ADICIONE ISSO
      toast({
        variant: "destructive",
        title: "Falha no login",
        description: "Credenciais inválidas ou e-mail não confirmado.", // <--- ATUALIZE A MENSAGEM
      });
    }

    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha ao sair",
        description: error.message || "Algo deu errado",
      });
    }

    return { error };
  }, [toast]);

  const sendPasswordResetEmail = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha ao enviar e-mail",
        description: error.message || "Algo deu errado",
      });
    }
    return { data, error };
  }, [toast]);

  const updatePassword = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha ao atualizar senha",
        description: error.message || "Algo deu errado",
      });
    }
    return { data, error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
  }), [user, session, loading, signUp, signIn, signOut, sendPasswordResetEmail, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};