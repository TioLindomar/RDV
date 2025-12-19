import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  PawPrint,
  FileText,
  Calendar,
  LogOut,
  CreditCard,
  User,
  LifeBuoy,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";
import { supabase } from "@/lib/customSupabaseClient";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user: authUser } = useAuth();

  const [profile, setProfile] = useState(null); // Inicia como null para saber que está carregando
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: "Tutores Cadastrados",
      value: 0,
      icon: Users,
      color: "from-primary to-blue-500",
      target: "/tutors",
    },
    {
      title: "Pacientes Ativos",
      value: 0,
      icon: PawPrint,
      color: "from-secondary to-green-500",
      target: "/tutors",
    },
    {
      title: "Prescrições Hoje",
      value: 0,
      icon: FileText,
      color: "from-purple-500 to-purple-600",
      target: "/tutors",
    },
    {
      title: "Consultas Hoje",
      value: 0,
      icon: Calendar,
      color: "from-accent to-orange-500",
      target: "/scheduler",
    },
  ]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!authUser?.id) return;

      try {
        setLoading(true);
        // 1. Carregar Perfil
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle(); // maybeSingle evita erro 406 se não achar

        if (profileData) {
          setProfile(profileData);
        }

        // 2. Carregar Estatísticas (Counts)
        // Usamos count: 'exact', head: true para ser rápido (não baixa os dados)
        // Nota: O RLS do banco já filtra por organization_id, então não precisamos filtrar manualmente por vet

        const { count: tutorsCount } = await supabase
          .from("tutors")
          .select("*", { count: "exact", head: true });
        const { count: patientsCount } = await supabase
          .from("patients")
          .select("*", { count: "exact", head: true });

        const todayStr = new Date().toISOString().split("T")[0];
        const { count: prescriptionsToday } = await supabase
          .from("prescriptions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", `${todayStr}T00:00:00`);

        const { count: appointmentsToday } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("start_time", `${todayStr}T00:00:00`);

        setStats([
          {
            title: "Tutores Cadastrados",
            value: tutorsCount || 0,
            icon: Users,
            color: "from-primary to-blue-500",
            target: "/tutors",
          },
          {
            title: "Pacientes Ativos",
            value: patientsCount || 0,
            icon: PawPrint,
            color: "from-secondary to-green-500",
            target: "/tutors",
          },
          {
            title: "Prescrições Hoje",
            value: prescriptionsToday || 0,
            icon: FileText,
            color: "from-purple-500 to-purple-600",
            target: "/tutors",
          },
          {
            title: "Consultas Hoje",
            value: appointmentsToday || 0,
            icon: Calendar,
            color: "from-accent to-orange-500",
            target: "/scheduler",
          },
        ]);
      } catch (error) {
        console.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [authUser]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center space-x-4">
            <img
              src="https://horizons-cdn.hostinger.com/2cba84cd-67f6-4ccb-a719-f85b6f3bc4fa/c026dd484579f330e8e56c64a75211c9.png"
              alt="Logo RDV"
              className="h-20 w-auto object-contain"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                Painel
              </h1>
              <p className="text-muted-foreground">
                Olá, {profile?.name || "Veterinário(a)"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => navigate("/subscription")}
              variant="outline"
              className="hidden md:flex"
            >
              <CreditCard className="w-4 h-4 mr-2" /> Assinatura
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </motion.div>

        {/* Ações Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass-effect border-border">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Button
                  onClick={() => navigate("/tutors")}
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-primary to-blue-600 hover:scale-105 transition-transform text-white"
                >
                  <Users className="w-8 h-8" /> <span>Tutores</span>
                </Button>
                <Button
                  onClick={() => navigate("/tutors")}
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-secondary to-green-600 hover:scale-105 transition-transform text-white"
                >
                  <PawPrint className="w-8 h-8" /> <span>Pacientes</span>
                </Button>
                <Button
                  onClick={() => navigate("/tutors")}
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-500 to-purple-700 hover:scale-105 transition-transform text-white"
                >
                  <FileText className="w-8 h-8" /> <span>Receita</span>
                </Button>
                <Button onClick={() => navigate("/history")} className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-500 to-blue-700 hover:scale-105 transition-transform text-white">
                  <FileText className="w-8 h-8" /> <span>Histórico de Receitas</span>
                </Button>
                <Button
                  onClick={() => navigate("/scheduler")}
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-orange-400 to-orange-600 hover:scale-105 transition-transform text-white"
                >
                  <Calendar className="w-8 h-8" /> <span>Agenda</span>
                </Button>
                <Button
                  onClick={() => navigate("/profile")}
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-gray-600 to-gray-800 hover:scale-105 transition-transform text-white"
                >
                  <User className="w-8 h-8" /> <span>Perfil</span>
                </Button>
                <Button
                  onClick={() =>
                    (window.location.href = "mailto:suporte@rdv.com.br")
                  }
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-teal-500 to-teal-700 hover:scale-105 transition-transform text-white"
                >
                  <LifeBuoy className="w-8 h-8" /> <span>Suporte</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="glass-effect border-border h-full hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(stat.target)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full bg-gradient-to-r ${stat.color} text-white shadow-md`}
                  >
                    <stat.icon className="w-6 h-6" />
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
