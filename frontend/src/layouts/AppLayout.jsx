import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import MainLogo from '../components/custom/MainLogo';
import { Wifi, WifiOff, RefreshCcw, Info, Mail, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function AppLayout() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConnected, setShowConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowConnected(true);
      setTimeout(() => setShowConnected(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 flex flex-col font-sans">
      {/* Network Status Banner */}
      {!isOnline && (
        <div className="w-full bg-red-50 text-red-600 py-2 flex justify-center items-center gap-2 text-sm font-medium z-50">
          <WifiOff className="w-4 h-4" />
          Vous êtes hors ligne. Vérifiez votre connexion internet.
        </div>
      )}
      
      {isOnline && showConnected && (
        <div className="w-full bg-green-50 text-green-600 py-2 flex justify-center items-center gap-2 text-sm font-medium z-50 transition-all duration-300">
          <Wifi className="w-4 h-4" />
          Connexion rétablie ! Vous êtes de nouveau en ligne.
        </div>
      )}

      {/* Global Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center">
            <MainLogo className="h-8" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
            <NavLink 
              to="/app/home"
              className={({ isActive }) => 
                isActive ? "text-indigo-700 bg-indigo-50 px-4 py-2 rounded-md transition-colors" : "text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
              }
            >
              Accueil
            </NavLink>
            <NavLink 
              to="/app/courses"
              className={({ isActive }) => 
                isActive ? "text-indigo-700 bg-indigo-50 px-4 py-2 rounded-md transition-colors" : "text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
              }
            >
              Cours
            </NavLink>
            <NavLink 
              to="/app/evaluations"
              className={({ isActive }) => 
                isActive ? "text-indigo-700 bg-indigo-50 px-4 py-2 rounded-md transition-colors" : "text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
              }
            >
              Évaluations
            </NavLink>
            <NavLink 
              to="/app"
              end
              className={({ isActive }) => 
                isActive ? "text-indigo-700 bg-indigo-50 px-4 py-2 rounded-md transition-colors" : "text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
              }
            >
              Tableau de bord
            </NavLink>
          </nav>

          <div className="flex items-center space-x-5 text-gray-500">
            <RefreshCcw className="w-5 h-5 cursor-pointer hover:text-gray-700" />
            <Info className="w-5 h-5 cursor-pointer hover:text-gray-700" />
            <Mail className="w-5 h-5 cursor-pointer hover:text-gray-700" />
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <span className="text-sm font-medium text-gray-700">{user?.name || "Enseignant Un"}</span>
            
            <button className="flex items-center space-x-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">
              <span>EN</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            <Settings className="w-5 h-5 cursor-pointer hover:text-gray-700" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
