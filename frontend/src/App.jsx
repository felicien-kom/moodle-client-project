import './App.css';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import AllRoutes from './router/AllRoutes';
import { Toaster } from '@/components/ui/sonner';
import { AutoSync } from "./components/AutoSync";

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>
        <AutoSync intervalMs={60000} /> {/* 5 secondes pour tester */}
        <ThemeProvider>
          <LanguageProvider>
            <AllRoutes />
            <Toaster position="top-left" richColors closeButton />
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App;