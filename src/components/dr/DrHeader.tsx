import { useAppSelector } from '../../store/hooks';
import { Bell, UserCircle } from 'lucide-react';

const DrHeader = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className="flex h-50 items-center justify-between border-b bg-white px-8 shadow-sm">
      <div>
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          {user?.station ?? 'Deputy Registrar'}
        </h2>
        
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative text-slate-500 hover:text-indigo-600 transition-colors">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            3
          </span>
        </button>

        <div className="flex items-center space-x-3 border-l pl-6">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
          </div>
          <UserCircle size={32} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default DrHeader;