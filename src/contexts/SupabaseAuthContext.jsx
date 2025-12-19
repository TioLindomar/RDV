import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authProcessed = false;

    const initializeAuth = async () => {
      try {
        const hash = window.location.hash;
        const hasAuthHash = hash && (
          hash.includes('access_token=') || 
          hash.includes('type=recovery') ||
          hash.includes('type=signup')
        );

        // Se tiver hash, aguarda o evento de autenticação
        if (hasAuthHash) {
          console.log('🔐 Hash detectado, aguardando processamento...');
          
          // Timeout de segurança: se não processar em 3s, continua
          const timeout = setTimeout(() => {
            if (!authProcessed && mounted) {
              console.warn('⚠️ Timeout ao processar hash');
              setLoading(false);
            }
          }, 3000);

          // Aguarda o evento SIGNED_IN ou PASSWORD_RECOVERY
          const cleanup = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
              authProcessed = true;
              clearTimeout(timeout);
            }
          });

          // Aguarda um pouco para o evento disparar
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Pega a sessão atual
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession) {
            console.log('✅ Sessão encontrada');
            setSession(initialSession);
            setUser(initialSession.user);
          } else {
            console.log('❌ Nenhuma sessão');
          }
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        console.log('🔄 Auth event:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, options) => {
    const result = await supabase.auth.signUp({ email, password, options });
    if (result.error) toast({ variant: "destructive", title: "Erro no Cadastro", description: result.error.message });
    return result;
  };

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) toast({ variant: "destructive", title: "Erro no Login", description: "Credenciais inválidas." });
    return result;
  };

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    return result;
  };

  const sendPasswordResetEmail = async (email) => {
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (result.error) toast({ variant: "destructive", title: "Erro", description: result.error.message });
    return result;
  };

  const updatePassword = async (newPassword) => {
    const result = await supabase.auth.updateUser({ password: newPassword });
    if (result.error) toast({ variant: "destructive", title: "Erro", description: result.error.message });
    return result;
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};