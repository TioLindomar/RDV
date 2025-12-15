import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, PawPrint, FileText, Calendar, LogOut, CreditCard, User, LifeBuoy } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user: authUser } = useAuth(); // Pegamos o usuário autenticado do contexto
  
  const [profile, setProfile] = useState({});
  const [stats, setStats] = useState([
    { title: 'Tutores Cadastrados', value: 0, icon: Users, color: 'from-primary to-blue-500', target: '/tutors' },
    { title: 'Pacientes Ativos', value: 0, icon: PawPrint, color: 'from-secondary to-green-500', target: '/tutors' },
    { title: 'Prescrições Hoje', value: 0, icon: FileText, color: 'from-purple-500 to-purple-600', target: '/tutors' },
    { title: 'Consultas Agendadas', value: 0, icon: Calendar, color: 'from-accent to-orange-500', target: '/scheduler' },
  ]);

  useEffect(() => {
    // Função para carregar os dados reais do Supabase
    const loadDashboardData = async () => {
      if (!authUser?.id) return;

      try {
        // 1. Carregar Perfil do Veterinário (Nome, CRMV)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }

        // 2. Carregar Estatísticas (Counts)
        // Usamos { count: 'exact', head: true } para ser rápido e não baixar os dados, só contar.
        
        // Total Tutores
        const { count: tutorsCount } = await supabase
          .from('tutors')
          .select('*', { count: 'exact', head: true })
          .eq('veterinarian_id', authUser.id);

        // Total Pacientes
        const { count: patientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('veterinarian_id', authUser.id);

        // Prescrições de HOJE
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const { count: prescriptionsToday } = await supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .eq('veterinarian_id', authUser.id)
          .gte('created_at', `${todayStr}T00:00:00`)
          .lte('created_at', `${todayStr}T23:59:59`);

        // Agendamentos de HOJE
        const { count: appointmentsToday } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('veterinarian_id', authUser.id)
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`);

        // Atualiza o estado
        setStats([
          { title: 'Tutores Cadastrados', value: tutorsCount || 0, icon: Users, color: 'from-primary to-blue-500', target: '/tutors' },
          { title: 'Pacientes Ativos', value: patientsCount || 0, icon: PawPrint, color: 'from-secondary to-green-500', target: '/tutors' },
          { title: 'Prescrições Hoje', value: prescriptionsToday || 0, icon: FileText, color: 'from-purple-500 to-purple-600', target: '/tutors' },
          { title: 'Consultas Hoje', value: appointmentsToday || 0, icon: Calendar, color: 'from-accent to-orange-500', target: '/scheduler' },
        ]);

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      }
    };

    loadDashboardData();
  }, [authUser]);

  // Função de Logout Atualizada
  const handleLogout = async () => {
    await signOut(); // Desloga do Supabase
    navigate('/');   // Manda para o login
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <img src="https://horizons-cdn.hostinger.com/2cba84cd-67f6-4ccb-a719-f85b6f3bc4fa/c026dd484579f330e8e56c64a75211c9.png" alt="Logo RDV Receita Digital Veterinária" className="h-24 w-auto" />
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Painel</h1>
              <p className="text-muted-foreground">
                Bem-vindo, {profile.name || 'Doutor(a)'} {profile.crmv ? `- ${profile.crmv}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button onClick={() => navigate('/subscription')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
              <CreditCard className="w-4 h-4 mr-2" />
              Assinatura
            </Button>
            <Button onClick={handleLogout} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </motion.div>

        {/* Ações Rápidas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
          <Card className="glass-effect border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 1. Perfil Profissional */}
                <Button onClick={() => navigate('/profile')} className="h-20 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold">
                  <div className="flex flex-col items-center space-y-2">
                    <User className="w-6 h-6" />
                    <span>Perfil Profissional</span>
                  </div>
                </Button>

                {/* 2. Gerenciar Tutores */}
                <Button onClick={() => navigate('/tutors')} className="h-20 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white font-semibold">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="w-6 h-6" />
                    <span>Gerenciar Tutores</span>
                  </div>
                </Button>
                
                {/* 3. Gerenciar Pacientes */}
                <Button onClick={() => navigate('/tutors')} className="h-20 bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white font-semibold">
                  <div className="flex flex-col items-center space-y-2">
                    <PawPrint className="w-6 h-6" />
                    <span>Gerenciar Pacientes</span>
                  </div>
                </Button>

                {/* 4. Nova Prescrição */}
                <Button onClick={() => navigate('/tutors')} className="h-20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold">
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="w-6 h-6" />
                    <span>Nova Prescrição</span>
                  </div>
                </Button>
                
                {/* 5. Agendamentos */}
                <Button onClick={() => navigate('/scheduler')} className="h-20 bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-600 text-white font-semibold">
                  <div className="flex flex-col items-center space-y-2">
                    <Calendar className="w-6 h-6" />
                    <span>Agendamentos</span>
                  </div>
                </Button>

                {/* 6. Suporte */}
                <Button 
                  onClick={() => window.location.href = 'mailto:contato@receitadigitalveterinaria.com'} 
                  className="h-20 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <LifeBuoy className="w-6 h-6" />
                    <span>Suporte</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass-effect border-border h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;