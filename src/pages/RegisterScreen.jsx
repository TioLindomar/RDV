import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Eye, EyeOff, Loader2, Search } from 'lucide-react';
import { validateCPF, brazilianStates } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

// Funções de máscara auxiliares (locais para não quebrar o utils agora)
const maskPhone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .slice(0, 15);
};

const maskCEP = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

const maskCpfCnpj = (value) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  } else {
    return v
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  }
};

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    clinicName: '', // Novo
    phone: '',      // Novo
    crmvState: '',
    crmvNumber: '',
    sipegro: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpfCnpj: '',    // Atualizado para aceitar ambos
    cep: '',        // Novo
    address: '',
    number: '',     // Novo
    neighborhood: '',
    city: '',
    uf: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false); // Loading específico do CEP
  
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Função para buscar CEP
  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          uf: data.uf
        }));
        toast({ title: "Endereço encontrado!", description: "Os campos foram preenchidos automaticamente." });
      } else {
        toast({ title: "CEP não encontrado", description: "Verifique o número digitado.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Desestruturação para validação
    const { 
      name, clinicName, phone, crmvState, crmvNumber, 
      email, password, confirmPassword, cpfCnpj, 
      cep, address, number, neighborhood, city, uf 
    } = formData;
    
    // Validação de campos obrigatórios (Sipegro é opcional)
    const requiredFields = { 
      "Nome": name, "Email": email, "Senha": password, "CPF/CNPJ": cpfCnpj, 
      "Telefone": phone, "CRMV": crmvNumber, "Estado CRMV": crmvState,
      "CEP": cep, "Endereço": address, "Número": number, 
      "Bairro": neighborhood, "Cidade": city, "UF": uf 
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        toast({ title: "Campo obrigatório", description: `Por favor, preencha o campo ${key}.`, variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    if (password !== confirmPassword) {
      toast({ title: "Erro nas senhas", description: "As senhas não coincidem.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Validação básica de CPF (CNPJ é mais complexo, deixamos passar se tiver tamanho ok)
    const cleanDoc = cpfCnpj.replace(/\D/g, '');
    if (cleanDoc.length === 11 && !validateCPF(cleanDoc)) {
        toast({ title: "Documento inválido", description: "O CPF informado parece incorreto.", variant: "destructive" });
        setLoading(false);
        return;
    }

    // Chamada ao Supabase
    // Enviamos os dados mapeados EXATAMENTE como a Trigger handle_new_user espera
    const { error } = await signUp(email, password, {
      data: {
        full_name: name,
        cpf: cpfCnpj,      // Trigger espera 'cpf', mesmo sendo cnpj
        crmv: `CRMV-${crmvState} ${crmvNumber}`,
        sipegro: formData.sipegro,
        phone: phone,      // Novo
        clinic_name: clinicName, // Novo
        
        // Endereço completo
        address: address,
        number: number,
        neighborhood: neighborhood,
        city: city,
        uf: uf,
        cep: cep
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro no Cadastro",
        description: error.message || "Não foi possível criar sua conta.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo(a), ${name}. Faça login para começar.`
      });
      navigate('/');
    }
  };

  // Handler genérico de inputs
  const handleChange = (e) => {
    const { id, value } = e.target;
    let formattedValue = value;

    // Aplica máscaras conforme o campo
    if (id === 'phone') formattedValue = maskPhone(value);
    if (id === 'cep') formattedValue = maskCEP(value);
    if (id === 'cpfCnpj') formattedValue = maskCpfCnpj(value);

    setFormData(prev => ({ ...prev, [id]: formattedValue }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tl from-secondary to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-2xl relative z-10">
        <Card className="glass-effect border-border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="mx-auto bg-gradient-to-r from-primary to-secondary p-3 rounded-full inline-block">
              <UserPlus className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">Cadastro Profissional</CardTitle>
              <p className="text-muted-foreground">Crie sua conta para gerenciar receitas e pacientes.</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* --- DADOS PESSOAIS --- */}
              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground/80">Dados Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" placeholder="Dr. João Silva" onChange={handleChange} className="bg-input border-border" disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                    <Input 
                      id="cpfCnpj" 
                      placeholder="000.000.000-00" 
                      value={formData.cpfCnpj} 
                      onChange={handleChange} 
                      className="bg-input border-border" 
                      disabled={loading} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Login</Label>
                    <Input id="email" type="email" placeholder="nome@exemplo.com" onChange={handleChange} className="bg-input border-border" disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input 
                      id="phone" 
                      placeholder="(00) 00000-0000" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      className="bg-input border-border" 
                      disabled={loading} 
                    />
                  </div>
                </div>
              </div>

              {/* --- DADOS PROFISSIONAIS --- */}
              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground/80">Dados Profissionais</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica / Fantasia</Label>
                  <Input id="clinicName" placeholder="Clínica Veterinária Pet Feliz" onChange={handleChange} className="bg-input border-border" disabled={loading} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Registro CRMV</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                           <Select onValueChange={(value) => handleSelectChange('crmvState', value)} disabled={loading}>
                            <SelectTrigger className="bg-input border-border">
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
                          <Input id="crmvNumber" placeholder="00000" onChange={handleChange} className="bg-input border-border" disabled={loading} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sipegro">Nº SIPEGRO (Opcional)</Label>
                      <Input id="sipegro" placeholder="Para receitas controladas" onChange={handleChange} className="bg-input border-border" disabled={loading} />
                    </div>
                </div>
              </div>

              {/* --- ENDEREÇO --- */}
              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground/80">Endereço Profissional</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="relative">
                      <Input 
                        id="cep" 
                        placeholder="00000-000" 
                        value={formData.cep} 
                        onChange={handleChange} 
                        onBlur={handleCepBlur}
                        className="bg-input border-border pr-8" 
                        disabled={loading} 
                      />
                      {loadingCep && <Loader2 className="w-4 h-4 absolute right-2 top-3 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Rua / Logradouro</Label>
                    <Input id="address" value={formData.address} onChange={handleChange} className="bg-input border-border" disabled={loading} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-1 space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" value={formData.number} onChange={handleChange} className="bg-input border-border" disabled={loading} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" value={formData.neighborhood} onChange={handleChange} className="bg-input border-border" disabled={loading} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" value={formData.city} onChange={handleChange} className="bg-input border-border" disabled={loading} />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Select onValueChange={(value) => handleSelectChange('uf', value)} value={formData.uf || undefined} disabled={loading}>
                      <SelectTrigger className="bg-input border-border">
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
              </div>

              {/* --- SENHA --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 relative">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    onChange={handleChange}
                    className="bg-input border-border pr-10"
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
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    onChange={handleChange}
                    className="bg-input border-border pr-10"
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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-6 space-y-4">
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg shadow-lg" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Cadastrando...</> : 'Criar Minha Conta'}
                </Button>
                 <Button type="button" variant="link" onClick={() => navigate('/')} className="w-full text-muted-foreground" disabled={loading}>
                  Já tem uma conta? Faça login
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterScreen;