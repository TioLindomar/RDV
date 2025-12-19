import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { validateCPF, brazilianStates } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

// Máscaras
const maskPhone = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
const maskCEP = (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
const maskCpfCnpj = (v) => {
  const val = v.replace(/\D/g, '');
  if (val.length <= 11) return val.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
  return val.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
};

const RegisterScreen = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '', clinicName: '', phone: '', crmvState: '', crmvNumber: '', 
    sipegro: '', email: '', password: '', confirmPassword: '', 
    cpfCnpj: '', cep: '', address: '', number: '', neighborhood: '', city: '', uf: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Busca CEP
  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev, address: data.logradouro, neighborhood: data.bairro, city: data.localidade, uf: data.uf
        }));
      }
    } catch (error) { console.error(error); } 
    finally { setLoadingCep(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, password, confirmPassword, cpfCnpj, clinicName } = formData;

    if (!name || !email || !password || !cpfCnpj) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Chamada Supabase
    const { data, error } = await signUp(email, password, {
      data: {
        full_name: name,
        cpf: cpfCnpj,
        // Garante que se o usuário não digitar nome da clínica, cria uma padrão
        clinic_name: clinicName || `Clínica de ${name}`,
        crmv: `CRMV-${formData.crmvState} ${formData.crmvNumber}`,
        sipegro: formData.sipegro,
        phone: formData.phone,
        address: formData.address,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        uf: formData.uf,
        cep: formData.cep
      }
    });

    setLoading(false);

    if (error) {
      toast({ 
        title: "Falha no Cadastro", 
        description: error.message || "Verifique se o e-mail já está em uso.", 
        variant: "destructive" 
      });
    } else {
      // Sucesso!
      toast({ 
        title: "Conta Criada!", 
        description: "Bem-vindo ao RDV. Você já pode fazer login." 
      });
      navigate('/'); // Vai para o Login
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    let v = value;
    if (id === 'phone') v = maskPhone(value);
    if (id === 'cep') v = maskCEP(value);
    if (id === 'cpfCnpj') v = maskCpfCnpj(value);
    setFormData(prev => ({ ...prev, [id]: v }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tl from-secondary to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <Card className="glass-effect border-border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-gradient-to-r from-primary to-secondary p-3 rounded-full inline-block">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Cadastro Profissional</CardTitle>
              <p className="text-muted-foreground">Crie sua conta para gerenciar receitas e pacientes.</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground/80">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input id="name" onChange={handleChange} required className="bg-input border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CPF *</Label>
                    <Input id="cpfCnpj" value={formData.cpfCnpj} onChange={handleChange} required className="bg-input border-border" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Login *</Label>
                    <Input id="email" type="email" onChange={handleChange} required className="bg-input border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                    <Input id="phone" value={formData.phone} onChange={handleChange} required className="bg-input border-border" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground/80">Dados Profissionais</h3>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica / Consultório</Label>
                  <Input id="clinicName" placeholder="Ex: VetLife (Opcional)" onChange={handleChange} className="bg-input border-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Registro CRMV</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                           <Select onValueChange={(v) => handleSelectChange('crmvState', v)}>
                            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                            <SelectContent>{brazilianStates.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                         <div className="col-span-2">
                          <Input id="crmvNumber" placeholder="00000" onChange={handleChange} className="bg-input border-border" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sipegro">Nº SIPEGRO</Label>
                      <Input id="sipegro" onChange={handleChange} className="bg-input border-border" />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 relative">
                  <Label htmlFor="password">Senha *</Label>
                  <Input id="password" type={showPassword ? "text" : "password"} onChange={handleChange} required className="bg-input border-border pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-7 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} onChange={handleChange} required className="bg-input border-border pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-7 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Criar Minha Conta'}
                </Button>
                 <Button type="button" variant="link" onClick={() => navigate('/')} className="w-full text-muted-foreground">
                  Já tem uma conta? Faça login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterScreen;