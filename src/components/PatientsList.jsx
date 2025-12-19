import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, PawPrint, ArrowLeft, FileText, Calendar, Trash2, History, Edit, Save, Loader2, Weight, Ruler } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { tutorService } from '@/services/tutorService';
import { patientService } from '@/services/patientService';

const PatientsList = () => {
  const navigate = useNavigate();
  const { tutorId } = useParams();
  
  const [tutor, setTutor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle do Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    name: '', species: '', breed: '', sex: '', 
    weight: '', birth_date: '', coat_color: '', 
    microchip_number: '', is_neutered: false, notes: ''
  });

  // Carregar Dados Iniciais
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Buscar dados do Tutor (para o cabeçalho)
      const tutorData = await tutorService.getById(tutorId);
      setTutor(tutorData);

      // 2. Buscar Pacientes desse Tutor
      const patientsData = await patientService.getByTutorId(tutorId);
      setPatients(patientsData || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados." });
      navigate('/tutors'); // Volta se der erro crítico (tutor não existe)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tutorId) loadData();
  }, [tutorId]);

  // Manipulação do Modal
  const openAddForm = () => {
    setEditingPatient(null);
    setFormData({ 
      name: '', species: '', breed: '', sex: '', 
      weight: '', birth_date: '', coat_color: '', 
      microchip_number: '', is_neutered: false, notes: '' 
    });
    setIsFormOpen(true);
  };

  const openEditForm = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      species: patient.species || '',
      breed: patient.breed || '',
      sex: patient.sex || '',
      weight: patient.weight || '',
      birth_date: patient.birth_date || '',
      coat_color: patient.coat_color || '',
      microchip_number: patient.microchip_number || '',
      is_neutered: patient.is_neutered || false,
      notes: patient.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.species) {
      toast({ variant: "destructive", title: "Erro", description: "Nome e Espécie são obrigatórios." });
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...formData, tutor_id: tutorId };
      
      if (editingPatient) {
        await patientService.update(editingPatient.id, payload);
        toast({ title: "Sucesso", description: "Paciente atualizado." });
      } else {
        await patientService.create(payload);
        toast({ title: "Sucesso", description: "Paciente cadastrado." });
      }
      
      setIsFormOpen(false);
      loadData(); // Recarrega lista
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await patientService.delete(id);
      toast({ title: "Excluído", description: "Paciente removido." });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir." });
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.breed && p.breed.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Utilitário para calcular idade
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Idade desconhecida';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    
    if (age === 0) {
        const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        return `${months} meses`;
    }
    return `${age} anos`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button onClick={() => navigate('/tutors')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Pacientes</h1>
              <p className="text-muted-foreground">Tutor: <span className="font-semibold text-primary">{tutor?.name}</span></p>
            </div>
          </div>
        </motion.div>

        {/* Barra de Busca e Botão Novo */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou raça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
          <Button onClick={openAddForm} className="bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Novo Paciente
          </Button>
        </motion.div>

        {/* Modal de Cadastro/Edição */}
        {isFormOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <Card className="glass-effect border-border">
              <CardHeader><CardTitle>{editingPatient ? 'Editar Paciente' : 'Novo Paciente'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  
                  {/* Linha 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Nome do Animal *</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>Espécie *</Label>
                        <Select value={formData.species} onValueChange={v => setFormData({...formData, species: v})}>
                            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Canina">Canina (Cão)</SelectItem>
                                <SelectItem value="Felina">Felina (Gato)</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Raça</Label>
                        <Input value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} className="bg-input border-border" />
                    </div>
                  </div>

                  {/* Linha 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Sexo</Label>
                        <Select value={formData.sex} onValueChange={v => setFormData({...formData, sex: v})}>
                            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Macho">Macho</SelectItem>
                                <SelectItem value="Femea">Fêmea</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Peso (kg)</Label>
                        <div className="relative">
                            <Input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="bg-input border-border pr-8" />
                            <Weight className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Nascimento</Label>
                        <Input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>Pelagem / Cor</Label>
                        <Input value={formData.coat_color} onChange={e => setFormData({...formData, coat_color: e.target.value})} className="bg-input border-border" />
                    </div>
                  </div>

                  {/* Linha 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Microchip (Opcional)</Label>
                        <Input value={formData.microchip_number} onChange={e => setFormData({...formData, microchip_number: e.target.value})} className="bg-input border-border" />
                    </div>
                    <div className="flex items-center space-x-2 pb-3">
                        <Checkbox 
                            id="neutered" 
                            checked={formData.is_neutered} 
                            onCheckedChange={(checked) => setFormData({...formData, is_neutered: checked})} 
                        />
                        <Label htmlFor="neutered" className="cursor-pointer">Animal Castrado?</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</Button>
                    <Button type="submit" disabled={isSaving} className="bg-secondary hover:bg-secondary/90 text-white">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} Salvar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Lista de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => (
            <motion.div key={patient.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass-effect border-border hover:scale-105 transition-all duration-200 flex flex-col justify-between h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-accent to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                        <PawPrint className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                        <p className="text-muted-foreground text-sm">{patient.species} • {patient.breed || 'SRD'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">Idade:</span>
                      <span>{calculateAge(patient.birth_date)}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">Peso:</span>
                      <span>{patient.weight ? `${patient.weight} kg` : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">Sexo:</span>
                      <span>{patient.sex || '-'} {patient.is_neutered ? '(Castrado)' : ''}</span>
                    </div>
                  </div>
                </CardContent>
                
                <div className="p-6 pt-0 space-y-2">
                  <Button onClick={() => navigate(`/prescription/new/${patient.id}`)} className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white">
                    <FileText className="w-4 h-4 mr-2" /> Nova Prescrição
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => openEditForm(patient)} variant="outline" className="w-full bg-transparent border-border text-foreground hover:bg-muted">
                        <Edit className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full bg-destructive/20 border-destructive/30 text-destructive hover:bg-destructive/30"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-effect text-foreground">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Paciente?</AlertDialogTitle>
                          <AlertDialogDescription>Essa ação apagará todo o histórico clínico deste animal.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-transparent border-border hover:bg-muted">Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(patient.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPatients.length === 0 && !isFormOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <PawPrint className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Nenhum paciente encontrado para este tutor.</p>
            <Button onClick={openAddForm} className="mt-4 bg-gradient-to-r from-secondary to-green-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Cadastrar Primeiro Paciente
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientsList;