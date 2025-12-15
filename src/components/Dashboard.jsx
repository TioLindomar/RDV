import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, PawPrint, FileText, Calendar, LogOut, Settings, CreditCard, User, LifeBuoy } from 'lucide-react';
import { isToday } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [stats, setStats] = useState([
    { title: 'Tutores Cadastrados', value: 0, icon: Users, color: 'from-primary to-blue-500', target: '/tutors' },
    { title: 'Pacientes Ativos', value: 0, icon: PawPrint, color: 'from-secondary to-green-500', target: '/tutors' },
    { title: 'Prescrições Hoje', value: 0, icon: FileText, color: 'from-purple-500 to-purple-600', target: '/tutors' },
    { title: 'Consultas Agendadas', value: 0, icon: Calendar, color: 'from-accent to-orange-500', target: '/scheduler' },
  ]);

  useEffect(() => {
    const loadedUser = JSON.parse(localStorage.getItem('rdv_user') || '{}');
    setUser(loadedUser);
    
    const fetchStats = () => {
      const tutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
      const patients = JSON.parse(localStorage.getItem('rdv_patients') || '[]');
      const prescriptions = JSON.parse(localStorage.getItem('rdv_prescriptions') || '[]');
      const appointments = JSON.parse(localStorage.getItem('rdv_appointments') || '[]');

      const todayPrescriptions = prescriptions.filter(p => isToday(new Date(p.date))).length;
      const todayAppointments = appointments.filter(a => isToday(new Date(a.date))).length;

      setStats([
        { title: 'Tutores Cadastrados', value: tutors.length, icon: Users, color: 'from-primary to-blue-500', target: '/tutors' },
        { title: 'Pacientes Ativos', value: patients.length, icon: PawPrint, color: 'from-secondary to-green-500', target: '/tutors' },
        { title: 'Prescrições Hoje', value: todayPrescriptions, icon: FileText, color: 'from-purple-500 to-purple-600', target: '/tutors' },
        { title: 'Consultas Agendadas', value: todayAppointments, icon: Calendar, color: 'from-accent to-orange-500', target: '/scheduler' },
      ]);
    };

    fetchStats();

    const handleStorageChange = () => {
        fetchStats();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', fetchStats);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', fetchStats);
    };

  }, []);

  const handleLogout = () => {
    localStorage.removeItem('rdv_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <img src="https://horizons-cdn.hostinger.com/2cba84cd-67f6-4ccb-a719-f85b6f3bc4fa/c026dd484579f330e8e56c64a75211c9.png" alt="Logo RDV Receita Digital Veterinária" className="h-24 w-auto" />
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Painel</h1>
              <p className="text-muted-foreground">Bem-vindo, {user.name} - {user.crmv}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button onClick={() => navigate('/subscription')} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
              <CreditCard className="w-4 h-4 mr-2" />
              Assinatura
            </Button>
            {/* Removed redundant Profile Settings button from header, moved to Quick Actions */}
            <Button onClick={handleLogout} variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </motion.div>

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
                
                {/* 3. Gerenciar Pacientes (Navigate to tutors list to select a tutor first) */}
                <Button onClick={() => navigate('/tutors')} className="h-20 bg-gradient-to-r from-secondary to-green-500 hover:from-secondary/90 hover:to-green-600 text-white font-semibold">
                  <div className="flex flex-col items-center space-y-2">
                    <PawPrint className="w-6 h-6" />
                    <span>Gerenciar Pacientes</span>
                  </div>
                </Button>

                {/* 4. Nova Prescrição (Navigate to tutors list to select a patient first) */}
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