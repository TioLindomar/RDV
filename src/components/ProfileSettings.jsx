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

// Máscaras
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
    name: '', email: '', phone: '', cpf_cnpj: '', crmvState: '', crmvNumber: '',
    sipegro: '', clinic_name: '', cep: '', address: '', number: '', neighborhood: '', city: '', state: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (data) {
        // Parse CRMV
        let crmvState = '', crmvNumber = '';
        if (data.crmv) {
          const match = data.crmv.match(/CRMV-([A-Z]{2})\s+(.+)/);
          if (match) { crmvState = match[1]; crmvNumber = match[2]; } 
          else { crmvNumber = data.crmv; }
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
        console.error('Erro profile:', error);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [session]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    let v = value;
    if (id === 'phone') v = maskPhone(value);
    if (id === 'cep') v = maskCEP(value);
    if (id === 'cpf_cnpj') v = maskCpfCnpj(value);
    setFormData(prev => ({ ...prev, [id]: v }));
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev, address: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf
        }));
      }
    } catch (error) { console.error(error); } 
    finally { setLoadingCep(false); }
  };

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

      toast({ title: "Sucesso", description: "Perfil atualizado." });
      // Removemos o redirect forçado para dar feedback visual que salvou
      // setTimeout(() => navigate('/dashboard'), 1000); 

    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-4 mb-8">
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">Perfil Profissional</h1>
            <p className="text-muted-foreground">Mantenha seus dados atualizados.</p>
          </div>
        </motion.div>
        
        <form onSubmit={handleSubmit}>
          <Card className="glass-effect border-border">
            <CardHeader>
              <CardTitle>Dados do Veterinário</CardTitle>
              <CardDescription>Estes dados aparecerão no cabeçalho das receitas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" value={formData.name} onChange={handleChange} required className="bg-input border-border" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic_name">Nome da Clínica (Fantasia)</Label>
                <Input id="clinic_name" value={formData.clinic_name} onChange={handleChange} className="bg-input border-border" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2 md:col-span-1">
                    <Label>UF CRMV</Label>
                    <Select value={formData.crmvState} onValueChange={(v) => handleSelectChange('crmvState', v)}>
                      <SelectTrigger className="bg-input border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{brazilianStates.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nº CRMV *</Label>
                    <Input id="crmvNumber" value={formData.crmvNumber} onChange={handleChange} required className="bg-input border-border" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nº SIPEGRO (Mapa)</Label>
                  <Input id="sipegro" value={formData.sipegro} onChange={handleChange} className="bg-input border-border" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label>Email (Login)</Label>
                  <Input id="email" value={formData.email} disabled className="bg-muted border-border" />
                </div>
                 <div className="space-y-2">
                  <Label>WhatsApp Profissional *</Label>
                  <Input id="phone" value={formData.phone} onChange={handleChange} required className="bg-input border-border" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>CPF / CNPJ</Label>
                <Input id="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} className="bg-input border-border" />
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-md font-semibold mb-4 text-foreground">Endereço</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="col-span-1 space-y-2">
                    <Label>CEP</Label>
                    <div className="relative">
                      <Input id="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} className="bg-input border-border pr-8" />
                      {loadingCep && <Loader2 className="w-4 h-4 absolute right-2 top-3 animate-spin" />}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Rua</Label>
                    <Input id="address" value={formData.address} onChange={handleChange} className="bg-input border-border" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="col-span-1 space-y-2">
                    <Label>Número</Label>
                    <Input id="number" value={formData.number} onChange={handleChange} className="bg-input border-border" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Bairro</Label>
                    <Input id="neighborhood" value={formData.neighborhood} onChange={handleChange} className="bg-input border-border" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Cidade</Label>
                    <Input id="city" value={formData.city} onChange={handleChange} className="bg-input border-border" />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>UF</Label>
                    <Select value={formData.state} onValueChange={(v) => handleSelectChange('state', v)}>
                      <SelectTrigger className="bg-input border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{brazilianStates.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;