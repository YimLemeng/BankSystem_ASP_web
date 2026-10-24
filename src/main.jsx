import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { SidebarProvider } from './context/SidebarContext';
import { LanguageProvider } from './context/LanguageContext';
import GlobalLoadingModal from './components/GlobalLoadingModal';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LoadingProvider>
        <AuthProvider>
          <SidebarProvider>
            <LanguageProvider>
              <GlobalLoadingModal />
              <App />
            </LanguageProvider>
          </SidebarProvider>
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  </React.StrictMode>
);
