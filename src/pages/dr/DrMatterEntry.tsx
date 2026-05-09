import { useEffect, useState } from 'react';
import {
  fetchUncontested,
  fetchAppeals,
  fetchSummary,
  updateUncontested,
  updateAppeal,
  approveUncontested,
  approveAppeal,
  rejectUncontested,
  rejectAppeal,
  clearMatterError,
} from '../../store/slices/matterSlice';
import type {
  Matter,
  MatterOutcome,
  ServiceWeekNature,
} from '../../types/matter.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

// ─── Types & Constants ───────────────────────────────────────────────────────

type TabId = 'uncontested' | 'appeals';

interface EditForm {
  id: number;
  nature_tab: 'uncontested' | 'appeal';
  case_number: string;
  citation: string;
  station: string;
  judge: string;
  court_assistant: string;
  nature: ServiceWeekNature | '';
  activity: string;
  outcome: MatterOutcome;
  next_hearing_date: string;
  remarks: string;
}

const OUTCOMES: MatterOutcome[] = ['Grant Confirmed', 'Matter Adjourned', 'Withdrawn', 'Dismissed'];

const SERVICE_WEEK_NATURES: ServiceWeekNature[] = [
  'Uncontested Confirmation',
  'Application for Rectification',
  'Succession Appeal',
  'Adoption of Succession Mediation File',
];

const OUTCOME_STYLES: Record<MatterOutcome, { bg: string; color: string }> = {
  'Grant Confirmed':  { bg: '#EAF3DE', color: '#27500A' },
  'Matter Adjourned': { bg: '#FAEEDA', color: '#633806' },
  'Withdrawn':        { bg: '#F1EFE8', color: '#444441' },
  'Dismissed':        { bg: '#FCEBEB', color: '#791F1F' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#FEF9EC', color: '#92620A', label: 'Pending Review' },
  approved: { bg: '#EBF5EC', color: '#1A4D2E', label: 'Approved' },
  rejected: { bg: '#FDF1F1', color: '#7A1F1F', label: 'Rejected' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

const OutcomeBadge = ({ outcome }: { outcome: MatterOutcome }) => {
  const style = OUTCOME_STYLES[outcome] ?? { bg: '#F1EFE8', color: '#444441' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 99,
      background: style.bg, color: style.color,
    }}>
      {outcome || '—'}
    </span>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <div style={{ background: 'var(--color-bg-secondary, #f5f5f3)', borderRadius: 8, padding: '1rem' }}>
    <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 600, color: color ?? 'inherit' }}>{value}</div>
  </div>
);

// ─── Table with Approve/Reject Buttons ────────────────────────────────────────

const COLUMNS: { label: string; width: string }[] = [
  { label: 'Case No.',     width: '120px' },
  { label: 'Citation',     width: '160px' },
  { label: 'Station',      width: '100px' },
  { label: 'Judge',        width: '130px' },
  { label: 'Court Asst.',  width: '120px' },
  { label: 'Nature',       width: '180px' },
  { label: 'Activity',     width: '150px' },
  { label: 'Hearing Date', width: '105px' },
  { label: 'Outcome',      width: '130px' },
  { label: 'Next Hearing', width: '105px' },
  { label: 'Status',       width: '110px' },
  { label: 'Remarks',      width: '130px' },
  { label: 'Actions',      width: '140px' },
];

interface MatterTableProps {
  rows: Matter[];
  nature_tab: 'uncontested' | 'appeal';
  onEdit: (m: Matter, nature_tab: 'uncontested' | 'appeal') => void;
  onApprove: (id: number, nature_tab: 'uncontested' | 'appeal') => void;
  onReject: (id: number, nature_tab: 'uncontested' | 'appeal', reason: string) => void;
}

