import { Outlet } from 'react-router-dom';

function PublicLayout() {
  return (
    <div className="w-full h-full bg-my-bg-dark text-my-text-primary">
      <Outlet />
    </div>
  );
}

export default PublicLayout;
