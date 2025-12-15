
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Camera, Eye, EyeOff, Trash2, Loader2, Info } from 'lucide-react';
import { formatCPF, validateCPF, brazilianStates } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [user, setUser] = useState({});
  const [crmvState, setCrmvState] = useState('');
  const [crmvNumber, setCrmvNumber] = useState('');
  const [sipegro, setSipegro] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      let loadedData = {};

      // 1. Try to get from Supabase first
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (data) {
          loadedData = {
            ...data,
            email: session.user.email // Email comes from auth
          };
        } else if (error) {
          console.error('Error fetching profile:', error);
        }
      }

      // 2. Fallback to LocalStorage if Supabase is empty or failed
      if (!loadedData.name) {
        const localUser = JSON.parse(localStorage.getItem('rdv_user') || '{}');
        if (localUser.name) {
           loadedData = { ...localUser, ...loadedData };
        }
      }

      // Set state
      setUser(loadedData);
      setSipegro(loadedData.sipegro || '');
      setProfilePic(loadedData.profile_pic_url || loadedData.profilePic || null);
      setPhone(loadedData.phone || '');
      setSpecialty(loadedData.specialty || '');
      
      // Improved CRMV Parsing
      if (loadedData.crmv) {
        // Handle standard format "CRMV-UF 12345"
        const standardMatch = loadedData.crmv.match(/CRMV-([A-Z]{2})\s+(.+)/);
        if (standardMatch) {
          setCrmvState(standardMatch[1]);
          setCrmvNumber(standardMatch[2]);
        } else {
            // Fallback for non-standard formats, try to just split by space if contains CRMV-
            const parts = loadedData.crmv.replace('CRMV-', '').trim().split(' ');
            if (parts.length >= 2) {
                setCrmvState(parts[0].toUpperCase());
                setCrmvNumber(parts.slice(1).join(' '));
            } else if (parts.length === 1 && parts[0]) {
                 setCrmvNumber(parts[0]);
            }
        }
      }
      
      setIsLoading(false);
    };

    fetchProfile();
  }, [session]);

  const handleInputChange = e => {
    const { id, value } = e.target;
    if (id === 'cpf') {
      setUser(prevUser => ({
        ...prevUser,
        [id]: formatCPF(value)
      }));
    } else {
      setUser(prevUser => ({
        ...prevUser,
        [id]: value
      }));
    }
  };

  const handleSelectChange = value => {
    setCrmvState(value);
  };

  const handleProfilePicChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to ~1MB for base64 safety in TEXT columns)
      if (file.size > 1024 * 1024) {
          toast({
              title: "Arquivo muito grande",
              description: "A imagem deve ter no máximo 1MB.",
              variant: "destructive"
          });
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePic = () => {
    setProfilePic(null);
    if (fileInputRef.current) fileInputRef.current.value = null; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.cpf && !validateCPF(user.cpf)) {
      toast({
        title: "Erro na atualização",
        description: "O CPF informado é inválido.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);

    try {
      const fullCrmv = crmvState && crmvNumber ? `CRMV-${crmvState} ${crmvNumber}` : '';
      
      const profileData = {
        name: user.name,
        crmv: fullCrmv,
        cpf: user.cpf,
        phone: phone,
        specialty: specialty,
        address: user.address,
        sipegro: sipegro,
        profile_pic_url: profilePic, 
        email: session?.user?.email || user.email
      };

      // 1. Save to Supabase
      if (session?.user?.id) {
        // Check if profile exists to determine if we need to set created_at
        // This prevents constraint violations if the column is NOT NULL with no default
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

        const upsertData = {
            id: session.user.id,
            ...profileData,
            updated_at: new Date().toISOString()
        };

        if (!existingProfile) {
            upsertData.created_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('profiles')
          .upsert(upsertData);
          
        if (error) throw error;
      }

      // 2. Save to LocalStorage (Legacy Compatibility/Offline Backup)
      const legacyUser = {
        ...user,
        ...profileData,
        profilePic: profilePic // legacy key name
      };
      localStorage.setItem('rdv_user', JSON.stringify(legacyUser));
      
      // Update users list (Legacy)
      const allUsers = JSON.parse(localStorage.getItem('rdv_users') || '[]');
      const userIndex = allUsers.findIndex(u => u.email === legacyUser.email);
      if (userIndex > -1) {
        allUsers[userIndex] = { ...allUsers[userIndex], ...legacyUser };
        localStorage.setItem('rdv_users', JSON.stringify(allUsers));
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
      
      setTimeout(() => navigate('/dashboard'), 1000);

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar seus dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <div 
                      className="w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-border" 
                      onClick={() => fileInputRef.current.click()}
                    >
                      {profilePic ? (
                        <img src={profilePic} alt="Foto de Perfil" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleProfilePicChange} 
                    />
                    {profilePic && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemoveProfilePic}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <CardTitle>Informações do Veterinário</CardTitle>
                    <CardDescription>Estes dados aparecerão em todas as prescrições emitidas.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Nome Completo *</Label>
                  <Input 
                    id="name" 
                    value={user.name || ''} 
                    onChange={handleInputChange} 
                    className="bg-input border-border text-foreground" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-foreground">Especialidade</Label>
                  <Input 
                    id="specialty" 
                    value={specialty} 
                    onChange={e => setSpecialty(e.target.value)} 
                    placeholder="Ex: Clínica Geral, Dermatologia, Ortopedia" 
                    className="bg-input border-border text-foreground" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="crmvState">Estado *</Label>
                      <Select onValueChange={handleSelectChange} value={crmvState} required>
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
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="crmvNumber" className="text-foreground">Nº CRMV *</Label>
                      <Input 
                        id="crmvNumber" 
                        value={crmvNumber} 
                        onChange={e => setCrmvNumber(e.target.value)} 
                        className="bg-input border-border text-foreground" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="sipegro" className="text-foreground">Nº SIPEGRO (Mapa)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <p className="text-sm">
                            Para saber seu número de registro, acesse o menu "Produtos", "Relatórios" e selecione o subitem "Emitir Relatório de Dados Gerais do Produto", e consulte o(s) produtos cadastrados.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input 
                        id="sipegro" 
                        value={sipegro} 
                        onChange={e => setSipegro(e.target.value)} 
                        className="bg-input border-border text-foreground" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email Profissional</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={user.email || ''} 
                        onChange={handleInputChange} 
                        className="bg-input border-border text-foreground" 
                        disabled 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground">Telefone / Whatsapp *</Label>
                      <Input 
                        id="phone" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="(00) 00000-0000" 
                        className="bg-input border-border text-foreground" 
                        required 
                      />
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-foreground">CPF</Label>
                  <Input 
                    id="cpf" 
                    value={user.cpf || ''} 
                    onChange={handleInputChange} 
                    placeholder="123.456.789-00" 
                    className="bg-input border-border text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground">Endereço Completo (Clínica/Consultório)</Label>
                  <Input 
                    id="address" 
                    value={user.address || ''} 
                    onChange={handleInputChange} 
                    placeholder="Rua, Número, Bairro - Cidade - UF" 
                    className="bg-input border-border text-foreground" 
                  />
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
