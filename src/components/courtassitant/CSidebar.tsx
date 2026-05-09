import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  //FileSpreadsheet, 
  //History, 
  //Settings, 
  LogOut, 
  PlusCircle,
  ListFilter
} from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';

const CSidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Theme Colors from Screenshot
  const colors = {
    deepGreen: '#163321', // The main brand green
    gold: '#C5A059',      // The "ONBOARDING" gold
    softGreen: '#1e422b', // Slightly lighter for hover states
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/c/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      name: 'Add Entry', 
      path: '/c/entries', 
      icon: PlusCircle 
    },
    { 
      name: 'All Entries', 
      path: '/c/all-entries', 
      icon: ListFilter 
    },
    //{ name: "Judge's Returns", path: '/c/returns', icon: FileSpreadsheet },
    //{ name: 'Registry History', path: '/c/history', icon: History },
    //{ name: 'Settings', path: '/c/settings', icon: Settings },
  ];

  const handleLogout = () => {
    // Optional: add a confirmation or toast here
    dispatch(logoutUser());
  };

  return (
    <div 
      className="flex h-screen w-64 flex-col text-white border-r border-white/10"
      style={{ backgroundColor: colors.deepGreen }}
    >
      {/* Brand Header */}
      <div className="flex h-24 flex-col font-serif items-center justify-center border-b border-white/10 px-4 text-center">
        <h1 
          className="text-lg font-bold font-serif tracking-tight leading-tight"
          style={{ color: colors.gold }}
        >
          COURT ASSISTANT
        </h1>
        <span className="mt-1 text-[10px] font-serif font-semibold text-white/60 uppercase tracking-[0.15em]">
          Office of the Registrar
        </span>
        <span className="text-[9px] text-white/40 uppercase tracking-[0.1em]">
          High Court of Kenya
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 rounded-md px-4 py-3 transition-all duration-200 group ${
                isActive 
                  ? 'shadow-lg' 
                  : 'text-white/70 hover:text-white'
              }`}
              style={{ 
                backgroundColor: isActive ? colors.softGreen : 'transparent',
                borderLeft: isActive ? `3px solid ${colors.gold}` : '3px solid transparent'
              }}
            >
              <Icon 
                size={20} 
                style={{ color: isActive ? colors.gold : 'inherit' }}
                className={!isActive ? 'opacity-50 group-hover:opacity-100' : ''} 
              />
              <span className={`font-medium ${isActive ? 'text-white' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center space-x-3 rounded-md px-4 py-3 text-white/60 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group"
        >
          <LogOut 
            size={20} 
            className="group-hover:-translate-x-1 transition-transform" 
          />
          <span className="font-medium">Sign Out</span>
        </button>
        
        {/* Encrypted Status Label from Screenshot */}
        <div className="mt-4 flex items-center justify-center space-x-2 opacity-30">
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          <span className="text-[9px] uppercase tracking-widest font-bold">End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default CSidebar;