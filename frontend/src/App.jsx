import './App.css';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import AllRoutes from './router/AllRoutes';
import { Toaster } from '@/components/ui/sonner';

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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