import { Outlet } from 'react-router-dom';
import DrSidebar from './DrSidebar';
import DrHeader from './DrHeader';

const DrLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar - Fixed width */}
      <DrSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <DrHeader />
        
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DrLayout;