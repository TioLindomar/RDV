import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Clock, User, PawPrint } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentSchema } from '@/lib/schemas';

const Scheduler = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    tutorId: '',
    patientId: '',
    time: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedAppointments = JSON.parse(localStorage.getItem('rdv_appointments') || '[]');
    setAppointments(savedAppointments);
    const savedTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
    setTutors(savedTutors);
  }, []);

  useEffect(() => {
    if (selectedTutor) {
      const allPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
      setPatients(allPatients.filter(p => String(p.tutorId) === selectedTutor));
    } else {
      setPatients([]);
    }
    setNewAppointment(prev => ({ ...prev, patientId: '' }));
  }, [selectedTutor]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewAppointment({ ...newAppointment, [id]: value });
    if (errors[id]) {
      setErrors({ ...errors, [id]: null });
    }
  };

  const handleAddAppointment = (e) => {
    e.preventDefault();
    const result = appointmentSchema.safeParse(newAppointment);
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
    const appointment = {
      id: Date.now(),
      date: date.toISOString(),
      ...result.data
    };

    const updatedAppointments = [...appointments, appointment];
    setAppointments(updatedAppointments);
    localStorage.setItem('rdv_appointments', JSON.stringify(updatedAppointments));
    
    toast({
      title: "Agendamento criado!",
      description: "A consulta foi agendada com sucesso."
    });
    
    setIsDialogOpen(false);
    setNewAppointment({ tutorId: '', patientId: '', time: '', reason: '' });
    setSelectedTutor('');
  };

  const handleDeleteAppointment = (appointmentId) => {
    const updatedAppointments = appointments.filter(app => app.id !== appointmentId);
    setAppointments(updatedAppointments);
    localStorage.setItem('rdv_appointments', JSON.stringify(updatedAppointments));
    toast({
      title: "Agendamento excluído",
      description: "A consulta foi removida da sua agenda.",
    });
  };

  const appointmentsForSelectedDay = appointments.filter(app => isSameDay(new Date(app.date), date));

  const getTutorName = (tutorId) => tutors.find(t => String(t.id) === tutorId)?.name || 'Desconhecido';
  const getPatientName = (patientId) => {
    const allPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
    return allPatients.find(p => String(p.id) === patientId)?.name || 'Desconhecido';
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 mb-8"
        >
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="bg-transparent border-border text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie suas consultas</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="glass-effect border-border shadow-xl flex justify-center p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-0"
                classNames={{
                  caption_label: "text-foreground",
                  nav_button: "text-muted-foreground",
                  head_cell: "text-muted-foreground",
                  day: "text-foreground hover:bg-muted",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  day_today: "bg-muted text-foreground font-bold",
                  day_outside: "text-muted-foreground opacity-70",
                }}
                locale={ptBR}
                modifiers={{
                  hasAppointment: appointments.map(app => new Date(app.date))
                }}
                modifiersClassNames={{
                  hasAppointment: "has-appointment-dot",
                }}
              />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card className="glass-effect border-border h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">
                  Consultas para {format(date, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Agendar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-effect text-foreground">
                    <DialogHeader>
                      <DialogTitle>Novo Agendamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAppointment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tutorId" className="text-foreground">Tutor</Label>
                        <Select
                            value={selectedTutor}
                            onValueChange={(value) => {
                                setSelectedTutor(value);
                                setNewAppointment({ ...newAppointment, tutorId: value, patientId: '' });
                                if (errors.tutorId) setErrors({ ...errors, tutorId: null });
                            }}
                        >
                          <select id="tutorId" className="w-full bg-input border-border text-foreground h-10 rounded-md px-3">
                            <option value="">Selecione o tutor</option>
                            {tutors.map(tutor => (
                              <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
                            ))}
                          </select>
                        </Select>
                        {errors.tutorId && <p className="text-destructive text-xs mt-1">{errors.tutorId}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patientId" className="text-foreground">Paciente</Label>
                         <Select
                            value={newAppointment.patientId}
                            onValueChange={(value) => {
                                setNewAppointment({ ...newAppointment, patientId: value });
                                if (errors.patientId) setErrors({ ...errors, patientId: null });
                            }}
                            disabled={!selectedTutor}
                        >
                          <select id="patientId" disabled={!selectedTutor} className="w-full bg-input border-border text-foreground h-10 rounded-md px-3 disabled:opacity-50">
                            <option value="">Selecione o paciente</option>
                            {patients.map(patient => (
                              <option key={patient.id} value={patient.id}>{patient.name}</option>
                            ))}
                          </select>
                        </Select>
                        {errors.patientId && <p className="text-destructive text-xs mt-1">{errors.patientId}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time" className="text-foreground">Horário</Label>
                        <Input id="time" type="time" value={newAppointment.time} onChange={handleInputChange} className="bg-input border-border text-foreground" />
                        {errors.time && <p className="text-destructive text-xs mt-1">{errors.time}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason" className="text-foreground">Motivo</Label>
                        <Textarea id="reason" value={newAppointment.reason} onChange={handleInputChange} className="bg-input border-border text-foreground" placeholder="Motivo da consulta" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-gradient-to-r from-secondary to-green-500">Salvar</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-y-auto">
                {appointmentsForSelectedDay.length > 0 ? (
                  <ul className="space-y-4">
                    {appointmentsForSelectedDay.sort((a, b) => a.time.localeCompare(b.time)).map(app => (
                      <li key={app.id} className="group p-4 bg-muted/50 rounded-lg border border-border flex justify-between items-start hover:bg-muted transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary rounded-full">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{app.time}</p>
                            <div className="text-sm text-muted-foreground flex items-center space-x-2">
                              <User className="w-3 h-3" />
                              <span>{getTutorName(app.tutorId)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-2">
                              <PawPrint className="w-3 h-3" />
                              <span>{getPatientName(app.patientId)}</span>
                            </div>
                            {app.reason && <p className="text-sm text-muted-foreground mt-1">{app.reason}</p>}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-effect text-foreground border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Esta ação não pode ser desfeita. Isso irá excluir permanentemente o agendamento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAppointment(app.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                    <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma consulta para este dia.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;