const MatterTable = ({ rows, nature_tab, onEdit, onApprove, onReject }: MatterTableProps) => {
  const [rejectReason, setRejectReason] = useState<{ [key: number]: string }>({});
  const [showRejectModal, setShowRejectModal] = useState<{ [key: number]: boolean }>({});

  const handleRejectConfirm = (id: number) => {
    if (rejectReason[id]) {
      onReject(id, nature_tab, rejectReason[id]);
      setShowRejectModal({ ...showRejectModal, [id]: false });
      setRejectReason({ ...rejectReason, [id]: '' });
    }
  };

  return (
    <div style={{ overflowX: 'auto', border: '0.5px solid var(--color-border, #e5e5e3)', borderRadius: 12 }}>
      <table style={{ width: '100%', minWidth: 1500, borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-secondary, #f5f5f3)' }}>
            {COLUMNS.map(({ label, width }, i) => (
              <th key={i} style={{
                padding: '10px 14px', textAlign: 'left',
                fontSize: 12, fontWeight: 500, color: '#888',
                borderBottom: '0.5px solid var(--color-border, #e5e5e3)', width,
              }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                No matters found for your station.
              </td>
            </tr>
          ) : rows.map((m) => (
            <tr key={m.id} style={{ borderBottom: '0.5px solid var(--color-border, #e5e5e3)' }}>
              <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.case_number}</td>
              <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.citation}</td>
              <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.station}</td>
              <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.judge}</td>
              <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#888' }}>{m.court_assistant || '—'}</td>
              <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{m.nature || '—'}</td>
              <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#888', fontSize: 12 }}>{m.activity || '—'}</td>
              <td style={{ padding: '11px 14px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                {m.hearing_date ? new Date(m.hearing_date).toLocaleDateString() : '—'}
              </td>
              <td style={{ padding: '11px 14px' }}><OutcomeBadge outcome={m.outcome} /></td>
              <td style={{ padding: '11px 14px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                {m.next_hearing_date ? new Date(m.next_hearing_date).toLocaleDateString() : '—'}
              </td>
              <td style={{ padding: '11px 14px' }}><StatusBadge status={m.status} /></td>
              <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#888' }}>{m.remarks || '—'}</td>
              <td style={{ padding: '11px 14px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onEdit(m, nature_tab)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4, borderRadius: 6 }}
                    aria-label="Edit matter"
                  >
                    ✎
                  </button>
                  {m.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onApprove(m.id, nature_tab)}
                        style={{
                          background: '#EAF3DE', border: 'none', cursor: 'pointer',
                          color: '#27500A', padding: '4px 8px', borderRadius: 6,
                          fontSize: 11, fontWeight: 600
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal({ ...showRejectModal, [m.id]: true })}
                        style={{
                          background: '#FCEBEB', border: 'none', cursor: 'pointer',
                          color: '#791F1F', padding: '4px 8px', borderRadius: 6,
                          fontSize: 11, fontWeight: 600
                        }}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Reject Modal */}
      {Object.entries(showRejectModal).map(([id, isOpen]) => isOpen && (
        <div key={id} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: 400 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Reject Matter</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Please provide a reason for rejecting this matter:
            </p>
            <textarea
              placeholder="Enter rejection reason..."
              value={rejectReason[Number(id)] || ''}
              onChange={(e) => setRejectReason({ ...rejectReason, [Number(id)]: e.target.value })}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                border: '1px solid #ddd', minHeight: 100, marginBottom: 16,
                fontSize: 13, fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowRejectModal({ ...showRejectModal, [Number(id)]: false })}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectConfirm(Number(id))}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  background: '#791F1F', color: '#fff', cursor: 'pointer',
                  opacity: rejectReason[Number(id)] ? 1 : 0.6
                }}
                disabled={!rejectReason[Number(id)]}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DrMatterEntry = () => {
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((s) => s.auth);
  const uncontested = useAppSelector((s) => s.matters.uncontested);
  const appeals = useAppSelector((s) => s.matters.appeals);
  const error = useAppSelector((s) => s.matters.error);
  const loadingU = useAppSelector((s) => s.matters.loading.uncontested);
  const loadingA = useAppSelector((s) => s.matters.loading.appeals);

  const [activeTab, setActiveTab] = useState<TabId>('uncontested');
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch only matters for the DR's station
  useEffect(() => {
    const station = user?.station ?? undefined;
    dispatch(fetchUncontested({ station }));
    dispatch(fetchAppeals({ station }));
    dispatch(fetchSummary());
  }, [dispatch, user?.station]);

  const filterMatters = (list: Matter[]) =>
    list.filter((m) => {
      const matchesSearch = !search || `${m.case_number} ${m.citation} ${m.judge} ${m.court_assistant}`.toLowerCase().includes(search.toLowerCase());
      const matchesOutcome = !filterOutcome || m.outcome === filterOutcome;
      return matchesSearch && matchesOutcome;
    });

  const filteredU = filterMatters(uncontested);
  const filteredA = filterMatters(appeals);
  const loading = activeTab === 'uncontested' ? loadingU : loadingA;

  const openEdit = (m: Matter, nature_tab: 'uncontested' | 'appeal') => {
    setEditForm({
      id: m.id,
      nature_tab,
      case_number: m.case_number,
      citation: m.citation,
      station: m.station,
      judge: m.judge,
      court_assistant: m.court_assistant ?? '',
      nature: (m.nature as ServiceWeekNature) ?? '',
      activity: m.activity ?? '',
      outcome: m.outcome,
      next_hearing_date: m.next_hearing_date ?? '',
      remarks: m.remarks ?? '',
    });
  };

  const handleApprove = async (id: number, nature_tab: 'uncontested' | 'appeal') => {
    const thunk = nature_tab === 'uncontested' ? approveUncontested : approveAppeal;
    await dispatch(thunk(id));
    // Refresh data
    const station = user?.station ?? undefined;
    dispatch(fetchUncontested({ station }));
    dispatch(fetchAppeals({ station }));
  };

  const handleReject = async (id: number, nature_tab: 'uncontested' | 'appeal', reason: string) => {
    const thunk = nature_tab === 'uncontested' ? rejectUncontested : rejectAppeal;
    await dispatch(thunk({ id, rejection_reason: reason }));
    // Refresh data
    const station = user?.station ?? undefined;
    dispatch(fetchUncontested({ station }));
    dispatch(fetchAppeals({ station }));
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    const updates = {
      case_number: editForm.case_number,
      citation: editForm.citation,
      station: editForm.station,
      judge: editForm.judge,
      court_assistant: editForm.court_assistant,
      nature: editForm.nature || undefined,
      activity: editForm.activity,
      outcome: editForm.outcome,
      next_hearing_date: editForm.outcome === 'Matter Adjourned' ? editForm.next_hearing_date : null,
      remarks: editForm.remarks || null,
    };
    const thunk = editForm.nature_tab === 'uncontested' ? updateUncontested : updateAppeal;
    const result = await dispatch(thunk({ id: editForm.id, updates }));
    setSaving(false);
    if (!result.type.endsWith('/rejected')) {
      setEditForm(null);
      // Refresh data
      const station = user?.station ?? undefined;
      dispatch(fetchUncontested({ station }));
      dispatch(fetchAppeals({ station }));
    }
  };

  const inputStyle: React.CSSProperties = {
    fontSize: 13, padding: '7px 10px', borderRadius: 8,
    border: '0.5px solid #d5d5d3',
    background: 'var(--color-bg-primary,#fff)', color: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, color: '#888', marginBottom: 5,
  };

  const totalUncontested = uncontested.length;
  const totalAppeals = appeals.length;
  const totalConfirmed = [...uncontested, ...appeals].filter((m) => m.outcome === 'Grant Confirmed').length;
  const totalAdjourned = [...uncontested, ...appeals].filter((m) => m.outcome === 'Matter Adjourned').length;

  // Show loading or no station message
  if (!user?.station) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#7A1F1F' }}>No Station Assigned</h2>
        <p style={{ fontSize: 14, color: '#6B7C73', marginBottom: 16 }}>
          Your account has not been assigned a court station. Please contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Service Week Registry</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 14, color: '#888', margin: '4px 0 0' }}>
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <span style={{
              fontSize: 12, color: '#1C3829', background: '#EAF3DE',
              borderRadius: 99, padding: '2px 10px', fontWeight: 600, marginTop: 4,
            }}>
              {user.station}
            </span>
            {loading && <span style={{ fontSize: 12, color: '#185FA5', marginTop: 4 }}>Loading…</span>}
          </div>
        </div>
        {error && (
          <button
            onClick={() => dispatch(clearMatterError())}
            style={{ background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}
          >
            {error} ✕
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <StatCard label="Total Uncontested" value={totalUncontested} />
        <StatCard label="Total Appeals" value={totalAppeals} />
        <StatCard label="Grants Confirmed" value={totalConfirmed} color="#3B6D11" />
        <StatCard label="Adjournments" value={totalAdjourned} color="#854F0B" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #e5e5e3', marginBottom: '1.5rem' }}>
        {(['uncontested', 'appeals'] as const).map((id) => {
          const count = id === 'uncontested' ? uncontested.length : appeals.length;
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: '10px 20px', fontSize: 14, cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: activeTab === id ? '2px solid #111' : '2px solid transparent',
              fontWeight: activeTab === id ? 600 : 400,
              color: activeTab === id ? '#111' : '#888',
              marginBottom: -1, textTransform: 'capitalize',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {id === 'appeals' ? 'Succession Appeals' : id}
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                background: activeTab === id ? '#111' : '#E8E5DE',
                color: activeTab === id ? '#fff' : '#888',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case no, citation, judge, assistant…"
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
          <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)} style={inputStyle}>
            <option value="">All outcomes</option>
            {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading matters…</div>
        ) : (
          <MatterTable
            rows={activeTab === 'uncontested' ? filteredU : filteredA}
            nature_tab={activeTab === 'uncontested' ? 'uncontested' : 'appeal'}
            onEdit={openEdit}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>

      {/* Edit Modal */}
      {editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: '1.25rem' }}>Edit Matter</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Case Number</label>
                <input style={{ ...inputStyle, width: '100%' }} value={editForm.case_number}
                  onChange={(e) => setEditForm({ ...editForm, case_number: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Citation</label>
                <input style={{ ...inputStyle, width: '100%' }} value={editForm.citation}
                  onChange={(e) => setEditForm({ ...editForm, citation: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Station</label>
                <input style={{ ...inputStyle, width: '100%' }} value={editForm.station}
                  onChange={(e) => setEditForm({ ...editForm, station: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Judge</label>
                <input style={{ ...inputStyle, width: '100%' }} value={editForm.judge}
                  onChange={(e) => setEditForm({ ...editForm, judge: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Court Assistant</label>
              <input style={{ ...inputStyle, width: '100%' }} value={editForm.court_assistant}
                onChange={(e) => setEditForm({ ...editForm, court_assistant: e.target.value })} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Nature of Matter</label>
              <select style={{ ...inputStyle, width: '100%' }} value={editForm.nature}
                onChange={(e) => setEditForm({ ...editForm, nature: e.target.value as ServiceWeekNature })}>
                <option value="">Select nature…</option>
                {SERVICE_WEEK_NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Activity</label>
              <input style={{ ...inputStyle, width: '100%' }} value={editForm.activity}
                onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Outcome</label>
              <select style={{ ...inputStyle, width: '100%' }} value={editForm.outcome}
                onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value as MatterOutcome, next_hearing_date: '' })}>
                {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {editForm.outcome === 'Matter Adjourned' && (
              <div style={{ marginBottom: 12, padding: 12, background: '#FFF8E1', border: '1px solid #FFC107', borderRadius: 8 }}>
                <label style={{ ...labelStyle, color: '#856404', fontWeight: 700 }}>Next Hearing Date (Required)</label>
                <input type="date" style={{ ...inputStyle, width: '100%' }} value={editForm.next_hearing_date}
                  onChange={(e) => setEditForm({ ...editForm, next_hearing_date: e.target.value })} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Remarks</label>
              <textarea
                style={{ ...inputStyle, width: '100%', height: 70, resize: 'vertical' } as React.CSSProperties}
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setEditForm(null)} style={{ ...inputStyle, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ ...inputStyle, background: '#111', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Update Matter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrMatterEntry;