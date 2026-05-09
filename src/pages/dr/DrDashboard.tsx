import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, Clock, CheckCircle, AlertCircle, Eye, TrendingUp } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchUncontested, fetchAppeals, fetchRRIMatters, fetchSummary } from '../../store/slices/matterSlice';

const DrDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const uncontested = useAppSelector((state) => state.matters.uncontested);
  const appeals = useAppSelector((state) => state.matters.appeals);
  const rri = useAppSelector((state) => state.matters.rri);
  const summary = useAppSelector((state) => state.matters.summary);
  const loading = useAppSelector((state) => 
    state.matters.loading.uncontested || 
    state.matters.loading.appeals || 
    state.matters.loading.rri ||
    state.matters.loading.summary
  );

  useEffect(() => {
    // Fetch all matters for the dashboard
    dispatch(fetchUncontested());
    dispatch(fetchAppeals());
    dispatch(fetchRRIMatters());
    dispatch(fetchSummary());
  }, [dispatch]);

  // Calculate real stats from fetched data
  const totalMatters = uncontested.length + appeals.length + rri.length;
  const pendingMatters = [...uncontested, ...appeals, ...rri].filter(m => m.status === 'pending').length;
  const approvedMatters = [...uncontested, ...appeals, ...rri].filter(m => m.status === 'approved').length;
  const rejectedMatters = [...uncontested, ...appeals, ...rri].filter(m => m.status === 'rejected').length;
  
  // Get recent matters (last 5 across all types)
  const recentMatters = [...uncontested, ...appeals, ...rri]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5);

  const stats = [
    { 
      label: 'Total Matters', 
      value: totalMatters.toString(), 
      icon: Gavel, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      trend: summary?.total_uncontested ? `+${summary.total_uncontested} this month` : null
    },
    { 
      label: 'Pending Review', 
      value: pendingMatters.toString(), 
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-100',
      trend: pendingMatters > 0 ? 'Awaiting action' : null
    },
    { 
      label: 'Approved', 
      value: approvedMatters.toString(), 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    },
    { 
      label: 'Rejected', 
      value: rejectedMatters.toString(), 
      icon: AlertCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-100' 
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      approved: 'bg-green-50 text-green-700 ring-green-600/20',
      rejected: 'bg-red-50 text-red-700 ring-red-600/20'
    };
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading && totalMatters === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome, {user?.name || 'Deputy Registrar'}
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of judicial matters and administrative statistics.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/dr/matters')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Eye size={16} />
            View All Matters
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center rounded-xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`mr-4 rounded-lg ${stat.bg} p-3 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                {stat.trend && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp size={12} />
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Matters Table */}
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 p-5 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recently Updated Matters</h3>
            <button 
              onClick={() => navigate('/dr/matters')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            {recentMatters.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No matters found
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Case Number</th>
                    <th className="px-6 py-3">Citation</th>
                    <th className="px-6 py-3">Station</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Outcome</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentMatters.map((matter) => (
                    <tr 
                      key={matter.id} 
                      onClick={() => navigate('/dr/matters')}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-medium text-slate-900">
                        {matter.case_number}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {matter.citation}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {matter.station}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(matter.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {matter.outcome}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {matter.hearing_date ? new Date(matter.hearing_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dr/matters')}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              View All Matters
            </button>
            <button 
              onClick={() => navigate('/dr/matters?tab=analytics')}
              className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View Analytics
            </button>
            
            <div className="pt-4 mt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">System Alerts</h4>
              
              {pendingMatters > 0 && (
                <div className="flex items-start space-x-3 text-sm mb-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                  <p className="text-slate-600">
                    <span className="font-semibold">{pendingMatters}</span> matter{pendingMatters !== 1 ? 's are' : ' is'} pending your review.
                  </p>
                </div>
              )}
              
              {rejectedMatters > 0 && (
                <div className="flex items-start space-x-3 text-sm">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-slate-600">
                    <span className="font-semibold">{rejectedMatters}</span> matter{rejectedMatters !== 1 ? 's have been' : ' has been'} rejected and require resubmission.
                  </p>
                </div>
              )}
              
              {pendingMatters === 0 && rejectedMatters === 0 && (
                <div className="flex items-start space-x-3 text-sm">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                  <p className="text-slate-600">
                    All matters are up to date. No pending actions required.
                  </p>
                </div>
              )}
            </div>
            
            {/* Summary Card */}
            {summary && (
              <div className="pt-4 mt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Quick Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{summary.total_uncontested}</p>
                    <p className="text-xs text-slate-500">Uncontested</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{summary.total_appeals}</p>
                    <p className="text-xs text-slate-500">Appeals</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Station Information if DR has assigned station */}
      {user?.station && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 p-5 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-indigo-900">Your Assigned Station</h3>
              <p className="text-indigo-700 text-sm mt-1">
                You are currently overseeing matters from <span className="font-semibold">{user.station}</span>.
              </p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <Gavel size={24} className="text-indigo-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrDashboard;