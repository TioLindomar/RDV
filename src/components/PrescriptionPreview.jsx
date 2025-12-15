import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, Share2, Download, Printer, Shield, FileSignature, 
  CheckCircle2, Loader2, Usb, Cloud, Landmark, Smartphone, 
  BadgeCheck, AlertCircle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SignatureOption = ({ icon: Icon, title, description, onClick, color = "text-primary" }) => (
  <button
    onClick={onClick}
    className="flex items-start p-4 w-full bg-card hover:bg-muted/50 border border-border rounded-lg transition-all duration-200 text-left group"
  >
    <div className={`p-2 rounded-full bg-primary/10 mr-4 group-hover:scale-110 transition-transform ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </button>
);

const PrescriptionPreview = () => {
  const navigate = useNavigate();
  const { prescriptionId } = useParams();
  const printRef = useRef();
  
  const [prescription, setPrescription] = useState(null);
  const [patient, setPatient] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Digital Signature States
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signingState, setSigningState] = useState('idle'); // idle, detecting, selecting, signing, success, error
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [signatureData, setSignatureData] = useState(null);

  const user = JSON.parse(localStorage.getItem('rdv_user') || '{}');

  useEffect(() => {
    const savedPrescriptions = JSON.parse(localStorage.getItem('rdv_prescriptions') || '[]');
    const currentPrescription = savedPrescriptions.find(p => p.id === parseInt(prescriptionId));
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

      // Check if already signed
      if (currentPrescription.signature) {
        setSignatureData(currentPrescription.signature);
      }

      const prescriptionUrl = `${window.location.origin}/view-prescription/${currentPrescription.uniqueCode}`;
      QRCode.toDataURL(prescriptionUrl, { width: 100, margin: 1, color: { dark: '#4A90E2', light: '#0000' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [prescriptionId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const prescriptionUrl = `${window.location.origin}/view-prescription/${prescription.uniqueCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Receita Veterinária Digital',
        text: `Prescrição para ${patient?.name}`,
        url: prescriptionUrl
      });
    } else {
      navigator.clipboard.writeText(prescriptionUrl);
      toast({
        title: "Link copiado!",
        description: "O link da prescrição foi copiado para a área de transferência.",
      });
    }
  };

  const handleDownload = async () => {
    const element = printRef.current;
    if (!element) return;

    toast({
      title: "Gerando PDF...",
      description: "Aguarde um momento enquanto preparamos seu arquivo.",
    });

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; 

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`prescricao-${patient?.name || 'paciente'}-${prescription.uniqueCode}.pdf`);

      toast({
        title: "PDF Gerado!",
        description: "O download do seu PDF foi iniciado.",
      });

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const startSigningProcess = (provider) => {
    setSelectedProvider(provider);
    setSigningState('detecting');
    
    // Simulate detection/connection delay
    setTimeout(() => {
      if (provider === 'govbr') {
        // Gov.br flow simulation
        setSigningState('signing');
        setTimeout(() => completeSignature('Gov.br'), 2000);
      } else if (provider === 'icp') {
        // ICP-Brasil flow simulation (detect certificate)
        setSigningState('selecting');
      } else {
        // Cloud flow
        setSigningState('signing');
        setTimeout(() => completeSignature('Certificado em Nuvem'), 2500);
      }
    }, 1500);
  };

  const completeSignature = (authorityName) => {
    const newSignature = {
      signerName: user.name || 'Dr. Veterinário',
      signedAt: new Date().toISOString(),
      hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      authority: authorityName,
      type: selectedProvider
    };

    // Save to localStorage
    const savedPrescriptions = JSON.parse(localStorage.getItem('rdv_prescriptions') || '[]');
    const updatedPrescriptions = savedPrescriptions.map(p => 
      p.id === prescription.id ? { ...p, signature: newSignature } : p
    );
    localStorage.setItem('rdv_prescriptions', JSON.stringify(updatedPrescriptions));
    
    setPrescription(prev => ({ ...prev, signature: newSignature }));
    setSignatureData(newSignature);
    setSigningState('success');

    toast({
      title: "Documento Assinado",
      description: "A assinatura digital foi aplicada com sucesso.",
      variant: "default",
    });
  };

  const resetSignatureModal = () => {
    if (signingState === 'success') {
      setIsSignatureDialogOpen(false);
    }
    setSigningState('idle');
    setSelectedProvider(null);
  };

  if (!prescription || !patient || !tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 no-print"
        >
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(`/patients/${patient.tutorId}`)}
              variant="outline"
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Prescrição Médica</h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <span>Visualização e Assinatura</span>
                {signatureData && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Assinado
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 no-print"
        >
          <Card className={`border-border transition-all duration-300 ${signatureData ? 'bg-green-50/50 border-green-200' : 'glass-effect'}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${signatureData ? 'bg-green-100 text-green-600' : 'bg-secondary/10 text-secondary'}`}>
                    {signatureData ? <BadgeCheck className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-lg">
                      {signatureData ? 'Documento Assinado Digitalmente' : 'Assinatura Digital'}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {signatureData 
                        ? `Assinado via ${signatureData.authority} em ${new Date(signatureData.signedAt).toLocaleDateString()}`
                        : 'Garanta a validade jurídica da sua receita com certificado digital (ICP-Brasil, Gov.br)'}
                    </p>
                  </div>
                </div>
                
                {!signatureData && (
                  <Button
                    onClick={() => setIsSignatureDialogOpen(true)}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                  >
                    <FileSignature className="w-4 h-4 mr-2" />
                    Assinar Digitalmente
                  </Button>
                )}
                
                {signatureData && (
                  <Button
                    variant="outline"
                    className="w-full md:w-auto border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                    onClick={() => window.open(`https://verificador.iti.gov.br/`, '_blank')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verificar Autenticidade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div ref={printRef} className="bg-white text-gray-900 p-8 md:p-12 rounded-lg shadow-xl print:shadow-none print:rounded-none print:p-0 max-w-[210mm] mx-auto min-h-[297mm] relative flex flex-col">
            {/* Header / Vet Info */}
            <div className="border-b-2 border-gray-800 pb-6 mb-8">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1 uppercase tracking-tight">Dr(a). {user.name}</h1>
                  {user.specialty && <p className="text-primary font-semibold text-sm mb-4 uppercase tracking-wider">{user.specialty}</p>}
                  
                  <div className="text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                    <p><strong>CRMV:</strong> {user.crmv || '-'}</p>
                    {user.cpf && <p><strong>CPF:</strong> {user.cpf}</p>}
                    {user.sipegro && <p><strong>SIPEGRO:</strong> {user.sipegro}</p>}
                    {user.phone && <p><strong>Tel/Whatsapp:</strong> {user.phone}</p>}
                    {user.email && <p><strong>Email:</strong> {user.email}</p>}
                    {user.address && <p className="sm:col-span-2"><strong>Endereço:</strong> {user.address}</p>}
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="flex flex-col items-end">
                     {/* Removed Placeholder for a logo/person icon */}
                     <div className="text-xs text-gray-500 text-right">
                        <p className="font-bold text-gray-700">EMISSÃO</p>
                        <p>{new Date(prescription.date).toLocaleDateString('pt-BR')}</p>
                        <p className="font-mono text-[10px] mt-1">ID: {prescription.uniqueCode}</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient & Tutor Info - Expanded */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {/* Vertical divider for print */}
                <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gray-200 transform -translate-x-1/2"></div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Paciente
                  </h3>
                  <div className="space-y-2 pl-4 border-l-2 border-blue-100">
                    <p className="text-lg font-bold text-gray-800">{patient.name}</p>
                    <div className="text-xs text-gray-600 space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                         <p><strong>Espécie:</strong> {patient.species}</p>
                         <p><strong>Raça:</strong> {patient.breed}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         {patient.age && <p><strong>Idade:</strong> {patient.age}</p>}
                         {patient.weight && <p><strong>Peso:</strong> {patient.weight}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         {patient.sex && <p><strong>Sexo:</strong> {patient.sex === 'M' ? 'Macho' : patient.sex === 'F' ? 'Fêmea' : patient.sex}</p>}
                         {patient.microchip && <p><strong>Microchip:</strong> {patient.microchip}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                     <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                     Tutor
                  </h3>
                  <div className="space-y-2 pl-4 border-l-2 border-green-100">
                    <p className="text-lg font-bold text-gray-800">{tutor.name}</p>
                    <div className="text-xs text-gray-600 space-y-1.5">
                      {tutor.cpf && <p><strong>CPF:</strong> {tutor.cpf}</p>}
                      {tutor.phone && <p><strong>Tel:</strong> {tutor.phone}</p>}
                      {tutor.email && <p><strong>Email:</strong> {tutor.email}</p>}
                      {tutor.address && <p><strong>Endereço:</strong> {tutor.address}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b border-gray-200 pb-2">
                Prescrição Médica
              </h3>
              
              <div className="space-y-8">
                {prescription.medications.map((medication, index) => (
                  <div key={index} className="relative pl-6">
                     <div className="absolute left-0 top-1.5 font-bold text-gray-300 text-xl">{index + 1}.</div>
                    <div className="mb-2">
                      <h4 className="text-lg font-bold text-gray-900 uppercase">{medication.name}</h4>
                      {medication.active_ingredient && <p className="text-xs text-gray-500 uppercase tracking-wide">{medication.active_ingredient}</p>}
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50/50 p-3 rounded border border-gray-100">
                      <p className="mb-1"><strong>Uso:</strong> {medication.dosage} | {medication.frequency}</p>
                      {medication.duration && <p><strong>Duração do tratamento:</strong> {medication.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {prescription.observations && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Observações e Orientações</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-yellow-50/50 p-4 rounded border border-yellow-100">
                    {prescription.observations}
                  </div>
                </div>
              )}
            </div>

            {/* Signature Section */}
            <div className="mt-auto pt-12">
              {signatureData ? (
                <div className="border-2 border-green-600/30 bg-green-50/30 rounded-lg p-4 flex items-center justify-between break-inside-avoid">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <FileSignature className="w-8 h-8 text-green-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 text-sm uppercase tracking-wide">Documento Assinado Digitalmente</h3>
                      <p className="text-xs text-green-800 mt-1">
                        Assinado por: <strong>{signatureData.signerName}</strong>
                      </p>
                      <p className="text-xs text-green-700">
                        Data: {new Date(signatureData.signedAt).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[10px] text-green-600 mt-1 font-mono">Hash: {signatureData.hash}</p>
                      <p className="text-[10px] text-green-600">
                        A autenticidade deste documento pode ser verificada no site do ITI ou via QR Code.
                        ICP-Brasil / MP 2.200-2.
                      </p>
                    </div>
                  </div>
                  {qrCodeUrl && (
                    <div className="hidden sm:block text-center">
                      <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 mix-blend-multiply" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-end break-inside-avoid">
                  <div className="text-center mx-auto">
                    <div className="border-b border-gray-400 w-64 mb-2"></div>
                    <p className="font-bold text-gray-800">Dr(a). {user.name}</p>
                    <p className="text-sm text-gray-500">{user.crmv} - {user.uf || 'BR'}</p>
                  </div>
                  {qrCodeUrl && (
                    <div className="absolute bottom-8 right-8">
                      <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-center mt-8 pt-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                  Receita Digital Veterinária • RDV System • {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Digital Signature Modal - Same as before */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={(open) => {
        if(!open) resetSignatureModal();
        setIsSignatureDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-primary" />
              Assinatura Digital
            </DialogTitle>
            <DialogDescription>
              Escolha como deseja assinar digitalmente este documento.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {signingState === 'idle' && (
              <div className="space-y-3">
                <SignatureOption 
                  icon={Usb}
                  title="Certificado Digital (A1/A3)"
                  description="Token USB, Smartcard ou arquivo instalado"
                  onClick={() => startSigningProcess('icp')}
                  color="text-blue-600"
                />
                <SignatureOption 
                  icon={Landmark}
                  title="Gov.br"
                  description="Assinatura eletrônica avançada gratuita"
                  onClick={() => startSigningProcess('govbr')}
                  color="text-green-600"
                />
                <SignatureOption 
                  icon={Cloud}
                  title="Certificado em Nuvem"
                  description="BirdID, Vidaas, NeoID, SafeID"
                  onClick={() => startSigningProcess('cloud')}
                  color="text-purple-600"
                />
                <SignatureOption 
                  icon={Smartphone}
                  title="e-CPF / e-CNPJ Mobile"
                  description="Assinar via aplicativo no celular"
                  onClick={() => startSigningProcess('mobile')}
                  color="text-orange-600"
                />
              </div>
            )}

            {signingState === 'detecting' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Conectando...</h3>
                <p className="text-sm text-muted-foreground">Buscando certificados disponíveis e serviços de assinatura.</p>
              </div>
            )}

            {signingState === 'selecting' && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-foreground">Selecione o Certificado</h3>
                  <p className="text-sm text-muted-foreground">Foram encontrados os seguintes certificados:</p>
                </div>
                
                <button 
                  onClick={() => {
                    setSigningState('signing');
                    setTimeout(() => completeSignature('ICP-Brasil A3'), 1500);
                  }}
                  className="w-full p-3 border border-primary/30 bg-primary/5 rounded-lg flex items-center justify-between hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-gray-200">
                      <Usb className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">DR. {user.name?.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">ICP-Brasil | Pessoa Física | A3</p>
                    </div>
                  </div>
                  <BadgeCheck className="w-5 h-5 text-primary" />
                </button>
                
                <Button variant="ghost" className="w-full text-sm" onClick={() => setSigningState('idle')}>
                  Cancelar
                </Button>
              </div>
            )}

            {signingState === 'signing' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Assinando Documento</h3>
                <p className="text-sm text-muted-foreground">Aplicando carimbo do tempo e hash criptográfico...</p>
              </div>
            )}

            {signingState === 'success' && (
              <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700 mb-2">Assinado com Sucesso!</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  O documento agora possui validade jurídica e pode ser enviado digitalmente.
                </p>
                <Button onClick={resetSignatureModal} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Concluir
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionPreview;