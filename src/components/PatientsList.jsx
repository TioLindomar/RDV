import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, PawPrint, ArrowLeft, FileText, Calendar, Trash2, History, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PatientsList = () => {
  const navigate = useNavigate();
  const { tutorId } = useParams();
  const [tutor, setTutor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
    const currentTutor = savedTutors.find(t => t.id === parseInt(tutorId));
    setTutor(currentTutor);

    const savedPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
    const tutorPatients = savedPatients.filter(p => p.tutorId === parseInt(tutorId));
    setPatients(tutorPatients);
  }, [tutorId]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewPrescription = (patientId) => {
    navigate(`/prescription/new/${patientId}`);
  };

  const handleDeletePatient = (patientId) => {
    const allPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
    const patientToDelete = allPatients.find(p => p.id === patientId);
    const tutorIdOfPatient = patientToDelete ? patientToDelete.tutorId : null;
    
    const updatedPatients = allPatients.filter(p => p.id !== patientId);
    localStorage.setItem('rdv_patients', JSON.stringify(updatedPatients));
    setPatients(updatedPatients.filter(p => p.tutorId === parseInt(tutorId)));

    if (tutorIdOfPatient) {
        const allTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
        const updatedTutors = allTutors.map(t =>
          t.id === tutorIdOfPatient ? { ...t, patients: Math.max(0, t.patients - 1) } : t
        );
        localStorage.setItem('rdv_tutors', JSON.stringify(updatedTutors));
        if(tutor.id === tutorIdOfPatient) {
            setTutor(updatedTutors.find(t => t.id === tutorIdOfPatient));
        }
    }

    toast({
      title: "Paciente excluído!",
      description: "O paciente foi removido do sistema.",
    });
  };

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground text-xl">Tutor não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/tutors')}
              variant="outline"
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Pacientes</h1>
              <p className="text-muted-foreground">Tutor: {tutor.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Add */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={() => navigate(`/patient/new/${tutorId}`)}
            className="bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </motion.div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-border hover:scale-105 transition-all duration-200 flex flex-col justify-between h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {patient.photo ? (
                        <img 
                          src={patient.photo} 
                          alt={patient.name} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-secondary shadow-sm" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-accent to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                          <PawPrint className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                        <p className="text-muted-foreground text-sm">{patient.species} - {patient.breed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span className="text-sm">Idade:</span>
                      <span className="text-sm">{patient.age || '-'}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="text-sm">Peso:</span>
                      <span className="text-sm">{patient.weight || '-'}</span>
                    </div>
                    {patient.color && (
                       <div className="flex justify-between text-muted-foreground">
                        <span className="text-sm">Cor:</span>
                        <span className="text-sm">{patient.color}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-muted-foreground pt-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Última visita: {patient.lastVisit}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 pt-0 space-y-2 mt-auto">
                  <Button
                    onClick={() => handleNewPrescription(patient.id)}
                    className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Nova Prescrição
                  </Button>
                  
                  <Button
                    onClick={() => navigate(`/patient/history/${patient.id}`)}
                    variant="outline"
                    className="w-full bg-transparent border-border text-foreground hover:bg-muted"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Histórico
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/patient/edit/${patient.id}`)}
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
                      <AlertDialogContent className="glass-effect text-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente os dados do paciente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeletePatient(patient.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <PawPrint className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Nenhum paciente encontrado</p>
            <Button
              onClick={() => navigate(`/patient/new/${tutorId}`)}
              className="mt-4 bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Paciente
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientsList;