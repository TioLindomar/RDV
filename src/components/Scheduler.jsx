import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Trash2, ArrowLeft, Plus, Clock, User, PawPrint, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { format, isSameDay, set, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Scheduler = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [patients, setPatients] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedTutor, setSelectedTutor] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Atualizei o estado para ter startTime e endTime
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    startTime: '',
    endTime: '',
    reason: ''
  });

  // 1. Carregar Dados Iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      
      try {
        const { data: tutorsData } = await supabase
          .from('tutors')
          .select('id, name')
          .order('name');
        setTutors(tutorsData || []);

        // Agora buscamos start_time E end_time
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`
            id, 
            start_time, 
            end_time,
            notes, 
            tutor:tutors(name), 
            patient:patients(name)
          `);
          
        const formattedAppointments = (appointmentsData || []).map(app => ({
            id: app.id,
            date: app.start_time, 
            // Formatamos para mostrar na lista
            startTimeFormatted: format(new Date(app.start_time), 'HH:mm'),
            endTimeFormatted: app.end_time ? format(new Date(app.end_time), 'HH:mm') : '??:??',
            reason: app.notes,
            tutorName: app.tutor?.name,
            patientName: app.patient?.name
        }));

        setAppointments(formattedAppointments);

      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar agenda." });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [session]);

  // 2. Carregar Pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      if (!selectedTutor) {
        setPatients([]);
        return;
      }
      const { data } = await supabase.from('patients').select('id, name').eq('tutor_id', selectedTutor); 
      setPatients(data || []);
      setNewAppointment(prev => ({ ...prev, patientId: '' }));
    };
    fetchPatients();
  }, [selectedTutor]);

  // Função inteligente para lidar com horários
  const handleTimeChange = (e) => {
    const { id, value } = e.target;
    
    // Se mudou o horário de início, sugere automaticamente o fim para 30min depois
    if (id === 'startTime') {
        let suggestedEndTime = '';
        if (value) {
            const [h, m] = value.split(':').map(Number);
            // Cria uma data fake só para somar minutos
            const tempDate = set(new Date(), { hours: h, minutes: m });
            const futureDate = addMinutes(tempDate, 30);
            suggestedEndTime = format(futureDate, 'HH:mm');
        }
        setNewAppointment(prev => ({ ...prev, startTime: value, endTime: suggestedEndTime }));
    } else {
        setNewAppointment(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewAppointment({ ...newAppointment, [id]: value });
  };

  // 3. Salvar
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    
    if (!selectedTutor || !newAppointment.patientId || !newAppointment.startTime || !newAppointment.endTime) {
        toast({ title: "Preencha todos os campos", variant: "destructive" });
        return;
    }

    if (newAppointment.startTime >= newAppointment.endTime) {
        toast({ title: "Horário Inválido", description: "O fim deve ser depois do início.", variant: "destructive" });
        return;
    }

    setIsSaving(true);

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', session.user.id)
            .single();

        if (!profile) throw new Error("Erro de perfil.");

        // Construir Timestamp ISO para Início
        const [startH, startM] = newAppointment.startTime.split(':').map(Number);
        const startDateTime = set(date, { hours: startH, minutes: startM, seconds: 0 });

        // Construir Timestamp ISO para Fim
        const [endH, endM] = newAppointment.endTime.split(':').map(Number);
        const endDateTime = set(date, { hours: endH, minutes: endM, seconds: 0 });

        const payload = {
            organization_id: profile.organization_id,
            tutor_id: selectedTutor,
            patient_id: newAppointment.patientId,
            veterinarian_id: session.user.id,
            title: newAppointment.reason || 'Consulta',
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(), // Salvando explicitamente
            notes: newAppointment.reason,
            status: 'scheduled'
        };

        const { data: savedApp, error } = await supabase
            .from('appointments')
            .insert([payload])
            .select(`
                id, start_time, end_time, notes, 
                tutor:tutors(name), 
                patient:patients(name)
            `)
            .single();

        if (error) throw error;

        const newAppFormatted = {
            id: savedApp.id,
            date: savedApp.start_time,
            startTimeFormatted: format(new Date(savedApp.start_time), 'HH:mm'),
            endTimeFormatted: format(new Date(savedApp.end_time), 'HH:mm'),
            reason: savedApp.notes,
            tutorName: savedApp.tutor?.name,
            patientName: savedApp.patient?.name
        };

        setAppointments([...appointments, newAppFormatted]);
        
        toast({ title: "Agendado!", description: "Consulta confirmada." });
        setIsDialogOpen(false);
        setNewAppointment({ patientId: '', startTime: '', endTime: '', reason: '' });
        setSelectedTutor('');

    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao agendar", description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
        const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
        if (error) throw error;
        setAppointments(appointments.filter(app => app.id !== appointmentId));
        toast({ title: "Cancelado", description: "Agendamento removido." });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    }
  };

  const appointmentsForSelectedDay = appointments.filter(app => isSameDay(new Date(app.date), date));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-4 mb-8">
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie suas consultas</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Calendário */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card className="glass-effect border-border shadow-xl flex justify-center p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-0"
                classNames={{
                  caption_label: "text-foreground font-bold",
                  nav_button: "text-foreground border border-border hover:bg-muted",
                  head_cell: "text-muted-foreground",
                  day: "text-foreground hover:bg-muted focus:bg-primary focus:text-white rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                  day_today: "bg-muted text-foreground font-bold border border-primary",
                }}
                locale={ptBR}
                modifiers={{ hasAppointment: appointments.map(app => new Date(app.date)) }}
                modifiersClassNames={{ hasAppointment: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full" }}
              />
            </Card>
          </motion.div>

          {/* Lista e Formulário */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
            <Card className="glass-effect border-border h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-foreground">
                  Consultas: {format(date, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-secondary to-green-500 text-white shadow-lg hover:shadow-xl transition-all">
                      <Plus className="w-4 h-4 mr-2" /> Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-effect text-foreground">
                    <DialogHeader>
                      <DialogTitle>Novo Agendamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAppointment} className="space-y-4 pt-4">
                      
                      {/* Selects de Tutor e Paciente (Iguais) */}
                      <div className="space-y-2">
                        <Label>Tutor</Label>
                        <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione o tutor" /></SelectTrigger>
                            <SelectContent>
                                {tutors.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Paciente</Label>
                        <Select value={newAppointment.patientId} onValueChange={(v) => setNewAppointment(prev => ({...prev, patientId: v}))} disabled={!selectedTutor}>
                            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                            <SelectContent>
                                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>

                      {/* AREA DE HORÁRIOS ATUALIZADA */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startTime">Início</Label>
                            <Input id="startTime" type="time" value={newAppointment.startTime} onChange={handleTimeChange} className="bg-input border-border" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endTime">Fim</Label>
                            <Input id="endTime" type="time" value={newAppointment.endTime} onChange={handleTimeChange} className="bg-input border-border" required />
                          </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Motivo / Notas</Label>
                        <Textarea id="reason" value={newAppointment.reason} onChange={handleInputChange} className="bg-input border-border" placeholder="Ex: Vacinação anual" />
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white w-full">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Agendamento'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <div className="p-6 flex-grow overflow-y-auto max-h-[500px]">
                {appointmentsForSelectedDay.length > 0 ? (
                  <ul className="space-y-3">
                    {appointmentsForSelectedDay.sort((a, b) => a.startTimeFormatted.localeCompare(b.startTimeFormatted)).map(app => (
                      <li key={app.id} className="p-4 bg-muted/30 rounded-lg border border-border flex justify-between items-center group hover:bg-muted/50 transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/20 text-primary rounded-full">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            {/* MOSTRANDO INTERVALO */}
                            <p className="font-bold text-lg text-foreground">
                                {app.startTimeFormatted} - {app.endTimeFormatted}
                            </p>
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{app.patientName}</span> <span className="text-xs">({app.tutorName})</span>
                            </div>
                            {app.reason && <p className="text-xs text-muted-foreground mt-1 italic">{app.reason}</p>}
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
                              <AlertDialogTitle>Cancelar consulta?</AlertDialogTitle>
                              <AlertDialogDescription>O horário ficará livre novamente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAppointment(app.id)} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center justify-center opacity-50">
                    <CalendarIcon className="w-12 h-12 mb-3" />
                    <p>Agenda livre para este dia.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;