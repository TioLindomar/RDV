import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Share2, Download, Printer, Save, CheckCircle2, Loader2, FileSignature, Shield } from 'lucide-react';
import QRCode from 'qrcode';
import { pdf } from '@react-pdf/renderer'; // Importante para gerar o PDF em memória
import PrescriptionDocument from '@/pdf/PrescriptionDocument'; // Seu layout bonito
import { prescriptionService } from '@/services/prescriptionService';
import { supabase } from '@/lib/customSupabaseClient';

const PrescriptionPreview = () => {
  const navigate = useNavigate();
  const { prescriptionId } = useParams();
  const location = useLocation();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false); // Loading do botão whatsapp
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // --- 1. Carregamento de Dados ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (prescriptionId === 'draft' && location.state?.isDraft) {
            setData(location.state);
            const qrUrl = await QRCode.toDataURL("PREVIEW-MODE", { width: 100, margin: 1, color: { dark: '#999', light: '#0000' } });
            setQrCodeUrl(qrUrl);
        } else {
            const result = await prescriptionService.getById(prescriptionId);
            const { data: tutorData } = await supabase.from('tutors').select('*').eq('id', result.patient.tutor_id).single();
            setData({ ...result, tutor: tutorData });

            const publicUrl = `${window.location.origin}/view-prescription/${result.unique_code}`;
            const qrUrl = await QRCode.toDataURL(publicUrl, { width: 100, margin: 1, color: { dark: '#4A90E2', light: '#0000' } });
            setQrCodeUrl(qrUrl);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar." });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [prescriptionId, location.state, navigate]);

  // --- 2. Salvar no Banco ---
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
        const payload = {
            veterinarianId: data.veterinarianId,
            patientId: data.patientId,
            medications: data.medications,
            purpose: data.purpose,
            attestationText: data.attestationText,
            type: data.type
        };
        const savedPrescription = await prescriptionService.create(payload);
        toast({ title: "Salvo!", description: "Prescrição registrada com sucesso." });
        navigate(`/prescription/preview/${savedPrescription.id}`, { replace: true });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  // --- 3. Baixar PDF ---
  const handleDownload = async () => {
    if (prescriptionId === 'draft') return toast({ title: "Salve antes", variant: "warning" });
    toast({ title: "Gerando PDF..." });

    try {
      const blob = await pdf(<PrescriptionDocument data={data} qrCodeUrl={qrCodeUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receita-${data.patient.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) { console.error(error); }
  };

  // --- 4. ENVIAR POR WHATSAPP (NOVA FUNÇÃO) ---
  const handleWhatsApp = async () => {
    if (prescriptionId === 'draft') {
        toast({ title: "Atenção", description: "Salve a receita no sistema antes de enviar.", variant: "warning" });
        return;
    }

    setIsSharing(true);

    try {
        // A. Tenta gerar o PDF para mobile (mantém essa parte que é boa)
        const blob = await pdf(<PrescriptionDocument data={data} qrCodeUrl={qrCodeUrl} />).toBlob();
        const file = new File([blob], `Receita-${data.patient.name}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Receita Veterinária Digital',
                    text: `Olá! Segue a receita do(a) ${data.patient.name}. 🐾`
                });
                setIsSharing(false);
                return; 
            } catch (err) {
                if (err.name === 'AbortError') {
                    setIsSharing(false);
                    return;
                }
            }
        }

        // B. Fallback: WhatsApp Web (Desktop)
        const link = `${window.location.origin}/view-prescription/${data.unique_code}`;
        const message = `Olá! \n\nAqui está a receita digital do(a) *${data.patient.name}*.\n\n*Acesse o documento original aqui:* ${link}\n\nAssinado digitalmente por Dr(a). ${data.veterinarian.name}.`;
        
        // 1. Limpa o telefone (remove tudo que não é número)
        let phone = data.tutor?.phone?.replace(/\D/g, '') || '';
        
        let whatsappUrl = '';

        if (phone.length > 0) {
            // Se tem número, tenta formatar para o padrão internacional
            // Se tiver entre 10 e 11 dígitos (ex: 11999999999), assume que é Brasil e adiciona 55
            if (phone.length >= 10 && phone.length <= 11) {
                phone = `55${phone}`;
            }
            whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        } else {
            // Se NÃO tem telefone cadastrado no tutor, abre o zap pra escolher o contato
            whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        }
        
        window.open(whatsappUrl, '_blank');

    } catch (error) {
        console.error("Erro share:", error);
        toast({ title: "Erro", description: "Não foi possível compartilhar.", variant: "destructive" });
    } finally {
        setIsSharing(false);
    }
  };

  if (loading || !data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const isDraft = prescriptionId === 'draft';

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        
        {/* Barra de Topo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 no-print">
          <div className="flex items-center space-x-4">
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> {isDraft ? 'Voltar e Editar' : 'Voltar'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                {isDraft ? 'Pré-visualização' : 'Receita Final'}
                {isDraft && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-300">Rascunho</span>}
              </h1>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {!isDraft && (
                <>
                    {/* BOTÃO WHATSAPP */}
                    <Button onClick={handleWhatsApp} disabled={isSharing} className="bg-green-600 hover:bg-green-700 text-white">
                        {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                        WhatsApp
                    </Button>
                    
                    <Button onClick={handleDownload} variant="outline"><Download className="w-4 h-4 mr-2" /> PDF</Button>
                    <Button onClick={() => window.print()} variant="outline"><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>
                </>
            )}
            
            {isDraft && (
                <Button onClick={handleSaveToDatabase} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg animate-pulse">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Confirmar e Salvar
                </Button>
            )}
          </div>
        </motion.div>

        {/* VISUALIZAÇÃO DO DOCUMENTO (HTML para Tela) */}
        {/* Usamos o HTML apenas para o usuário VER na tela. Para baixar/enviar, usamos o PrescriptionDocument do react-pdf */}
        <div className={`bg-white text-gray-900 p-8 md:p-12 rounded-lg shadow-xl max-w-[210mm] mx-auto min-h-[297mm] flex flex-col relative ${isDraft ? 'opacity-90' : ''}`}>
            
            {isDraft && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
                    <h1 className="text-9xl font-bold -rotate-45 text-gray-400">RASCUNHO</h1>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase">Dr(a). {data.veterinarian.name}</h1>
                    <p className="text-sm font-semibold text-gray-600">{data.veterinarian.clinic_name}</p>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <p>CRMV: {data.veterinarian.crmv}</p>
                        <p>Tel: {data.veterinarian.phone}</p>
                        {data.veterinarian.address && <p>{data.veterinarian.address}, {data.veterinarian.number} - {data.veterinarian.city}/{data.veterinarian.state}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-gray-400 text-xs">EMISSÃO</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(data.created_at || new Date()).toLocaleDateString()}</p>
                    <p className="font-mono text-xs mt-1 text-gray-300">{isDraft ? '---' : data.unique_code?.slice(0, 8)}</p>
                </div>
            </div>

            {/* Dados Paciente */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-8 grid grid-cols-2 gap-4 text-sm z-10">
                <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase">Paciente</span>
                    <span className="font-bold text-lg">{data.patient.name}</span>
                    <p className="text-gray-600">{data.patient.species} • {data.patient.breed}</p>
                </div>
                <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase">Tutor</span>
                    <span className="font-bold text-lg">{data.tutor.name}</span>
                    <p className="text-gray-600">CPF: {data.tutor.cpf || 'Não informado'}</p>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-grow z-10">
                <h2 className="text-xl font-bold text-center border-b border-gray-200 pb-2 mb-6 uppercase tracking-wider">
                    {data.type === 'attestation' ? 'Atestado Médico Veterinário' : 'Receituário'}
                </h2>

                {data.type === 'attestation' ? (
                    <div className="text-justify text-gray-800 leading-relaxed whitespace-pre-wrap p-4 text-lg">
                        {data.attestationText || data.document_body}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.medications?.map((med, index) => (
                            <div key={index} className="pl-4 border-l-4 border-gray-800">
                                <h3 className="font-bold text-lg">{index + 1}. {med.name}</h3>
                                <p className="text-sm text-gray-600 mb-1">{med.dosage}</p>
                                <p className="text-gray-800 italic mt-1">
                                    {med.frequency} {med.duration && `• ${med.duration}`}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                
                {data.purpose && (
                    <div className="mt-8 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500"><strong>Indicação:</strong> {data.purpose}</p>
                    </div>
                )}
            </div>

            {/* Rodapé */}
            <div className="mt-12 pt-8 border-t border-gray-300 text-center relative z-10">
                <div className="h-16"></div> 
                <p className="font-bold text-gray-900">Dr(a). {data.veterinarian.name}</p>
                <p className="text-sm text-gray-600">{data.veterinarian.crmv}</p>
                
                <div className="mt-6 flex justify-between items-end">
                    {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className={`w-20 h-20 ${isDraft ? 'opacity-20' : ''}`} />}
                    <div className="text-right text-[10px] text-gray-400 max-w-[200px]">
                        <p>Documento emitido digitalmente via RDV System.</p>
                        {!isDraft && <p>A autenticidade deste documento pode ser verificada lendo o QR Code ao lado.</p>}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPreview;