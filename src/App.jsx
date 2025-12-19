import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster.jsx';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Pages & Components Públicos
import LoginScreen from '@/pages/LoginScreen';
import RegisterScreen from '@/pages/RegisterScreen.jsx';
import VerifyEmailScreen from '@/pages/VerifyEmailScreen.jsx';
import ForgotPasswordScreen from '@/pages/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from '@/pages/ResetPasswordScreen.jsx';
import PublicPrescriptionView from '@/components/PublicPrescriptionView.jsx';

// Pages & Components Privados
import Dashboard from '@/pages/Dashboard.jsx';
import TutorsList from '@/components/TutorsList.jsx';
import PatientsList from '@/components/PatientsList.jsx';
import PrescriptionForm from '@/components/forms/PrescriptionForm.jsx';
import PrescriptionPreview from '@/components/PrescriptionPreview.jsx';
import PrescriptionsList from '@/components/PrescriptionsList.jsx';
import Scheduler from '@/components/Scheduler.jsx';
import ProfileSettings from '@/components/ProfileSettings.jsx';
import SubscriptionPage from '@/pages/SubscriptionPage.jsx';

// Contexts & Libs
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';

// --- COMPONENTE DE ROTA PRIVADA ---
const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(null); // null = verificando
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, crmv, phone')
          .eq('id', session.user.id)
          .maybeSingle();

        // Verifica se os campos obrigatórios existem
        if (data && data.name && data.crmv && data.phone) {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }
      } catch (err) {
        console.error("Erro ao verificar perfil:", err);
        setIsProfileComplete(false);
      }
    };

    if (session) {
      checkProfile();
    }
  }, [session]);

  // 1. Carregando Autenticação
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  // 2. Não Logado -> Manda pro Login
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // 3. Verificando Perfil (Ainda não sabemos se está completo)
  if (isProfileComplete === null) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  // 4. Perfil Incompleto -> Manda preencher (Exceto se já estiver na tela de perfil)
  if (isProfileComplete === false && location.pathname !== '/profile') {
    // Usamos um toast para avisar o motivo do redirecionamento (opcional)
    return <Navigate to="/profile" replace />;
  }

  return children;
};

// Hook para limpar cache antigo (opcional)
function useCleanup() {
  useEffect(() => {
    localStorage.removeItem('rdv_tutors');
    localStorage.removeItem('rdv_patients');
  }, []);
}

function App() {
  useCleanup();

  return (
    <>
      <Helmet>
        <title>RDV - Receita Digital Veterinária</title>
        <meta name="description" content="Sistema completo para gestão de receitas veterinárias digitais." />
      </Helmet>
      
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            {/* --- ROTAS PÚBLICAS --- */}
            <Route path="/" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/verify-email" element={<VerifyEmailScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/view-prescription/:uniqueCode" element={<PublicPrescriptionView />} />
            
            {/* --- ROTAS PRIVADAS (Protegidas) --- */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/tutors" element={<PrivateRoute><TutorsList /></PrivateRoute>} />
            
            {/* Pacientes e Prescrições */}
            <Route path="/patients/:tutorId" element={<PrivateRoute><PatientsList /></PrivateRoute>} />
            
            <Route path="/prescription/new/:patientId" element={<PrivateRoute><PrescriptionForm /></PrivateRoute>} />
            {/* Nota: Preview aceita ID real ou 'draft' */}
            <Route path="/prescription/preview/:prescriptionId" element={<PrivateRoute><PrescriptionPreview /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><PrescriptionsList /></PrivateRoute>} />
            
            {/* Agenda e Configurações */}
            <Route path="/scheduler" element={<PrivateRoute><Scheduler /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfileSettings /></PrivateRoute>} />
            <Route path="/subscription" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />

            {/* Fallback - Redireciona qualquer rota desconhecida para o login */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
      
      <Toaster />
    </>
  );
}

export default App;