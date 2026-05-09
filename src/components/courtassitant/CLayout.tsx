import { Outlet } from 'react-router-dom';
import CSidebar from './CSidebar';
import CHeader from './CHeader';

const CLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <CSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <CHeader />
        
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CLayout;