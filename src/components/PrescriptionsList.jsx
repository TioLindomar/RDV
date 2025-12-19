import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Search, FileText, Filter, ArrowLeft, Calendar, 
  CheckCircle2, Clock, Eye, Download
} from 'lucide-react';
import { prescriptionService } from '@/services/prescriptionService';
import { Loader2 } from 'lucide-react';

const PrescriptionsList = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, prescription, attestation
  const [filterSpecies, setFilterSpecies] = useState('all'); // all, Canina, Felina

  useEffect(() => {
    loadDocuments();
  }, []);

  // Recarrega lista quando filtros mudam
  useEffect(() => {
    filterResults();
  }, [searchTerm, filterType, filterSpecies, documents]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await prescriptionService.getAll();
      setDocuments(data || []);
      setFilteredDocuments(data || []);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar histórico." });
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let results = [...documents];

    // 1. Filtro de Texto (Nome Paciente, Tutor ou Código)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      results = results.filter(doc => 
        doc.patient?.name?.toLowerCase().includes(lowerTerm) ||
        doc.patient?.tutor?.name?.toLowerCase().includes(lowerTerm) ||
        doc.unique_code?.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Filtro de Tipo de Documento
    if (filterType !== 'all') {
      results = results.filter(doc => doc.type === filterType);
    }

    // 3. Filtro de Espécie
    if (filterSpecies !== 'all') {
      results = results.filter(doc => doc.patient?.species === filterSpecies);
    }

    setFilteredDocuments(results);
  };

  // Ícone helper
  const getStatusIcon = (status) => {
    if (status === 'signed') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Histórico de Documentos</h1>
              <p className="text-muted-foreground">Consulte todas as receitas e atestados emitidos.</p>
            </div>
          </div>
        </motion.div>

        {/* Barra de Filtros */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-6 bg-card/50 p-4 rounded-lg border border-border">
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Paciente, Tutor ou Código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>

          <div className="w-full md:w-48">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-input border-border">
                <div className="flex items-center"><Filter className="w-4 h-4 mr-2 text-muted-foreground"/> <SelectValue placeholder="Tipo" /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="prescription">Receitas</SelectItem>
                <SelectItem value="attestation">Atestados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Espécie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Espécies</SelectItem>
                <SelectItem value="Canina">Canina</SelectItem>
                <SelectItem value="Felina">Felina</SelectItem>
                <SelectItem value="Outro">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </motion.div>

        {/* Lista de Resultados */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Nenhum documento encontrado com esses filtros.</div>
            ) : (
                filteredDocuments.map((doc, index) => (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="glass-effect border-border hover:bg-muted/30 transition-colors">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        
                        {/* Coluna 1: Ícone e Info Básica */}
                        <div className="flex items-center gap-4 flex-1 w-full">
                            <div className={`p-3 rounded-full ${doc.type === 'attestation' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">
                                    {doc.type === 'attestation' ? 'Atestado' : 'Receita Médica'}
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">#{doc.unique_code?.slice(0,6).toUpperCase()}</span>
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> {new Date(doc.created_at).toLocaleDateString('pt-BR')} às {new Date(doc.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>

                        {/* Coluna 2: Detalhes do Paciente */}
                        <div className="flex-1 w-full md:text-center md:border-l md:border-r border-border/50 px-4">
                            <p className="text-sm font-semibold text-foreground">{doc.patient?.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.patient?.species} • Tutor: {doc.patient?.tutor?.name}</p>
                        </div>

                        {/* Coluna 3: Status e Ações */}
                        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-1 text-sm">
                                {getStatusIcon(doc.status)}
                                <span className={doc.status === 'signed' ? 'text-green-600' : 'text-yellow-600'}>
                                    {doc.status === 'signed' ? 'Assinado' : 'Rascunho'}
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/prescription/preview/${doc.id}`)}>
                                    <Eye className="w-4 h-4 mr-2" /> Visualizar
                                </Button>
                            </div>
                        </div>

                    </CardContent>
                    </Card>
                </motion.div>
                ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PrescriptionsList;