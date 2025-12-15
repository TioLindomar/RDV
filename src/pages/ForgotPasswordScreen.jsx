import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { sendPasswordResetEmail } = useAuth();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erro", description: "Por favor, insira seu e-mail.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await sendPasswordResetEmail(email);
    if (!error) {
      toast({
        title: "Verifique seu e-mail",
        description: "Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.",
      });
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tl from-secondary to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-md relative z-10">
        <Card className="glass-effect border-border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="mx-auto bg-gradient-to-r from-primary to-secondary p-3 rounded-full inline-block">
              <KeyRound className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Recuperar Senha</CardTitle>
              <CardDescription className="text-muted-foreground">Insira seu e-mail para receber um link de redefinição.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border text-foreground"
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </Button>
              <Button type="button" variant="link" onClick={() => navigate('/')} className="w-full text-muted-foreground" disabled={loading}>
                Voltar para o Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordScreen;