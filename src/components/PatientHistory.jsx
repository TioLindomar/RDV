import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; // We'll simulate a badge with standard HTML/Tailwind if not available
import { 
  ArrowLeft, Search, Filter, Download, Eye, Calendar, 
  FileText, CheckCircle2, Clock, AlertCircle, FileSignature
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Assuming standard jspdf usage, though autotable might not be installed. I'll use basic text.

const PatientHistory = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  
  const [patient, setPatient] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Load Data
    const savedPatients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
    const currentPatient = savedPatients.find(p => p.id === parseInt(patientId));
    setPatient(currentPatient);

    if (currentPatient) {
      const savedTutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
      const currentTutor = savedTutors.find(t => t.id === currentPatient.tutorId);
      setTutor(currentTutor);

      const savedPrescriptions = JSON.parse(localStorage.getItem('rdv_prescriptions') || '[]');
      // Filter prescriptions for this patient and sort by date descending
      const patientPrescriptions = savedPrescriptions
        .filter(p => p.patientId === parseInt(patientId))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setPrescriptions(patientPrescriptions);
      setFilteredPrescriptions(patientPrescriptions);
    }
  }, [patientId]);

  useEffect(() => {
    let result = prescriptions;

    // Text Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.uniqueCode.toLowerCase().includes(term) ||
        p.medications.some(m => m.name.toLowerCase().includes(term)) ||
        (p.observations && p.observations.toLowerCase().includes(term))
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'signed') {
        result = result.filter(p => p.signature);
      } else if (statusFilter === 'unsigned') {
        result = result.filter(p => !p.signature);
      }
    }

    // Date Filter
    if (dateFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Adjust end date to end of day
      end.setHours(23, 59, 59, 999);
      
      result = result.filter(p => {
        const pDate = new Date(p.date);
        return pDate >= start && pDate <= end;
      });
    } else if (dateFilter === 'last30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(p => new Date(p.date) >= thirtyDaysAgo);
    } else if (dateFilter === 'last90') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      result = result.filter(p => new Date(p.date) >= ninetyDaysAgo);
    }

    setFilteredPrescriptions(result);
  }, [searchTerm, statusFilter, dateFilter, startDate, endDate, prescriptions]);

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(`Histórico Médico: ${patient?.name}`, 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Tutor: ${tutor?.name}`, 14, 28);
    doc.text(`Espécie: ${patient?.species} | Raça: ${patient?.breed}`, 14, 33);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 38);
    
    doc.line(14, 42, 196, 42);

    let yPos = 50;

    filteredPrescriptions.forEach((p, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Data: ${new Date(p.date).toLocaleDateString()} - ID: ${p.uniqueCode}`, 14, yPos);
      if (p.signature) {
        doc.setTextColor(0, 128, 0);
        doc.text(`(Assinado Digitalmente)`, 120, yPos);
        doc.setTextColor(0, 0, 0);
      }
      
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      p.medications.forEach(med => {
        doc.text(`• ${med.name} - ${med.dosage} (${med.frequency})`, 20, yPos);
        yPos += 5;
      });

      if (p.observations) {
         doc.text(`Obs: ${p.observations.substring(0, 80)}${p.observations.length > 80 ? '...' : ''}`, 20, yPos);
         yPos += 5;
      }

      yPos += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;
    });

    doc.save(`Historico-${patient?.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!patient) return <div className="p-8">Carregando...</div>;

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Prontuário Digital</h1>
              <p className="text-muted-foreground">Histórico de Prescrições: {patient.name} ({tutor?.name})</p>
            </div>
          </div>
          
          <Button onClick={handleDownloadReport} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Baixar Relatório PDF
          </Button>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="glass-effect border-border">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar medicamentos ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="signed">Assinadas</SelectItem>
                    <SelectItem value="unsigned">Não Assinadas</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range Presets */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="bg-input border-border">
                     <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo o Período</SelectItem>
                    <SelectItem value="last30">Últimos 30 dias</SelectItem>
                    <SelectItem value="last90">Últimos 90 dias</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>

                 {/* Custom Date Range (Visible only if 'custom' selected) */}
                 {dateFilter === 'custom' && (
                   <div className="flex gap-2 items-center">
                      <Input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-input border-border text-xs" 
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-input border-border text-xs" 
                      />
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline/List */}
        <div className="space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 bg-card/50 rounded-lg border border-border border-dashed">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            filteredPrescriptions.map((prescription, index) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow border-border overflow-hidden">
                  <div className={`h-1 w-full ${prescription.signature ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      
                      {/* Left Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                            #{prescription.uniqueCode}
                          </span>
                          <span className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(prescription.date).toLocaleDateString('pt-BR')}
                          </span>
                          {prescription.signature ? (
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Assinado
                            </span>
                          ) : (
                             <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 mr-1" />
                              Emitido
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg mb-2">Medicamentos</h3>
                        <ul className="space-y-1 mb-4">
                          {prescription.medications.map((med, idx) => (
                            <li key={idx} className="text-sm text-foreground flex items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                              <span className="font-medium">{med.name}</span>
                              <span className="text-muted-foreground mx-1">-</span>
                              <span>{med.dosage}</span>
                              <span className="text-muted-foreground mx-1">({med.frequency})</span>
                            </li>
                          ))}
                        </ul>
                        
                        {prescription.observations && (
                           <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                             "{prescription.observations.length > 100 ? prescription.observations.substring(0, 100) + '...' : prescription.observations}"
                           </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2 w-full md:w-auto">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/prescription/preview/${prescription.id}`)}
                          className="flex-1 md:w-40 justify-center border-primary/20 hover:bg-primary/5 text-primary"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        
                        {prescription.signature && (
                          <Button 
                             variant="ghost" 
                             className="flex-1 md:w-40 justify-center text-green-600 hover:text-green-700 hover:bg-green-50"
                             onClick={() => window.open(`${window.location.origin}/view-prescription/${prescription.uniqueCode}`, '_blank')}
                          >
                            <FileSignature className="w-4 h-4 mr-2" />
                            Link Público
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistory;