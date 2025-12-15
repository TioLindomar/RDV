import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { brazilianStates } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

// Máscaras locais
const maskPhone = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
const maskCEP = (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
const maskCpfCnpj = (v) => {
  const val = v.replace(/\D/g, '');
  if (val.length <= 11) return val.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
  return val.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
};

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
    crmvState: '',
    crmvNumber: '',
    sipegro: '',
    clinic_name: '',
    cep: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // 1. Carregar dados do Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (data) {
          // Lógica para separar o CRMV
          let crmvState = '';
          let crmvNumber = '';
          if (data.crmv) {
            const match = data.crmv.match(/CRMV-([A-Z]{2})\s+(.+)/);
            if (match) {
              crmvState = match[1];
              crmvNumber = match[2];
            } else {
              crmvNumber = data.crmv;
            }
          }

          setFormData({
            name: data.name || '',
            email: data.email || session.user.email,
            phone: data.phone || '',
            cpf_cnpj: data.cpf_cnpj || '',
            crmvState: crmvState,
            crmvNumber: crmvNumber,
            sipegro: data.sipegro || '',
            clinic_name: data.clinic_name || '',
            cep: data.cep || '',
            address: data.address || '',
            number: data.number || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            state: data.state || ''
          });
        } else if (error) {
          console.error('Erro ao buscar perfil:', error);
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar seus dados." });
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [session]);

  // 2. Manipuladores de Input
  const handleChange = (e) => {
    const { id, value } = e.target;
    let finalValue = value;
    
    if (id === 'phone') finalValue = maskPhone(value);
    if (id === 'cep') finalValue = maskCEP(value);
    if (id === 'cpf_cnpj') finalValue = maskCpfCnpj(value);

    setFormData(prev => ({ ...prev, [id]: finalValue }));
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 3. Busca de CEP
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
          state: data.uf
        }));
        toast({ title: "Endereço encontrado", description: "Campos preenchidos automaticamente." });
      }
    } catch (error) {
      console.error("Erro CEP:", error);
    } finally {
      setLoadingCep(false);
    }
  };

  // 4. Salvar no Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const fullCrmv = formData.crmvState && formData.crmvNumber 
        ? `CRMV-${formData.crmvState} ${formData.crmvNumber}` 
        : formData.crmvNumber;

      const updates = {
        name: formData.name,
        phone: formData.phone,
        cpf_cnpj: formData.cpf_cnpj,
        crmv: fullCrmv,
        sipegro: formData.sipegro,
        clinic_name: formData.clinic_name,
        cep: formData.cep,
        address: formData.address,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        updated_at: new Date()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;

      toast({ title: "Perfil atualizado!", description: "Seus dados foram salvos com sucesso." });
      setTimeout(() => navigate('/dashboard'), 1000);

    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-4 mb-8">
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Perfil Profissional</h1>
            <p className="text-muted-foreground">Edite suas informações profissionais.</p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <form onSubmit={handleSubmit}>
            <Card className="glass-effect border-border">
              <CardHeader>
                <CardTitle>Informações do Veterinário</CardTitle>
                <CardDescription>Estes dados aparecerão em todas as prescrições emitidas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Nome e Clínica */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input id="name" value={formData.name} onChange={handleChange} required className="bg-input border-border text-foreground" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Nome da Clínica / Fantasia</Label>
                  <Input id="clinic_name" value={formData.clinic_name} onChange={handleChange} placeholder="Ex: Clínica Veterinária Pet Feliz" className="bg-input border-border text-foreground" />
                </div>
                
                {/* Dados de Registro (CRMV/SIPEGRO) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="crmvState">UF *</Label>
                      <Select value={formData.crmvState} onValueChange={(v) => handleSelectChange('crmvState', v)}>
                        <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{brazilianStates.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="crmvNumber">Nº CRMV *</Label>
                      <Input id="crmvNumber" value={formData.crmvNumber} onChange={handleChange} required className="bg-input border-border text-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="sipegro">Nº SIPEGRO (Mapa)</Label>
                      <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5"><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger>
                        <PopoverContent className="w-80"><p className="text-sm">Para receitas controladas, consulte seu registro no sistema do MAPA.</p></PopoverContent>
                      </Popover>
                    </div>
                    <Input id="sipegro" value={formData.sipegro} onChange={handleChange} className="bg-input border-border text-foreground" />
                  </div>
                </div>

                {/* Contatos e Documentos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <Label htmlFor="email">Email de Login</Label>
                    <Input id="email" value={formData.email} disabled className="bg-muted border-border text-muted-foreground" />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / Whatsapp *</Label>
                    <Input id="phone" value={formData.phone} onChange={handleChange} required placeholder="(00) 00000-0000" className="bg-input border-border text-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
                  <Input id="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} placeholder="000.000.000-00" className="bg-input border-border text-foreground" />
                </div>

                {/* Endereço */}
                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="text-md font-semibold mb-4 text-foreground">Endereço da Clínica</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <Input id="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" className="bg-input border-border text-foreground pr-8" />
                        {loadingCep && <Loader2 className="w-4 h-4 absolute right-2 top-3 animate-spin text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Rua / Logradouro</Label>
                      <Input id="address" value={formData.address} onChange={handleChange} className="bg-input border-border text-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="number">Número</Label>
                      <Input id="number" value={formData.number} onChange={handleChange} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input id="neighborhood" value={formData.neighborhood} onChange={handleChange} className="bg-input border-border text-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" value={formData.city} onChange={handleChange} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="state">UF</Label>
                      <Select value={formData.state} onValueChange={(v) => handleSelectChange('state', v)}>
                        <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{brazilianStates.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving} 
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettings;