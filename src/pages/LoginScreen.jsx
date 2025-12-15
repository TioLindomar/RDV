import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Heart, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const LoginScreen = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    signIn,
    session
  } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async e => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      toast({
        title: "Erro no login",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const {
      data,
      error
    } = await signIn(credentials.email, credentials.password);
    setLoading(false);
    if (data.user && !error) {
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta!`
      });
      navigate('/dashboard');
    }
  };

  return <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tl from-secondary to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-gradient-to-tr from-accent to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{
        animationDelay: '4s'
      }}></div>
      </div>

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.8
    }} className="w-full max-w-md relative z-10">
        <Card className="glass-effect border-border shadow-2xl">
          <CardHeader className="text-center space-y-6">
            <motion.div initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200
          }} className="mx-auto">
              <img src="https://horizons-cdn.hostinger.com/2cba84cd-67f6-4ccb-a719-f85b6f3bc4fa/17a8c15f0cdcc12643d8e30a75015851.png" alt="RDV Receita Digital Veterinária Logo" className="h-48 w-auto mx-auto" />
            </motion.div>
            
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2"></CardTitle>
              <p className="text-muted-foreground">Receituário Digital Veterinário</p>
            </div>

            <div className="flex justify-center space-x-6">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.4
            }} className="flex items-center space-x-2 text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span className="text-sm">Cuidado</span>
              </motion.div>
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.6
            }} className="flex items-center space-x-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Segurança</span>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.8
            }} className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" onChange={e => setCredentials({
                ...credentials,
                email: e.target.value
              })} className="bg-input border-border text-foreground placeholder:text-muted-foreground" disabled={loading} />
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 1
            }} className="space-y-2 relative">
                <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-foreground">Senha</Label>
                    <Button variant="link" type="button" className="p-0 h-auto text-xs text-muted-foreground" onClick={() => navigate('/forgot-password')}>
                        Esqueceu a senha?
                    </Button>
                </div>
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={e => setCredentials({
                ...credentials,
                password: e.target.value
              })} className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10" disabled={loading} />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-7 h-8 w-8 p-0 text-muted-foreground hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 1.2
            }} className="space-y-4">
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar no Sistema'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/register')} className="w-full bg-transparent border-border text-foreground hover:bg-muted" disabled={loading}>
                  Não tem uma conta? Cadastre-se
                </Button>
              </motion.div>
            </form>

            <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 1.4
          }} className="text-center">
              <p className="text-muted-foreground text-sm">
                Prescrições digitais com assinatura Gov.br
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>;
};
export default LoginScreen;