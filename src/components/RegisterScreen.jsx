import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { formatCPF, validateCPF, brazilianStates } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    crmvState: '',
    crmvNumber: '',
    sipegro: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    address: '',
    neighborhood: '',
    city: '',
    uf: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { name, crmvState, crmvNumber, sipegro, email, password, confirmPassword, cpf, address, neighborhood, city, uf } = formData;
    
    const requiredFields = { name, crmvState, crmvNumber, sipegro, email, password, confirmPassword, cpf, address, neighborhood, city, uf };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        toast({ title: "Erro no cadastro", description: `O campo ${key} é obrigatório.`, variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    if (password !== confirmPassword) {
      toast({ title: "Erro no cadastro", description: "As senhas não coincidem.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!validateCPF(cpf)) {
      toast({ title: "Erro no cadastro", description: "O CPF informado é inválido.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, {
      data: {
        full_name: name,
        crmv: `CRMV-${crmvState} ${crmvNumber}`,
        sipegro,
        cpf: formatCPF(cpf),
        address,
        neighborhood,
        city,
        uf,
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro no Cadastro",
        description: error.message || "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Sua conta foi criada. Você já pode fazer login.`
      });
      navigate('/');
    }
  };

  const handleChange = e => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tl from-secondary to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-lg relative z-10">
        <Card className="glass-effect border-border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="mx-auto bg-gradient-to-r from-primary to-secondary p-3 rounded-full inline-block">
              <UserPlus className="h-8 w-8 text-white" />
            </motion.div>
            
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Crie sua conta</CardTitle>
              <p className="text-muted-foreground">Comece a emitir receita digital agora mesmo.</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome Completo</Label>
                <Input id="name" placeholder="Seu nome" onChange={handleChange} className="bg-input border-border text-foreground" disabled={loading} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-foreground">CRMV</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                         <Select onValueChange={(value) => handleSelectChange('crmvState', value)} disabled={loading}>
                          <SelectTrigger id="crmvState" className="bg-input border-border text-foreground">
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {brazilianStates.map(state => (
                              <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="col-span-2">
                        <Input id="crmvNumber" placeholder="00000" onChange={handleChange} className="bg-input border-border text-foreground" disabled={loading} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sipegro" className="text-foreground">Nº SIPEGRO</Label>
                    <Input id="sipegro" placeholder="00000" onChange={handleChange} className="bg-input border-border text-foreground" disabled={loading} />
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-foreground">CPF</Label>
                <Input id="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => setFormData(prev => ({...prev, cpf: formatCPF(e.target.value)}))} className="bg-input border-border text-foreground" disabled={loading} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground">Endereço Profissional</Label>
                <Input id="address" placeholder="Rua, Nº" onChange={handleChange} className="bg-input border-border text-foreground" disabled={loading} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="text-foreground">Bairro</Label>
                  <Input id="neighborhood" placeholder="Seu bairro" onChange={handleChange} className="bg-input border-border text-foreground" disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-foreground">Cidade</Label>
                  <Input id="city" placeholder="Sua cidade" onChange={handleChange} className="bg-input border-border text-foreground" disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf" className="text-foreground">UF</Label>
                  <Select onValueChange={(value) => handleSelectChange('uf', value)} disabled={loading}>
                    <SelectTrigger id="uf" className="bg-input border-border text-foreground">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map(state => (
                        <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" onChange={handleChange} className="bg-input border-border text-foreground" disabled={loading} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="password" className="text-foreground">Senha</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    onChange={handleChange}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-7 h-8 w-8 p-0 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="space-y-2 relative">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirme a Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    onChange={handleChange}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-7 h-8 w-8 p-0 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4 space-y-4">
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg shadow-lg" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
                 <Button type="button" variant="link" onClick={() => navigate('/')} className="w-full text-muted-foreground" disabled={loading}>
                  Já tem uma conta? Faça login
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>;
};
export default RegisterScreen;