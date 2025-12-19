import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Eye, ArrowLeft, Loader2, XCircle } from 'lucide-react'; // Troquei Save por Eye (Visualizar)
import { toast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
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
  const [loading, setLoading] = useState(true);

  // Estados do Formulário
  const [prescriptionType, setPrescriptionType] = useState('prescription');
  const [issueDate, setIssueDate] = useState(new Date());
  const [purpose, setPurpose] = useState('');
  const [attestationText, setAttestationText] = useState('');
  const [medications, setMedications] = useState([
    { id: uuidv4(), name: '', dosage: '', frequency: '', duration: '' }
  ]);

  // Carregar Dados Iniciais
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: patientData, error } = await supabase
          .from('patients')
          .select(`*, tutor:tutors(*)`)
          .eq('id', patientId)
          .single();

        if (error) throw error;
        setPatient(patientData);
        setTutor(patientData.tutor);

        // Carrega perfil do vet para já montar o preview completo
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        setProfessionalProfile(profileData);

      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Dados não encontrados." });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (session?.user?.id) fetchData();
  }, [patientId, session, navigate]);

  const handleMedicationChange = (id, field, value) => {
    setMedications(prev => prev.map(med => med.id === id ? { ...med, [field]: value } : med));
  };

  const addMedicationField = () => {
    setMedications(prev => [...prev, { id: uuidv4(), name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicationField = (id) => {
    setMedications(prev => prev.filter(med => med.id !== id));
  };

  // --- MUDANÇA PRINCIPAL AQUI ---
  const handleGeneratePreview = (e) => {
    e.preventDefault();

    // Validação
    if (prescriptionType === 'prescription') {
        const isValid = medications.every(m => m.name && m.dosage && m.frequency);
        if (!isValid) {
            toast({ variant: "destructive", title: "Atenção", description: "Preencha os dados dos medicamentos." });
            return;
        }
    } else {
        if (!attestationText) {
            toast({ variant: "destructive", title: "Atenção", description: "Preencha o texto do atestado." });
            return;
        }
    }
    if (!purpose) {
        toast({ variant: "destructive", title: "Atenção", description: "A finalidade é obrigatória." });
        return;
    }

    // Montar o objeto DRAFT (Rascunho)
    const draftData = {
        isDraft: true, // Flag para a tela de preview saber
        veterinarianId: session.user.id,
        patientId: patient.id,
        tutorId: tutor.id,
        type: prescriptionType,
        issueDate: issueDate.toISOString(),
        medications: prescriptionType === 'prescription' ? medications : [],
        attestationText: prescriptionType === 'attestation' ? attestationText : null,
        purpose: purpose,
        
        // Dados completos para exibição sem ir no banco
        patient: patient,
        tutor: tutor,
        veterinarian: professionalProfile,
        unique_code: 'PREVIEW-DRAFT' // Código temporário
    };

    // Navega para o preview passando o objeto no STATE
    navigate('/prescription/preview/draft', { state: draftData });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-4 mb-8">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Nova Prescrição</h1>
            <p className="text-muted-foreground">Preencha os dados para visualizar.</p>
          </div>
        </motion.div>

        <form onSubmit={handleGeneratePreview}>
          <Card className="glass-effect border-border">
            {/* ... (O CONTEÚDO DO CARD CONTINUA IGUAL AO ANTERIOR: CAMPOS DE TEXTO, MEDICAMENTOS, ETC) ... */}
            {/* Vou omitir o meio do código para não ficar gigante, mantenha os inputs iguais */}
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dados do Documento</CardTitle>
                <CardDescription>Escolha o tipo e preencha os detalhes.</CardDescription>
              </div>
              <div className="flex space-x-2 bg-muted p-1 rounded-lg">
                <Button type="button" variant={prescriptionType === 'prescription' ? 'default' : 'ghost'} onClick={() => setPrescriptionType('prescription')} size="sm">Receita</Button>
                <Button type="button" variant={prescriptionType === 'attestation' ? 'default' : 'ghost'} onClick={() => setPrescriptionType('attestation')} size="sm">Atestado</Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Data e Finalidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 flex flex-col">
                        <Label>Data de Emissão</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={`justify-start text-left font-normal`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {issueDate ? format(issueDate, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={issueDate} onSelect={setIssueDate} initialFocus locale={ptBR}/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Finalidade / Diagnóstico *</Label>
                        <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Ex: Tratamento de Otite" required />
                    </div>
                </div>

                {prescriptionType === 'prescription' ? (
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold">Medicamentos</Label>
                        {medications.map((med, index) => (
                            <Card key={med.id} className="p-4 border border-border bg-card/50">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm text-muted-foreground">Item {index + 1}</span>
                                    {medications.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeMedicationField(med.id)}><XCircle className="h-4 w-4 text-destructive" /></Button>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <Input value={med.name} onChange={e => handleMedicationChange(med.id, 'name', e.target.value)} placeholder="Nome do Medicamento / Princípio Ativo" />
                                    </div>
                                    <Input value={med.dosage} onChange={e => handleMedicationChange(med.id, 'dosage', e.target.value)} placeholder="Dosagem (Ex: 1 comp)" />
                                    <Input value={med.frequency} onChange={e => handleMedicationChange(med.id, 'frequency', e.target.value)} placeholder="Frequência (Ex: 12/12h)" />
                                    <div className="md:col-span-2"><Input value={med.duration} onChange={e => handleMedicationChange(med.id, 'duration', e.target.value)} placeholder="Duração / Observações (Ex: 7 dias)" /></div>
                                </div>
                            </Card>
                        ))}
                        <Button type="button" onClick={addMedicationField} variant="outline" className="w-full"><PlusCircle className="w-4 h-4 mr-2" /> Adicionar Medicamento</Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label>Texto do Atestado *</Label>
                        <Textarea value={attestationText} onChange={e => setAttestationText(e.target.value)} placeholder="Digite o conteúdo do atestado..." className="min-h-[200px]" />
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-end">
              <Button type="submit" className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                <Eye className="w-4 h-4 mr-2" />
                Gerar Prévia
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;