import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Componente SIMPLES para testar o Supabase diretamente
const SupabaseDebug = () => {
  const [logs, setLogs] = useState([]);

  const addLog = (message, data) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] ${message}`, data || '');
    setLogs(prev => [...prev, { timestamp, message, data }]);
  };

  useEffect(() => {
    addLog('🚀 SupabaseDebug montado');

    // 1. Verificar a URL
    const hash = window.location.hash;
    addLog('🔗 Hash da URL:', hash);

    const hasToken = hash.includes('access_token');
    const hasRecovery = hash.includes('type=recovery');
    addLog('🔑 Análise:', { hasToken, hasRecovery });

    // 2. Tentar pegar sessão IMEDIATAMENTE
    const checkNow = async () => {
      addLog('🔍 Chamando getSession()...');
      const { data, error } = await supabase.auth.getSession();
      addLog('📊 Resultado getSession:', { 
        hasSession: !!data.session, 
        error: error?.message,
        userId: data.session?.user?.id 
      });
    };

    checkNow();

    // 3. Listener de eventos
    addLog('👂 Registrando listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog('🔔 EVENTO RECEBIDO:', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id 
      });
    });

    return () => {
      addLog('💀 SupabaseDebug desmontado');
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Diagnóstico Supabase</h1>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">📍 Informações da URL</h2>
          <p className="text-sm text-gray-300 break-all">{window.location.href}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">📋 Logs em Tempo Real</h2>
          <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                <span className="text-gray-400">[{log.timestamp}]</span>{' '}
                <span className="text-green-400">{log.message}</span>
                {log.data && (
                  <pre className="text-gray-300 mt-1 text-xs">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          ⚠️ Este componente é apenas para diagnóstico. Abra o Console (F12) para ver mais detalhes.
        </div>
      </div>
    </div>
  );
};

export default SupabaseDebug;