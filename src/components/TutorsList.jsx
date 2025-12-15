import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, User, Phone, Mail, MapPin, CreditCard, ArrowLeft, PawPrint, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { tutorSchema } from '@/lib/schemas';

const TutorsList = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState(null); // Holds tutor object if editing
  const [tutorForm, setTutorForm] = useState({ name: '', phone: '', email: '', address: '', cpf: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
    setTutors(savedTutors);
  }, []);

  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.phone.includes(searchTerm) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.cpf.includes(searchTerm)
  );

  const openAddForm = () => {
    setEditingTutor(null);
    setTutorForm({ name: '', phone: '', email: '', address: '', cpf: '' });
    setIsFormOpen(true);
    setErrors({});
  };

  const openEditForm = (tutor) => {
    setEditingTutor(tutor);
    setTutorForm({ 
      name: tutor.name, 
      phone: tutor.phone, 
      email: tutor.email, 
      address: tutor.address, 
      cpf: tutor.cpf 
    });
    setIsFormOpen(true);
    setErrors({});
  };

  const handleSaveTutor = (e) => {
    e.preventDefault();
    const result = tutorSchema.safeParse(tutorForm);
    if (!result.success) {
      const newErrors = {};
      result.error.errors.forEach(err => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos indicados.",
        variant: "destructive"
      });
      return;
    }

    setErrors({});
    let updatedTutors = [];
    
    if (editingTutor) {
      // Update existing tutor
      updatedTutors = tutors.map(t => 
        t.id === editingTutor.id ? { ...t, ...result.data } : t
      );
      toast({
        title: "Tutor atualizado!",
        description: `${result.data.name} foi atualizado com sucesso.`,
      });
    } else {
      // Create new tutor
      const newTutorEntry = {
        id: Date.now(),
        ...result.data,
        patients: 0
      };
      updatedTutors = [...tutors, newTutorEntry];
      toast({
        title: "Tutor cadastrado!",
        description: `${newTutorEntry.name} foi adicionado ao sistema.`,
      });
    }

    setTutors(updatedTutors);
    localStorage.setItem('rdv_tutors', JSON.stringify(updatedTutors));
    setIsFormOpen(false);
  };

  const handleDeleteTutor = (tutorId) => {
    const allTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
    const updatedTutors = allTutors.filter(t => t.id !== tutorId);
    setTutors(updatedTutors);
    localStorage.setItem('rdv_tutors', JSON.stringify(updatedTutors));
    
    const allPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
    const updatedPatients = allPatients.filter(p => p.tutorId !== tutorId);
    localStorage.setItem('rdv_patients', JSON.stringify(updatedPatients));

    toast({
      title: "Tutor excluído!",
      description: "O tutor e todos os seus pacientes foram removidos.",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTutorForm({ ...tutorForm, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Tutores</h1>
              <p className="text-muted-foreground">Gerencie os tutores dos pacientes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tutores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={openAddForm}
            className="bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Tutor
          </Button>
        </motion.div>

        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="glass-effect border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {editingTutor ? 'Editar Tutor' : 'Cadastrar Novo Tutor'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveTutor} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Input name="name" placeholder="Nome completo" value={tutorForm.name} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                      {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Input name="phone" placeholder="Telefone" value={tutorForm.phone} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <Input name="email" placeholder="Email" type="email" value={tutorForm.email} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Input name="address" placeholder="Endereço" value={tutorForm.address} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                      {errors.address && <p className="text-destructive text-xs mt-1">{errors.address}</p>}
                    </div>
                    <div>
                      <Input name="cpf" placeholder="CPF (XXX.XXX.XXX-XX)" value={tutorForm.cpf} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                      {errors.cpf && <p className="text-destructive text-xs mt-1">{errors.cpf}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setErrors({}); }} className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</Button>
                    <Button type="submit" className="bg-secondary hover:bg-secondary/90">Salvar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor, index) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-border hover:scale-105 transition-all duration-200 flex flex-col justify-between">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{tutor.name}</h3>
                        <p className="text-muted-foreground text-sm">{tutor.patients} paciente(s)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{tutor.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{tutor.email}</span>
                    </div>
                    {tutor.address && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{tutor.address}</span>
                      </div>
                    )}
                    {tutor.cpf && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm">{tutor.cpf}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="p-6 pt-0 space-y-2">
                  <Button
                    onClick={() => navigate(`/patients/${tutor.id}`)}
                    className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white"
                  >
                    <PawPrint className="w-4 h-4 mr-2" />
                    Ver Pacientes
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openEditForm(tutor)}
                      variant="outline"
                      className="w-full bg-transparent border-border text-foreground hover:bg-muted"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full bg-destructive/20 border-destructive/30 text-destructive hover:bg-destructive/30">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-effect text-foreground">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o tutor e TODOS os seus pacientes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteTutor(tutor.id)}>Excluir Tutor e Pacientes</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredTutors.length === 0 && !isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Nenhum tutor encontrado</p>
            <Button
              onClick={openAddForm}
              className="mt-4 bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Tutor
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TutorsList;