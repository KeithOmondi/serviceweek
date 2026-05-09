import { useEffect } from 'react';
import { FilePlus, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchUncontested, fetchAppeals, fetchSummary } from '../../store/slices/matterSlice';

const CDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { 
    uncontested, 
    appeals, 
    summary, 
    loading: matterLoading 
  } = useAppSelector((state) => state.matters);

  // Brand Colors
  //const colors = {deepGreen: '#163321', gold: '#C5A059', };

  useEffect(() => {
    dispatch(fetchUncontested());
    dispatch(fetchAppeals());
    dispatch(fetchSummary());
  }, [dispatch]);

  // Calculate real stats from fetched data
  const totalUncontested = uncontested.length;
  const totalAppeals = appeals.length;
  const totalMatters = totalUncontested + totalAppeals;
  
  const pendingMatters = [...uncontested, ...appeals].filter(m => m.status === 'pending').length;
  const approvedMatters = [...uncontested, ...appeals].filter(m => m.status === 'approved').length;
  const rejectedMatters = [...uncontested, ...appeals].filter(m => m.status === 'rejected').length;
  
  const confirmedFromSummary = summary?.total_confirmed || '0';
  const isLoading = matterLoading.uncontested || matterLoading.appeals || matterLoading.summary;

  const stats = [
    { 
      label: "Total Returns", 
      value: isLoading ? '...' : totalMatters.toString(), 
      icon: ClipboardList, 
      color: 'text-[#163321]', 
      bg: 'bg-green-50',
      detail: `${totalUncontested} uncontested, ${totalAppeals} appeals`
    },
    { 
      label: 'Pending Review', 
      value: isLoading ? '...' : pendingMatters.toString(), 
      icon: FilePlus, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      detail: pendingMatters > 0 ? 'Awaiting DR approval' : 'All caught up'
    },
    { 
      label: 'Approved', 
      value: isLoading ? '...' : approvedMatters.toString(), 
      icon: CheckCircle2, 
      color: 'text-[#C5A059]', 
      bg: 'bg-[#C5A059]/10',
      detail: `${confirmedFromSummary} confirmed`
    },
    { 
      label: 'Rejected', 
      value: isLoading ? '...' : rejectedMatters.toString(), 
      icon: AlertCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      detail: rejectedMatters > 0 ? 'Needs correction' : 'No rejections'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-[#163321]">Welcome, {user?.name || 'Court Assistant'}</h1>
        <p className="text-slate-500 mt-1">
          Court Assistant Portal — Succession Service Week (May 25th - 29th, 2026)
        </p>
        {user?.station && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#163321]/10 rounded-full">
            <span className="text-xs font-medium text-[#163321]">Assigned Station:</span>
            <span className="text-xs font-semibold text-[#163321]">{user.station}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                {stat.detail && (
                  <p className="text-xs text-slate-400 mt-1">{stat.detail}</p>
                )}
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Guidelines Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200" style={{ backgroundColor: '#fcfcfb' }}>
            <h3 className="font-bold text-[#163321] uppercase text-xs tracking-widest">
              Daily Responsibilities (Template E)
            </h3>
          </div>
          <div className="text-center font-serif font-bold">loading.....</div>
          {/*<div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: colors.gold }} />
              <p className="text-slate-700 text-sm">Ensure the <strong>Judge's Daily Service Week Returns</strong> are duly filled.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: colors.gold }} />
              <p className="text-slate-700 text-sm">Update the <strong>CTS (Case Tracking System)</strong> daily following court sessions.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: colors.gold }} />
              <p className="text-slate-700 text-sm">Submit completed returns for verification by the Deputy Registrar and confirmation by the Judge.</p>
            </div>
          </div>*/}
        </div>

        {/* Quick Stats Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200" style={{ backgroundColor: '#fcfcfb' }}>
            <h3 className="font-bold text-[#163321] uppercase text-xs tracking-widest">
              Quick Overview
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Total Matters Submitted</span>
              <span className="text-lg font-semibold text-[#163321]">{isLoading ? '...' : totalMatters}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Pending Approval</span>
              <span className="text-lg font-semibold text-amber-600">{isLoading ? '...' : pendingMatters}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Approved & Synced</span>
              <span className="text-lg font-semibold text-[#C5A059]">{isLoading ? '...' : confirmedFromSummary}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">Needs Correction</span>
              <span className="text-lg font-semibold text-red-600">{isLoading ? '...' : rejectedMatters}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => window.location.href = '/c/entries/service-week/add'}
          className="px-6 py-3 bg-[#163321] text-white rounded-lg font-semibold text-sm hover:bg-[#1f4228] transition-colors shadow-sm"
        >
          + Add New Entry
        </button>
        <button 
          onClick={() => window.location.href = '/c/entries'}
          className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          View All Entries
        </button>
      </div>
    </div>
  );
};

export default CDashboard;