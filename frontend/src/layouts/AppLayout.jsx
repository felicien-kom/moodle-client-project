import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/content/Navbar';

function AppLayout() {
  return (
    <div className="w-full h-full bg-my-bg-dark text-my-text-primary">
      {/* Navbar fixe en haut */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <Navbar />
      </div>
      
      {/* Contenu avec padding pour éviter la Navbar */}
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;
