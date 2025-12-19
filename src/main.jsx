// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from '@/App.jsx';
// import '@/index.css';
// import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <AuthProvider>
//       <App />
//     </AuthProvider>
//   </React.StrictMode>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  // Removi o <React.StrictMode> temporariamente para evitar double-render no Firefox
  <AuthProvider>
    <App />
  </AuthProvider>
);