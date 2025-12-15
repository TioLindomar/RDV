import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster.jsx';
import { toast } from '@/components/ui/use-toast';
import LoginScreen from '@/components/LoginScreen.jsx';
import RegisterScreen from '@/components/RegisterScreen.jsx';
import Dashboard from '@/components/Dashboard.jsx';
import TutorsList from '@/components/TutorsList.jsx';
import PatientsList from '@/components/PatientsList.jsx';
import PatientForm from '@/components/PatientForm.jsx';
import PatientHistory from '@/components/PatientHistory.jsx';
import PrescriptionForm from '@/components/PrescriptionForm.jsx';
import PrescriptionPreview from '@/components/PrescriptionPreview.jsx';
import PublicPrescriptionView from '@/components/PublicPrescriptionView.jsx';
import Scheduler from '@/components/Scheduler.jsx';
import ProfileSettings from '@/components/ProfileSettings.jsx';
import SubscriptionPage from '@/components/SubscriptionPage.jsx';
import VerifyEmailScreen from '@/components/VerifyEmailScreen.jsx';
import ForgotPasswordScreen from '@/components/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from '@/components/ResetPasswordScreen.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';

const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user?.id) return;

      try {
        // Use maybeSingle() instead of single() to avoid PGRST116 error when profile doesn't exist yet
        const { data, error } = await supabase
          .from('profiles')
          .select('name, crmv, phone')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking profile:', error);
        }

        // Check if critical fields are present
        if (data && data.name && data.crmv && data.phone) {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }
      } catch (err) {
        console.error('Profile check failed:', err);
        setIsProfileComplete(false);
      }
    };

    if (session) {
      checkProfile();
    }
  }, [session]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/" />;
  }

  // If checking is done and profile is incomplete, force redirect to profile
  if (isProfileComplete === false && location.pathname !== '/profile') {
    // Avoid spamming toasts by checking if we just redirected
    return (
      <>
        <Navigate to="/profile" replace />
        {setTimeout(() => {
           toast({
            title: "Perfil Incompleto",
            description: "Por favor, complete seu perfil profissional (Nome, CRMV e Telefone) para acessar o sistema.",
            variant: "destructive",
          });
        }, 100) && null}
      </>
    );
  }

  return children;
};


function App() {
  useEffect(() => {
    const cleanupExampleUsers = () => {
      try {
        const tutors = JSON.parse(localStorage.getItem('rdv_tutors') || '[]');
        const namesToDelete = ['joao silva', 'maria santos', 'pedro costa'];
        
        const initialCount = tutors.length;
        
        const filteredTutors = tutors.filter(tutor => 
          !namesToDelete.includes(tutor.name.toLowerCase())
        );

        if (filteredTutors.length < initialCount) {
          localStorage.setItem('rdv_tutors', JSON.stringify(filteredTutors));
          toast({
            title: "Limpeza Concluída!",
            description: "Os cadastros de exemplo foram removidos com sucesso.",
          });
        }
      } catch (error) {
        console.error("Failed to clean up example users:", error);
      }
    };

    cleanupExampleUsers();
  }, []);

  return (
    <>
      <Helmet>
        <title>RDV - Receita Digital Veterinária</title>
        <meta name="description" content="RDV: Sistema completo para gestão de receitas veterinárias digitais com assinatura Gov.br" />
        <meta property="og:title" content="RDV - Receita Digital Veterinária" />
        <meta property="og:description" content="RDV: Sistema completo para gestão de receitas veterinárias digitais com assinatura Gov.br" />
      </Helmet>
      
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/verify-email" element={<VerifyEmailScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/view-prescription/:uniqueCode" element={<PublicPrescriptionView />} />
            
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/tutors" element={<PrivateRoute><TutorsList /></PrivateRoute>} />
            <Route path="/patients/:tutorId" element={<PrivateRoute><PatientsList /></PrivateRoute>} />
            <Route path="/patient/new/:tutorId" element={<PrivateRoute><PatientForm /></PrivateRoute>} />
            <Route path="/patient/edit/:patientId" element={<PrivateRoute><PatientForm /></PrivateRoute>} />
            <Route path="/patient/history/:patientId" element={<PrivateRoute><PatientHistory /></PrivateRoute>} />
            <Route path="/prescription/new/:patientId" element={<PrivateRoute><PrescriptionForm /></PrivateRoute>} />
            <Route path="/prescription/preview/:prescriptionId" element={<PrivateRoute><PrescriptionPreview /></PrivateRoute>} />
            <Route path="/scheduler" element={<PrivateRoute><Scheduler /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfileSettings /></PrivateRoute>} />
            <Route path="/subscription" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />
          </Routes>
        </div>
      </Router>
      
      <Toaster />
    </>
  );
}

export default App;