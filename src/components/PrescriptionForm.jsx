
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Save, ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { MedicationSearch } from '@/components/ui/medication-search';
import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const PrescriptionForm = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [patient, setPatient] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [prescriptionType, setPrescriptionType] = useState('prescription'); // 'prescription' or 'attestation'
  const [issueDate, setIssueDate] = useState(new Date());
  const [medications, setMedications] = useState([{ id: uuidv4(), name: '', dosage: '', instructions: '' }]);
  const [attestationText, setAttestationText] = useState('');
  const [purpose, setPurpose] = useState(''); // Purpose for the prescription
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPatientAndTutor = async () => {
      setIsLoading(true);
      try {
        const storedPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
        // FIX: Ensure ID comparison handles both string and number types
        // URL params are strings, but localStorage IDs might be numbers (timestamps)
        const currentPatient = storedPatients.find(p => String(p.id) === String(patientId));

        if (currentPatient) {
          setPatient(currentPatient);
          const storedTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
          const currentTutor = storedTutors.find(t => t.id === currentPatient.tutorId);
          if (currentTutor) {
            setTutor(currentTutor);
          }
        } else {
          toast({
            title: "Erro",
            description: "Paciente não encontrado.",
            variant: "destructive",
          });
          navigate('/dashboard');
        }

        if (session?.user?.id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching professional profile:', error);
            toast({
              title: "Erro",
              description: "Não foi possível carregar seu perfil profissional.",
              variant: "destructive",
            });
          } else if (data) {
            setProfessionalProfile(data);
          } else {
             toast({
              title: "Perfil Incompleto",
              description: "Por favor, complete seu perfil profissional para emitir prescrições.",
              variant: "destructive",
            });
            navigate('/profile');
          }
        }

      } catch (error) {
        console.error("Failed to fetch patient/tutor data:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar os dados. " + error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientAndTutor();
  }, [patientId, navigate, session]);

  const handleMedicationChange = (id, field, value) => {
    setMedications(prevMedications =>
      prevMedications.map(med =>
        med.id === id ? { ...med, [field]: value } : med
      )
    );
  };

  const addMedicationField = () => {
    setMedications(prevMedications => [
      ...prevMedications,
      { id: uuidv4(), name: '', dosage: '', instructions: '' },
    ]);
  };

  const removeMedicationField = (id) => {
    setMedications(prevMedications => prevMedications.filter(med => med.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!professionalProfile) {
        toast({
          title: "Erro",
          description: "Perfil profissional não carregado. Por favor, tente novamente.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (prescriptionType === 'prescription') {
        const hasEmptyMedicationFields = medications.some(
          med => !med.name.trim() || !med.dosage.trim() || !med.instructions.trim()
        );

        if (medications.length === 0 || hasEmptyMedicationFields) {
          toast({
            title: "Campos obrigatórios",
            description: "Por favor, preencha todos os campos dos medicamentos.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        if (!purpose.trim()) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, preencha o campo 'Finalidade da Prescrição'.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      } else { // attestation
        if (!attestationText.trim()) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, preencha o conteúdo do atestado.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        if (!purpose.trim()) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, preencha o campo 'Finalidade do Atestado'.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }
      
      const newPrescription = {
        id: uuidv4(),
        patientId: patient.id,
        tutorId: tutor.id,
        veterinarianId: session.user.id,
        type: prescriptionType,
        issueDate: issueDate.toISOString(),
        medications: prescriptionType === 'prescription' ? medications : [],
        attestationText: prescriptionType === 'attestation' ? attestationText : '',
        purpose: purpose,
        createdAt: new Date().toISOString(),
        vetName: professionalProfile.name,
        vetCrmv: professionalProfile.crmv,
        vetSipegro: professionalProfile.sipegro,
        vetPhone: professionalProfile.phone,
        vetEmail: professionalProfile.email,
        patientName: patient.name,
        patientSpecies: patient.species,
        patientBreed: patient.breed,
        patientAge: patient.age,
        patientWeight: patient.weight,
        patientSex: patient.sex,
        tutorName: tutor.name,
        tutorCpf: tutor.cpf,
        tutorPhone: tutor.phone,
        tutorEmail: tutor.email,
        uniqueCode: uuidv4(), // Unique code for public access
      };

      const storedPrescriptions = JSON.parse(localStorage.getItem('rdv_prescriptions') || '[]');
      storedPrescriptions.push(newPrescription);
      localStorage.setItem('rdv_prescriptions', JSON.stringify(storedPrescriptions));

      toast({
        title: "Sucesso!",
        description: `${prescriptionType === 'prescription' ? 'Prescrição' : 'Atestado'} gerado com sucesso.`,
      });

      navigate(`/prescription/preview/${newPrescription.id}`);

    } catch (error) {
      console.error("Erro ao salvar prescrição/atestado:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o documento. " + error.message,
        variant: "destructive",
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

  if (!patient || !tutor) {
    return null; // Should ideally be redirected by useEffect
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-4 mb-8">
          <Button onClick={() => navigate(-1)} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Nova Prescrição</h1>
            <p className="text-muted-foreground">Paciente: {patient.name} - Tutora: {tutor.name}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <form onSubmit={handleSubmit}>
            <Card className="glass-effect border-border mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Prescrição Médica Veterinária</CardTitle>
                  <CardDescription>Preencha os detalhes para a nova prescrição ou atestado.</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={prescriptionType === 'prescription' ? 'default' : 'outline'}
                    onClick={() => setPrescriptionType('prescription')}
                  >
                    Prescrição
                  </Button>
                  <Button
                    type="button"
                    variant={prescriptionType === 'attestation' ? 'default' : 'outline'}
                    onClick={() => setPrescriptionType('attestation')}
                  >
                    Atestado
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="issueDate" className="text-foreground">Data de Emissão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-[240px] justify-start text-left font-normal ${!issueDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issueDate ? format(issueDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={issueDate}
                        onSelect={setIssueDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-foreground">Finalidade da {prescriptionType === 'prescription' ? 'Prescrição' : 'Atestado'}</Label>
                  <Input 
                    id="purpose" 
                    value={purpose} 
                    onChange={(e) => setPurpose(e.target.value)} 
                    placeholder={prescriptionType === 'prescription' ? "Ex: Tratamento de infecção bacteriana, controle de dor pós-operatória" : "Ex: Comprovar estado de saúde, necessidade de repouso"}
                    className="bg-input border-border text-foreground" 
                    required
                  />
                </div>

                {prescriptionType === 'prescription' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Medicamentos</h3>
                    {medications.map((med, index) => (
                      <Card key={med.id} className="p-4 border-dashed border-border flex flex-col space-y-4">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMedicationField(med.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`medication-name-${med.id}`} className="text-foreground">Medicamento {index + 1}</Label>
                          <MedicationSearch
                            value={med.name}
                            onValueChange={(value) => handleMedicationChange(med.id, 'name', value)}
                            onSelect={(selectedMed) => {
                              handleMedicationChange(med.id, 'name', selectedMed.name);
                              // Optionally pre-fill other fields if available in selectedMed
                            }}
                            id={`medication-name-${med.id}`}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`dosage-${med.id}`} className="text-foreground">Dosagem</Label>
                            <Input
                              id={`dosage-${med.id}`}
                              value={med.dosage}
                              onChange={(e) => handleMedicationChange(med.id, 'dosage', e.target.value)}
                              placeholder="Ex: 5mg, 1 comprimido, 2 gotas"
                              className="bg-input border-border text-foreground"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`instructions-${med.id}`} className="text-foreground">Instruções de Uso</Label>
                            <Input
                              id={`instructions-${med.id}`}
                              value={med.instructions}
                              onChange={(e) => handleMedicationChange(med.id, 'instructions', e.target.value)}
                              placeholder="Ex: A cada 12 horas por 7 dias, Aplicar 2x ao dia"
                              className="bg-input border-border text-foreground"
                              required
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button type="button" onClick={addMedicationField} variant="outline" className="w-full bg-muted border-dashed border-border text-muted-foreground hover:bg-muted/80">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Adicionar Medicamento
                    </Button>
                  </div>
                )}

                {prescriptionType === 'attestation' && (
                  <div className="space-y-2">
                    <Label htmlFor="attestationText" className="text-foreground">Conteúdo do Atestado</Label>
                    <Textarea
                      id="attestationText"
                      value={attestationText}
                      onChange={(e) => setAttestationText(e.target.value)}
                      placeholder="Ex: Atesto que o animal [Nome do Paciente] necessita de [X] dias de repouso devido a [Condição]."
                      className="bg-input border-border text-foreground min-h-[150px]"
                      required
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Gerar {prescriptionType === 'prescription' ? 'Prescrição' : 'Atestado'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PrescriptionForm;
