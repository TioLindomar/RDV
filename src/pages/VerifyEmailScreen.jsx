import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';

const VerifyEmailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-primary to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-secondary to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-md relative z-10">
        <Card className="glass-effect border-border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="mx-auto bg-gradient-to-r from-primary to-secondary p-3 rounded-full inline-block">
              <MailCheck className="h-8 w-8 text-white" />
            </motion.div>
            
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Verifique seu Email</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enviamos um link de confirmação para <span className="font-semibold text-foreground">{email}</span>. Por favor, clique no link para ativar sua conta.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="text-center text-muted-foreground">
            <p>Você pode fechar esta janela após a verificação.</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmailScreen;