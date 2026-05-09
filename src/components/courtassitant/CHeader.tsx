import { useAppSelector } from '../../store/hooks';
import { UserCircle, ShieldCheck, BadgeCheck, MapPin } from 'lucide-react';

const CHeader = () => {
  // Get user from auth slice
  const { user } = useAppSelector((state) => state.auth);
  
  // Get matters to extract the station name
  const { uncontested, appeals, rri } = useAppSelector((state) => state.matters);

  /**
   * FIX: Derived Station Logic
   * We look for the station in the actual data arrays first.
   * If empty, we check the user profile.
   * Fallback to "Registry Office".
   */
  const courtStation = 
    uncontested[0]?.station || 
    appeals[0]?.station || 
    rri[0]?.station || 
    user?.station || 
    "Registry Office";

  const colors = {
    deepGreen: '#163321',
    gold: '#C5A059',
    border: '#e5e5e3',
  };

  return (
    <header className="flex h-20 items-center justify-between border-b bg-white px-8 shadow-sm">
      {/* Left Section: Branding & Dynamic Court Station */}
      <div className="flex items-center space-x-4">
        <div 
          className="p-2 rounded-xl shadow-inner"
          style={{ backgroundColor: `${colors.gold}15` }}
        >
           <ShieldCheck style={{ color: colors.gold }} size={26} />
        </div>
        <div>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-tight">
            Judiciary of Kenya
          </h2>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <MapPin size={12} className="text-slate-400" />
            <h1 className="text-sm font-bold font-serif text-slate-700 uppercase tracking-wider">
              {courtStation}
            </h1>
          </div>
        </div>
      </div>

      {/* Right Section: User Profile & Status */}
      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Session Authorized
          </span>
        </div>

        <div className="flex items-center space-x-4 border-l pl-6" style={{ borderColor: colors.border }}>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-1">
              <p className="text-sm font-bold text-slate-900">{user?.name || 'Authorized User'}</p>
              <BadgeCheck size={14} className="text-blue-500" />
            </div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {user?.role?.replace(/_/g, ' ') || 'Court Assistant'}
            </p>
          </div>
          
          <div className="relative">
            <UserCircle size={38} className="text-slate-300" strokeWidth={1.5} />
            <div 
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
              style={{ backgroundColor: colors.gold }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default CHeader;