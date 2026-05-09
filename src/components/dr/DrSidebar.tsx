import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Gavel, 
  //BarChart3, 
  //Settings, 
  LogOut, Users } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';

const DrSidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const colors = {
    deepGreen: '#163321', // The main brand green
    gold: '#C5A059',      // The "ONBOARDING" gold
    softGreen: '#1e422b', // Slightly lighter for hover states
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dr/dashboard', icon: LayoutDashboard },
    { name: 'Matters', path: '/dr/matters', icon: Gavel },
    //{ name: 'Analytics', path: '/dr/analytics', icon: BarChart3 },
    { name: 'Court Assistant', path: '/dr/court-assistant', icon: Users }, // Updated text and icon
    //{ name: 'Settings', path: '/dr/settings', icon: Settings },
  ];

  return (
    <div 
      className="flex h-screen w-64 flex-col text-white shadow-2xl"
      style={{ backgroundColor: colors.deepGreen }}
    >
      {/* Brand Header */}
      <div className="flex h-28 flex-col font-serif items-center justify-center border-b border-white/5 px-4 text-center">
        <h1 
          className="text-lg font-bold font-serif tracking-tight leading-tight"
          style={{ color: colors.gold }}
        >
          DEPUTY REGISTRAR
        </h1>
        <span className="mt-1 text-[10px] font-serif font-semibold text-white/60 uppercase tracking-[0.15em]">
          Office of the Registrar
        </span>
        <span className="text-[9px] text-white/30 uppercase tracking-[0.1em]">
          High Court of Kenya
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-4 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon 
                size={20} 
                style={{ color: isActive ? colors.gold : 'inherit' }}
                className={isActive ? '' : 'group-hover:text-white'}
              />
              <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                {item.name}
              </span>
              
              {/* Active Indicator Pin */}
              {isActive && (
                <div 
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: colors.gold }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="border-t border-white/5 p-4">
        <button
          onClick={() => dispatch(logoutUser())}
          className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-white/50 transition-all hover:bg-red-500/10 hover:text-red-400 group"
        >
          <LogOut size={20} className="group-hover:animate-pulse" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default DrSidebar;