import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
// ADICIONEI O 'Save' AQUI EMBAIXO NA LISTA DE IMPORTS
import { Plus, Search, User, Phone, Mail, MapPin, CreditCard, ArrowLeft, PawPrint, Trash2, Edit, Loader2, Save } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tutorService } from '@/services/tutorService';
import { brazilianStates, validateCPF } from '@/lib/utils';

// Máscaras
const maskPhone = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
const maskCEP = (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
const maskCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);

const TutorsList = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  
  const [editingTutor, setEditingTutor] = useState(null);
  const [tutorForm, setTutorForm] = useState({ 
    name: '', phone: '', email: '', cpf: '', 
    cep: '', address: '', number: '', neighborhood: '', city: '', state: '' 
  });

  // Carregar Tutores do Supabase
  const loadTutors = async () => {
    setIsLoading(true);
    try {
      const data = await tutorService.getAll();
      setTutors(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar tutores." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTutors();
  }, []);

  // Busca de CEP
  const handleCepBlur = async () => {
    const cep = tutorForm.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setTutorForm(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      console.error("Erro CEP:", error);
    } finally {
      setLoadingCep(false);
    }
  };

  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tutor.phone && tutor.phone.includes(searchTerm)) ||
    (tutor.email && tutor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (tutor.cpf && tutor.cpf.includes(searchTerm))
  );

  const openAddForm = () => {
    setEditingTutor(null);
    setTutorForm({ name: '', phone: '', email: '', cpf: '', cep: '', address: '', number: '', neighborhood: '', city: '', state: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (tutor) => {
    setEditingTutor(tutor);
    setTutorForm({ 
      name: tutor.name, 
      phone: tutor.phone || '', 
      email: tutor.email || '', 
      cpf: tutor.cpf || '',
      cep: tutor.cep || '',
      address: tutor.address || '',
      number: tutor.number || '',
      neighborhood: tutor.neighborhood || '',
      city: tutor.city || '',
      state: tutor.state || ''
    });
    setIsFormOpen(true);
  };

  const handleSaveTutor = async (e) => {
    e.preventDefault();
    
    if (!tutorForm.name || !tutorForm.phone) {
        toast({ variant: "destructive", title: "Erro", description: "Nome e Telefone são obrigatórios." });
        return;
    }

    if (tutorForm.cpf && !validateCPF(tutorForm.cpf)) {
        toast({ variant: "destructive", title: "Erro", description: "CPF inválido." });
        return;
    }

    setIsSaving(true);
    try {
      if (editingTutor) {
        await tutorService.update(editingTutor.id, tutorForm);
        toast({ title: "Sucesso", description: "Tutor atualizado." });
      } else {
        await tutorService.create(tutorForm);
        toast({ title: "Sucesso", description: "Novo tutor cadastrado." });
      }
      
      await loadTutors(); // Recarrega a lista
      setIsFormOpen(false);

    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Falha ao salvar." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTutor = async (tutorId) => {
    try {
      await tutorService.delete(tutorId);
      toast({ title: "Excluído", description: "Tutor removido com sucesso." });
      loadTutors();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir." });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'phone') v = maskPhone(value);
    if (name === 'cep') v = maskCEP(value);
    if (name === 'cpf') v = maskCPF(value);
    setTutorForm({ ...tutorForm, [name]: v });
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Tutores</h1>
              <p className="text-muted-foreground">Gerencie os tutores e seus dados.</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
          <Button onClick={openAddForm} className="bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Novo Tutor
          </Button>
        </motion.div>

        {isFormOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <Card className="glass-effect border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{editingTutor ? 'Editar Tutor' : 'Cadastrar Novo Tutor'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveTutor} className="space-y-4">
                  {/* Dados Básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input name="name" value={tutorForm.name} onChange={handleInputChange} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>Telefone / WhatsApp *</Label>
                        <Input name="phone" value={tutorForm.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input name="email" type="email" value={tutorForm.email} onChange={handleInputChange} className="bg-input border-border" />
                    </div>
                  </div>
                  
                  {/* Endereço */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label>CEP</Label>
                        <div className="relative">
                            <Input name="cep" value={tutorForm.cep} onChange={handleInputChange} onBlur={handleCepBlur} placeholder="00000-000" className="bg-input border-border pr-8" />
                            {loadingCep && <Loader2 className="w-4 h-4 absolute right-2 top-3 animate-spin" />}
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Endereço</Label>
                        <Input name="address" value={tutorForm.address} onChange={handleInputChange} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>Número</Label>
                        <Input name="number" value={tutorForm.number} onChange={handleInputChange} className="bg-input border-border" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input name="neighborhood" value={tutorForm.neighborhood} onChange={handleInputChange} className="bg-input border-border" />
                    </div>
                     <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input name="city" value={tutorForm.city} onChange={handleInputChange} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>UF</Label>
                        <Select value={tutorForm.state} onValueChange={(v) => setTutorForm(prev => ({...prev, state: v}))}>
                            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                            <SelectContent>{brazilianStates.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>CPF</Label>
                        <Input name="cpf" value={tutorForm.cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="bg-input border-border" />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</Button>
                    <Button type="submit" disabled={isSaving} className="bg-secondary hover:bg-secondary/90 text-white">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} Salvar Tutor
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor, index) => (
                <motion.div key={tutor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass-effect border-border hover:scale-105 transition-all duration-200 flex flex-col justify-between h-full">
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">{tutor.name}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {tutor.city ? `${tutor.city}/${tutor.state}` : 'Sem endereço'}
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="w-4 h-4" /> <span className="text-sm">{tutor.phone}</span>
                        </div>
                        {tutor.email && (
                            <div className="flex items-center space-x-2 text-muted-foreground">
                            <Mail className="w-4 h-4" /> <span className="text-sm truncate max-w-[200px]">{tutor.email}</span>
                            </div>
                        )}
                        {tutor.cpf && (
                            <div className="flex items-center space-x-2 text-muted-foreground">
                            <CreditCard className="w-4 h-4" /> <span className="text-sm">{tutor.cpf}</span>
                            </div>
                        )}
                    </div>
                    </CardContent>
                    <div className="p-6 pt-0 space-y-2">
                    <Button onClick={() => navigate(`/patients/${tutor.id}`)} className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white">
                        <PawPrint className="w-4 h-4 mr-2" /> Ver Pacientes
                    </Button>
                    
                    <div className="flex gap-2">
                        <Button onClick={() => openEditForm(tutor)} variant="outline" className="w-full bg-transparent border-border text-foreground hover:bg-muted">
                        <Edit className="w-4 h-4 mr-2" /> Editar
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full bg-destructive/20 border-destructive/30 text-destructive hover:bg-destructive/30">
                            <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-effect text-foreground">
                            <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Tutor?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                                Isso apagará o tutor <b>{tutor.name}</b> e todos os animais cadastrados para ele.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteTutor(tutor.id)}>Confirmar Exclusão</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    </div>
                </Card>
                </motion.div>
            ))}
            </div>
        )}

        {filteredTutors.length === 0 && !isLoading && !isFormOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Nenhum tutor encontrado</p>
            <Button onClick={openAddForm} className="mt-4 bg-gradient-to-r from-secondary to-green-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Cadastrar Primeiro Tutor
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TutorsList;