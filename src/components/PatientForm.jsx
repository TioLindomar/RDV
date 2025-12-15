import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, PawPrint, Camera, Trash2 } from 'lucide-react';
import { patientSchema } from '@/lib/schemas';
import { Combobox } from '@/components/ui/combobox';

const dogBreeds = [
  { value: "sem raça definida (srd)", label: "Sem Raça Definida (SRD)" },
  { value: "bulldog francês", label: "Bulldog Francês" },
  { value: "shih tzu", label: "Shih Tzu" },
  { value: "poodle", label: "Poodle" },
  { value: "lhasa apso", label: "Lhasa Apso" },
  { value: "yorkshire terrier", label: "Yorkshire Terrier" },
  { value: "maltês", label: "Maltês" },
  { value: "golden retriever", label: "Golden Retriever" },
  { value: "labrador retriever", label: "Labrador Retriever" },
  { value: "pastor alemão", label: "Pastor Alemão" },
  { value: "rottweiler", label: "Rottweiler" },
  { value: "outro", label: "Outro" },
];

const catBreeds = [
  { value: "sem raça definida (srd)", label: "Sem Raça Definida (SRD)" },
  { value: "persa", label: "Persa" },
  { value: "siamês", label: "Siamês" },
  { value: "maine coon", label: "Maine Coon" },
  { value: "sphynx", label: "Sphynx" },
  { value: "ragdoll", label: "Ragdoll" },
  { value: "bengal", label: "Bengal" },
  { value: "outro", label: "Outro" },
];

const otherBreeds = [
  { value: "não aplicável", label: "Não Aplicável" },
  { value: "outro", label: "Outro" },
];

const PatientForm = () => {
  const navigate = useNavigate();
  const { tutorId, patientId } = useParams();
  const isEditing = !!patientId;
  const fileInputRef = useRef(null);
  
  const [patient, setPatient] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    color: '',
    sex: '',
    microchip: '',
    observations: '',
    photo: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      const savedPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
      const currentPatient = savedPatients.find(p => p.id === parseInt(patientId));
      if (currentPatient) {
        setPatient(currentPatient);
      }
    }
  }, [isEditing, patientId]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setPatient({ ...patient, [id]: value });
    if (errors[id]) {
      setErrors({ ...errors, [id]: null });
    }
  };
  
  const handleSelectChange = (id, value) => {
    const updates = { [id]: value };
    if (id === 'species') {
      updates.breed = '';
    }
    setPatient(prev => ({ ...prev, ...updates }));
    if (errors[id]) {
      setErrors({ ...errors, [id]: null });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPatient(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPatient(prev => ({ ...prev, photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getBreedOptions = () => {
    switch (patient.species.toLowerCase()) {
      case 'canino':
        return dogBreeds;
      case 'felino':
        return catBreeds;
      default:
        return otherBreeds;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const result = patientSchema.safeParse(patient);
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
    const savedPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
    
    if (isEditing) {
      const updatedPatients = savedPatients.map(p => 
        p.id === parseInt(patientId) ? { ...result.data, id: parseInt(patientId), tutorId: p.tutorId, lastVisit: p.lastVisit } : p
      );
      localStorage.setItem('rdv_patients', JSON.stringify(updatedPatients));
      toast({
        title: "Paciente atualizado!",
        description: `${result.data.name} foi atualizado com sucesso.`,
      });
    } else {
      const newPatient = {
        ...result.data,
        id: Date.now(),
        tutorId: parseInt(tutorId),
        lastVisit: new Date().toISOString().split('T')[0]
      };
      const updatedPatients = [...savedPatients, newPatient];
      localStorage.setItem('rdv_patients', JSON.stringify(updatedPatients));
      
      const savedTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
      const updatedTutors = savedTutors.map(t => 
        t.id === parseInt(tutorId) ? { ...t, patients: (t.patients || 0) + 1 } : t
      );
      localStorage.setItem('rdv_tutors', JSON.stringify(updatedTutors));
      
      toast({
        title: "Paciente cadastrado!",
        description: `${result.data.name} foi adicionado com sucesso.`,
      });
    }

    navigate(`/patients/${tutorId || patient.tutorId}`);
  };

  const handleGoBack = () => {
    if (isEditing) {
      const savedPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
      const currentPatient = savedPatients.find(p => p.id === parseInt(patientId));
      navigate(`/patients/${currentPatient?.tutorId}`);
    } else {
      navigate(`/patients/${tutorId}`);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 mb-8"
        >
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="bg-transparent border-border text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize os dados do paciente' : 'Cadastre um novo paciente'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <PawPrint className="w-6 h-6" />
                <span>Dados do Paciente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center mb-6 space-y-4">
                  <div className="relative group">
                    <div 
                      className="w-32 h-32 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {patient.photo ? (
                        <img src={patient.photo} alt="Foto do Paciente" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-xs">Adicionar Foto</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                    />
                    {patient.photo && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-8 w-8 rounded-full shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Clique para adicionar uma foto do paciente</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Nome *</Label>
                    <Input id="name" value={patient.name} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" placeholder="Nome do animal" />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="species" className="text-foreground">Espécie *</Label>
                    <Select onValueChange={(value) => handleSelectChange('species', value)} value={patient.species}>
                        <SelectTrigger className="w-full bg-input border-border text-foreground">
                            <SelectValue placeholder="Selecione a espécie" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            <SelectItem value="CANINO">CANINO</SelectItem>
                            <SelectItem value="FELINO">FELINO</SelectItem>
                            <SelectItem value="BOVINO">BOVINO</SelectItem>
                            <SelectItem value="EQUINO">EQUINO</SelectItem>
                            <SelectItem value="REPTEIS">REPTEIS</SelectItem>
                            <SelectItem value="AVES">AVES</SelectItem>
                            <SelectItem value="OUTRO">OUTRO</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.species && <p className="text-destructive text-xs mt-1">{errors.species}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breed" className="text-foreground">Raça *</Label>
                     <Combobox
                        options={getBreedOptions()}
                        value={patient.breed}
                        onChange={(value) => handleSelectChange('breed', value)}
                        placeholder="Selecione ou digite a raça"
                        disabled={!patient.species}
                    />
                    {errors.breed && <p className="text-destructive text-xs mt-1">{errors.breed}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sex" className="text-foreground">Sexo *</Label>
                     <Select onValueChange={(value) => handleSelectChange('sex', value)} value={patient.sex}>
                        <SelectTrigger className="w-full bg-input border-border text-foreground">
                            <SelectValue placeholder="Selecione o sexo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Macho">Macho</SelectItem>
                            <SelectItem value="Fêmea">Fêmea</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.sex && <p className="text-destructive text-xs mt-1">{errors.sex}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-foreground">Idade</Label>
                    <Input id="age" value={patient.age} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" placeholder="Ex: 2 anos, 6 meses" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-foreground">Peso</Label>
                    <Input id="weight" value={patient.weight} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" placeholder="Ex: 5kg, 2.5kg" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-foreground">Cor/Pelagem</Label>
                    <Input id="color" value={patient.color} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" placeholder="Cor do animal" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="microchip" className="text-foreground">Microchip</Label>
                    <Input id="microchip" value={patient.microchip} onChange={handleInputChange} className="bg-input border-border text-foreground placeholder:text-muted-foreground" placeholder="Número do microchip" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations" className="text-foreground">Observações</Label>
                  <textarea id="observations" value={patient.observations} onChange={handleInputChange} className="w-full min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Observações adicionais sobre o paciente" />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" onClick={handleGoBack} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">Cancelar</Button>
                  <Button type="submit" className="bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientForm;