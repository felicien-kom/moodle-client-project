import { useTranslation } from 'react-i18next';
import './App.css';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import AllRoutes from './router/AllRoutes';

function App() {
  const { t } = useTranslation();
  const greetings = t("test");

  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AllRoutes />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App;