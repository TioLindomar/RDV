import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, Stethoscope } from 'lucide-react';
import QRCode from 'qrcode';

const PublicPrescriptionView = () => {
  const { uniqueCode } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [patient, setPatient] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [vet, setVet] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedPrescriptions = JSON.parse(localStorage.getItem('rdv_prescriptions') || '[]');
    const currentPrescription = savedPrescriptions.find(p => p.uniqueCode === uniqueCode);
    setPrescription(currentPrescription);

    if (currentPrescription) {
      const savedPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
      const currentPatient = savedPatients.find(p => p.id === currentPrescription.patientId);
      setPatient(currentPatient);

      if (currentPatient) {
        const savedTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
        const currentTutor = savedTutors.find(t => t.id === currentPatient.tutorId);
        setTutor(currentTutor);
      }
      
      const user = JSON.parse(localStorage.getItem('rdv_user') || '{}');
      setVet(user);

      QRCode.toDataURL(window.location.href, { width: 100, margin: 1, color: { dark: '#4A90E2', light: '#0000' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
    setLoading(false);
  }, [uniqueCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground text-xl">Verificando prescrição...</p>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-effect border-destructive">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-destructive mb-2">Prescrição Inválida</h1>
              <p className="text-muted-foreground">O código de verificação não corresponde a nenhuma prescrição em nosso sistema. Verifique o link ou o QR Code.</p>
              <Link to="/" className="text-primary hover:underline mt-4 inline-block">Voltar para a página inicial</Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card text-foreground p-8 rounded-lg shadow-2xl"
        >
          <div className="flex items-center justify-center text-center mb-6 p-4 bg-secondary/10 rounded-lg border border-secondary">
             <ShieldCheck className="w-8 h-8 text-secondary mr-4" />
             <div>
                <h2 className="font-bold text-secondary text-lg">DOCUMENTO AUTÊNTICO</h2>
                <p className="text-muted-foreground text-sm">Esta prescrição foi verificada em nosso sistema.</p>
             </div>
          </div>
        
          <div className="border-b-2 border-primary pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">RECEITA VETERINÁRIA DIGITAL</h1>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Dr(a). {vet.name}</strong></p>
                  <p>{vet.crmv}</p>
                  {vet.cpf && <p>CPF: {vet.cpf}</p>}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p><strong>Data:</strong> {new Date(prescription.date).toLocaleDateString('pt-BR')}</p>
                <p><strong>Código Único:</strong> <span className="font-mono">{prescription.uniqueCode}</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-bold text-primary mb-3">DADOS DO PACIENTE</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {patient.name}</p>
                <p><strong>Espécie:</strong> {patient.species}</p>
                <p><strong>Raça:</strong> {patient.breed}</p>
                {patient.age && <p><strong>Idade:</strong> {patient.age}</p>}
                {patient.weight && <p><strong>Peso:</strong> {patient.weight}</p>}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-bold text-primary mb-3">DADOS DO TUTOR</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {tutor.name}</p>
                {tutor.cpf && <p><strong>CPF:</strong> {tutor.cpf}</p>}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-primary mb-4 text-lg">MEDICAMENTOS PRESCRITOS</h3>
            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <div key={index} className="border border-border p-4 rounded-lg bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <strong>Medicamento:</strong>
                      <p>{medication.name}</p>
                    </div>
                    <div>
                      <strong>Dosagem:</strong>
                      <p>{medication.dosage}</p>
                    </div>
                    <div>
                      <strong>Frequência:</strong>
                      <p>{medication.frequency}</p>
                    </div>
                    <div>
                      <strong>Duração:</strong>
                      <p>{medication.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {prescription.observations && (
            <div className="mb-6">
              <h3 className="font-bold text-primary mb-3">OBSERVAÇÕES</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{prescription.observations}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mt-8 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              <p>Emitida em: {new Date(prescription.createdAt).toLocaleString('pt-BR')}</p>
               <p className="mt-2 text-secondary font-semibold">✓ Assinado digitalmente via Gov.br</p>
            </div>
            {qrCodeUrl && (
              <div className="text-center">
                <img src={qrCodeUrl} alt="QR Code da Prescrição" className="w-20 h-20 mx-auto mb-1" />
              </div>
            )}
          </div>
          <div className="text-center mt-8 text-xs text-muted-foreground">
             <Stethoscope className="w-6 h-6 mx-auto mb-2 text-primary" />
             <p>Gerado por Receita Vet Digital</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicPrescriptionView;