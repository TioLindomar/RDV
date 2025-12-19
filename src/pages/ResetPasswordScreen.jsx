import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { LockKeyhole, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const ResetPasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { updatePassword, signOut, session, loading } = useAuth(); 
  const navigate = useNavigate();

  // Se o contexto terminar de carregar, mas não tiver sessão,
  // verificamos se existe um hash na URL que pode não ter sido processado ainda.
  // Se não tiver hash e não tiver sessão, o link morreu.
  const hash = window.location.hash;
  const hasTokenInUrl = hash && hash.includes('type=recovery');

  useEffect(() => {
    // Se carregou tudo e não temos sessão e nem hash, redireciona
    if (!loading && !session && !hasTokenInUrl) {
        // Pequeno delay para evitar falsos positivos
        const timer = setTimeout(() => {
             navigate('/forgot-password');
             toast({ title: "Link Inválido", description: "Sessão não encontrada.", variant: "destructive" });
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [loading, session, hasTokenInUrl, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        toast({ title: "Erro", description: "Senhas não conferem.", variant: "destructive" });
        return;
    }
    setSaving(true);
    try {
        const { error } = await updatePassword(password);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Senha alterada!" });
        await signOut();
        navigate('/');
    } catch (error) {
       toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
        setSaving(false);
    }
  };

  // 1. Está carregando o contexto? Mostra Spinner.
  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
    );
  }

  // 2. Não tem sessão, mas tem o hash na URL? 
  // O Supabase ainda pode estar trocando o hash pela sessão. Mostra Spinner com mensagem diferente.
  if (!session && hasTokenInUrl) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Validando token de segurança...</p>
        </div>
    );
  }

  // 3. Não tem sessão e nem hash? Mostra erro.
  if (!session) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <h1 className="text-2xl font-bold mb-2">Sessão Expirada</h1>
            <p className="text-muted-foreground mb-4">O link de recuperação não é mais válido.</p>
            <Button onClick={() => navigate('/forgot-password')}>Solicitar Novo Link</Button>
        </div>
      );
  }

  // 4. Tem sessão! Mostra o formulário.
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Card className="glass-effect border-border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-gradient-to-r from-primary to-secondary p-3 rounded-full inline-block">
              <LockKeyhole className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Nova Senha</CardTitle>
              <CardDescription>Defina sua nova senha de acesso.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2 relative">
                <Label>Nova Senha</Label>
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-input border-border pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-7 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>Confirmar Senha</Label>
                <Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-input border-border pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-7 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Nova Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordScreen;