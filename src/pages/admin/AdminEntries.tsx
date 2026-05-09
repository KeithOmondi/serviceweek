import { useEffect, useState, useMemo } from 'react';
import {
  fetchUncontested,
  fetchAppeals,
  fetchRRIMatters,
  fetchSummary,
  fetchOutcomeBreakdown,
  fetchStationBreakdown,
  fetchPerStationBreakdown,
  fetchJudgeDailyReturn,
  fetchJudgePeriodSummary,
  updateUncontested,
  updateAppeal,
  updateRRIMatter,
  approveUncontested,
  approveAppeal,
  approveRRIMatter,
  rejectUncontested,
  rejectAppeal,
  rejectRRIMatter,
  clearMatterError,
} from '../../store/slices/matterSlice';
import type {
  Matter,
  MatterOutcome,
  ServiceWeekNature,
  RRINature,
  SessionType,
  OutcomeBreakdown,
  StationBreakdown,
  PerStationBreakdown,
  RRIMatter,
} from '../../types/matter.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

// ─── Types & Constants ───────────────────────────────────────────────────────

type TabId = 'uncontested' | 'appeals' | 'rri' | 'analytics';

interface EditForm {
  id: number;
  type: 'uncontested' | 'appeal' | 'rri';
  case_number: string;
  citation: string;
  station: string;
  judge: string;
  court_assistant: string;
  nature: ServiceWeekNature | RRINature | '';
  activity: string;
  outcome: MatterOutcome;
  next_hearing_date: string;
  remarks: string;
  related_matter_id?: number | null;
}

const OUTCOMES: MatterOutcome[] = ['Grant Confirmed', 'Matter Adjourned', 'Withdrawn', 'Dismissed'];

const SERVICE_WEEK_NATURES: ServiceWeekNature[] = [
  'Uncontested Confirmation',
  'Application for Rectification',
  'Succession Appeal',
  'Adoption of Succession Mediation File',
];

const RRI_NATURES: RRINature[] = [
  'Ruling',
  'Judgment',
  'Mention',
  'Hearing',
  'Directions',
];

const OUTCOME_STYLES: Record<MatterOutcome, { bg: string; color: string }> = {
  'Grant Confirmed':  { bg: '#EAF3DE', color: '#27500A' },
  'Matter Adjourned': { bg: '#FAEEDA', color: '#633806' },
  'Withdrawn':        { bg: '#F1EFE8', color: '#444441' },
  'Dismissed':        { bg: '#FCEBEB', color: '#791F1F' },
};

const OUTCOME_COLORS: Record<MatterOutcome, string> = {
  'Grant Confirmed':  '#3B6D11',
  'Matter Adjourned': '#854F0B',
  'Withdrawn':        '#444441',
  'Dismissed':        '#791F1F',
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#FEF9EC', color: '#92620A', label: 'Pending Review' },
  approved: { bg: '#EBF5EC', color: '#1A4D2E', label: 'Approved' },
  rejected: { bg: '#FDF1F1', color: '#7A1F1F', label: 'Rejected' },
};

const n = (v: string | undefined | null) => Number(v ?? 0);

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

// ─── Table Components ─────────────────────────────────────────────────────────

const UNCONTESTED_COLUMNS = [
  { label: 'Case No.', width: '120px' },
  { label: 'Citation', width: '160px' },
  { label: 'Station', width: '100px' },
  { label: 'Judge', width: '130px' },
  { label: 'Court Asst.', width: '120px' },
  { label: 'Nature', width: '180px' },
  { label: 'Activity', width: '150px' },
  { label: 'Hearing Date', width: '105px' },
  { label: 'Outcome', width: '130px' },
  { label: 'Next Hearing', width: '105px' },
  { label: 'Status', width: '110px' },
  { label: 'Remarks', width: '130px' },
  { label: 'Actions', width: '140px' },
];

const RRI_COLUMNS = [
  { label: 'Case No.', width: '120px' },
  { label: 'Citation', width: '160px' },
  { label: 'Station', width: '100px' },
  { label: 'Judge', width: '130px' },
  { label: 'Court Asst.', width: '120px' },
  { label: 'Nature', width: '100px' },
  { label: 'Activity', width: '150px' },
  { label: 'Related Matter', width: '120px' },
  { label: 'Hearing Date', width: '105px' },
  { label: 'Outcome', width: '130px' },
  { label: 'Next Hearing', width: '105px' },
  { label: 'Status', width: '110px' },
  { label: 'Remarks', width: '130px' },
  { label: 'Actions', width: '140px' },
];

interface MatterTableProps {
  rows: Matter[];
  type: 'uncontested' | 'appeal' | 'rri';
  onEdit: (m: Matter, type: 'uncontested' | 'appeal' | 'rri') => void;
  onApprove?: (id: number, type: string) => void;
  onReject?: (id: number, type: string, reason: string) => void;
}

const MatterTable = ({ rows, type, onEdit, onApprove, onReject }: MatterTableProps) => {
  const columns = type === 'rri' ? RRI_COLUMNS : UNCONTESTED_COLUMNS;
  const [rejectReason, setRejectReason] = useState<{ [key: number]: string }>({});
  const [showRejectModal, setShowRejectModal] = useState<{ [key: number]: boolean }>({});

  const handleReject = (id: number) => {
    if (onReject && rejectReason[id]) {
      onReject(id, type, rejectReason[id]);
      setShowRejectModal({ ...showRejectModal, [id]: false });
      setRejectReason({ ...rejectReason, [id]: '' });
    }
  };

  return (
    <div style={{ overflowX: 'auto', border: '0.5px solid var(--color-border, #e5e5e3)', borderRadius: 12 }}>
      <table style={{ width: '100%', minWidth: 1500, borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-secondary, #f5f5f3)' }}>
            {columns.map(({ label, width }, i) => (
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
              <td colSpan={columns.length} style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                No matters found.
              </td>
            </tr>
          ) : (
            rows.map((m) => (
              <tr key={m.id} style={{ borderBottom: '0.5px solid var(--color-border, #e5e5e3)' }}>
                <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.case_number}</td>
                <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.citation}</td>
                <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.station}</td>
                <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.judge}</td>
                <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#888' }}>{m.court_assistant || '—'}</td>
                <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{m.nature || '—'}</td>
                <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#888', fontSize: 12 }}>{m.activity || '—'}</td>
                {type === 'rri' && (
                  <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#888' }}>
                    {(m as RRIMatter).related_matter_id || '—'}
                  </td>
                )}
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                  {m.hearing_date ? new Date(m.hearing_date).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '11px 14px' }}><OutcomeBadge outcome={m.outcome} /></td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                  {m.next_hearing_date ? new Date(m.next_hearing_date).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '11px 14px' }}><StatusBadge status={m.status} /></td>
                <td style={{ padding: '11px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#888' }}>{m.remarks || '—'}</td>
                <td style={{ padding: '11px 14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onEdit(m, type)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4, borderRadius: 6 }}
                    aria-label="Edit matter"
                  >✎</button>
                  {m.status === 'pending' && onApprove && onReject && (
                    <>
                      <button
                        onClick={() => onApprove(m.id, type)}
                        style={{ background: '#EAF3DE', border: 'none', cursor: 'pointer', color: '#27500A', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}
                      >✓ Approve</button>
                      <button
                        onClick={() => setShowRejectModal({ ...showRejectModal, [m.id]: true })}
                        style={{ background: '#FCEBEB', border: 'none', cursor: 'pointer', color: '#791F1F', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}
                      >✗ Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Reject Modal */}
      {Object.entries(showRejectModal).map(([id, isOpen]) => isOpen && (
        <div key={id} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: 400 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Reject Matter</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Please provide a reason for rejection:</p>
            <textarea
              placeholder="Enter rejection reason..."
              value={rejectReason[Number(id)] || ''}
              onChange={(e) => setRejectReason({ ...rejectReason, [Number(id)]: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd', minHeight: 100, marginBottom: 16, fontSize: 13, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowRejectModal({ ...showRejectModal, [Number(id)]: false })} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleReject(Number(id))} disabled={!rejectReason[Number(id)]} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#791F1F', color: '#fff', cursor: rejectReason[Number(id)] ? 'pointer' : 'not-allowed', opacity: rejectReason[Number(id)] ? 1 : 0.6 }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Analytics Components ─────────────────────────────────────────────────────

const DonutChart = ({ data }: { data: OutcomeBreakdown[] }) => {
  const total = data.reduce((s, d) => s + n(d.count), 0);
  if (total === 0) return <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>No data</p>;

  const r = 70, cx = 90, cy = 90, stroke = 32;
  const circumference = 2 * Math.PI * r;

  const slices = data.reduce<{ d: OutcomeBreakdown; pct: number; dash: number; offset: number }[]>(
    (acc, d) => {
      const pct = n(d.count) / total;
      const dash = pct * circumference;
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      acc.push({ d, pct, dash, offset });
      return acc;
    }, []
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={180} height={180}>
        {slices.map(({ d, dash, offset: off }, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={OUTCOME_COLORS[d.outcome] ?? '#ccc'} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-off + circumference * 0.25}
            style={{ transition: 'stroke-dasharray 0.4s' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={700} fill="#111">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#888">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map(({ d, pct }) => (
          <div key={d.outcome} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: OUTCOME_COLORS[d.outcome], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#555' }}>{d.outcome}</span>
            <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 'auto', paddingLeft: 12 }}>
              {n(d.count)} <span style={{ fontWeight: 400, color: '#aaa' }}>({(pct * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StationBars = ({ data }: { data: StationBreakdown[] }) => {
  const max = Math.max(...data.map((d) => n(d.count)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.length === 0 && <p style={{ color: '#aaa', fontSize: 13 }}>No data</p>}
      {data.map((d) => (
        <div key={d.station} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#555', width: 140, flexShrink: 0, textAlign: 'right' }}>{d.station}</span>
          <div style={{ flex: 1, background: '#f0f0ee', borderRadius: 4, overflow: 'hidden', height: 22 }}>
            <div style={{
              width: `${(n(d.count) / max) * 100}%`, height: '100%',
              background: '#1C3829', borderRadius: 4, transition: 'width 0.4s',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: 11, color: '#fff', paddingRight: 6, fontWeight: 600 }}>{d.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const StationCard = ({ row }: { row: PerStationBreakdown }) => {
  const total = n(row.uncontested_count) + n(row.appeal_count);
  const confirmed = n(row.confirmed);
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  return (
    <div style={{ border: '0.5px solid #e5e5e3', borderRadius: 10, padding: '14px 16px', background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{row.station}</span>
        <span style={{ fontSize: 11, color: '#3B6D11', background: '#EAF3DE', borderRadius: 99, padding: '2px 8px', fontWeight: 500 }}>
          {pct}% confirmed
        </span>
      </div>
      <div style={{ height: 6, background: '#eee', borderRadius: 99, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#3B6D11', borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {(['confirmed', 'adjourned', 'withdrawn', 'dismissed'] as const).map((k) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{row[k]}</div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'capitalize' }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 11, color: '#888' }}>
        <span>Uncontested: <strong>{row.uncontested_count}</strong></span>
        <span>·</span>
        <span>Appeals: <strong>{row.appeal_count}</strong></span>
        <span>·</span>
        <span>Total: <strong>{total}</strong></span>
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const dispatch = useAppDispatch();
  const summary = useAppSelector((s) => s.matters.summary);
  const outcomeBreakdown = useAppSelector((s) => s.matters.outcomeBreakdown);
  const stationBreakdown = useAppSelector((s) => s.matters.stationBreakdown);
  const perStation = useAppSelector((s) => s.matters.perStationBreakdown);
  const loading = useAppSelector((s) => s.matters.loading.analytics);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('service_week');

  useEffect(() => {
    dispatch(fetchOutcomeBreakdown({ session_type: selectedSessionType }));
    dispatch(fetchStationBreakdown(selectedSessionType));
    dispatch(fetchPerStationBreakdown());
    dispatch(fetchJudgeDailyReturn({ date: new Date().toISOString().split('T')[0], session_type: selectedSessionType }));
    dispatch(fetchJudgePeriodSummary({ session_type: selectedSessionType }));
  }, [dispatch, selectedSessionType]);

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '0.5px solid #e5e5e3', borderRadius: 12, padding: '1.25rem',
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, marginBottom: '1rem', color: '#333',
  };

  if (loading && !summary) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading analytics...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Session Type:</label>
        <select
          value={selectedSessionType}
          onChange={(e) => setSelectedSessionType(e.target.value as SessionType)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, cursor: 'pointer' }}
        >
          <option value="service_week">Service Week</option>
          <option value="rri">RRI</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {([
          { label: 'Uncontested', value: summary?.total_uncontested, color: '#185FA5' },
          { label: 'Appeals', value: summary?.total_appeals, color: '#185FA5' },
          { label: 'RRI Matters', value: summary?.total_rri_matters, color: '#185FA5' },
          { label: 'Confirmed', value: summary?.total_confirmed, color: '#3B6D11' },
          { label: 'Adjourned', value: summary?.total_adjourned, color: '#854F0B' },
          { label: 'Withdrawn', value: summary?.total_withdrawn, color: '#444441' },
          { label: 'Dismissed', value: summary?.total_dismissed, color: '#791F1F' },
        ] as const).map(({ label, value, color }) => (
          <div key={label} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={cardStyle}>
          <div style={sectionTitle}>Outcome Distribution</div>
          <DonutChart data={outcomeBreakdown ?? []} />
        </div>
        <div style={cardStyle}>
          <div style={sectionTitle}>Matters by Station</div>
          <StationBars data={stationBreakdown ?? []} />
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>Per-Station Breakdown</div>
        {(perStation ?? []).length === 0
          ? <p style={{ color: '#aaa', fontSize: 13 }}>No station data yet.</p>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {(perStation ?? []).map((row) => <StationCard key={row.station} row={row} />)}
            </div>
          )
        }
      </div>

      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#888', paddingLeft: 4 }}>
        <span>Stations tracked: <strong style={{ color: '#333' }}>{summary?.total_stations ?? '—'}</strong></span>
        <span>Judges sitting: <strong style={{ color: '#333' }}>{summary?.total_judges ?? '—'}</strong></span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminEntries = () => {
  const dispatch = useAppDispatch();

  const uncontested = useAppSelector((s) => s.matters.uncontested);
  const appeals = useAppSelector((s) => s.matters.appeals);
  const rri = useAppSelector((s) => s.matters.rri);
  const error = useAppSelector((s) => s.matters.error);
  const loadingU = useAppSelector((s) => s.matters.loading.uncontested);
  const loadingA = useAppSelector((s) => s.matters.loading.appeals);
  const loadingR = useAppSelector((s) => s.matters.loading.rri);

  const [activeTab, setActiveTab] = useState<TabId>('uncontested');
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const availableStations = useMemo(() => {
    const allMatters = [...uncontested, ...appeals, ...rri];
    const stations = [...new Set(allMatters.map(m => m.station).filter(Boolean))];
    return stations.sort();
  }, [uncontested, appeals, rri]);

  useEffect(() => {
    dispatch(fetchUncontested());
    dispatch(fetchAppeals());
    dispatch(fetchRRIMatters());
    dispatch(fetchSummary());
  }, [dispatch]);

  const filterMatters = (list: Matter[]) =>
    list.filter((m) => {
      const matchesSearch = !search ||
        `${m.case_number} ${m.citation} ${m.judge} ${m.court_assistant}`.toLowerCase()
          .includes(search.toLowerCase());
      const matchesOutcome = !filterOutcome || m.outcome === filterOutcome;
      const matchesStation = !filterStation || m.station === filterStation;
      return matchesSearch && matchesOutcome && matchesStation;
    });

  const filteredU = filterMatters(uncontested);
  const filteredA = filterMatters(appeals);
  const filteredR = filterMatters(rri);
  const loading = activeTab === 'uncontested' ? loadingU : activeTab === 'appeals' ? loadingA : loadingR;

  const openEdit = (m: Matter, type: 'uncontested' | 'appeal' | 'rri') => {
    setEditForm({
      id: m.id,
      type,
      case_number: m.case_number,
      citation: m.citation,
      station: m.station,
      judge: m.judge,
      court_assistant: m.court_assistant ?? '',
      nature: m.nature as ServiceWeekNature | RRINature | '',
      activity: m.activity ?? '',
      outcome: m.outcome,
      next_hearing_date: m.next_hearing_date ?? '',
      remarks: m.remarks ?? '',
      related_matter_id: (m as RRIMatter).related_matter_id,
    });
  };

  const handleApprove = async (id: number, type: string) => {
    if (type === 'uncontested') {
      await dispatch(approveUncontested(id));
    } else if (type === 'appeal') {
      await dispatch(approveAppeal(id));
    } else if (type === 'rri') {
      await dispatch(approveRRIMatter(id));
    }
    // Refresh data
    dispatch(fetchUncontested());
    dispatch(fetchAppeals());
    dispatch(fetchRRIMatters());
  };

  const handleReject = async (id: number, type: string, reason: string) => {
    if (type === 'uncontested') {
      await dispatch(rejectUncontested({ id, rejection_reason: reason }));
    } else if (type === 'appeal') {
      await dispatch(rejectAppeal({ id, rejection_reason: reason }));
    } else if (type === 'rri') {
      await dispatch(rejectRRIMatter({ id, rejection_reason: reason }));
    }
    // Refresh data
    dispatch(fetchUncontested());
    dispatch(fetchAppeals());
    dispatch(fetchRRIMatters());
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
      ...(editForm.type === 'rri' && { related_matter_id: editForm.related_matter_id }),
    };
    
    let result;
    if (editForm.type === 'uncontested') {
      result = await dispatch(updateUncontested({ id: editForm.id, updates }));
    } else if (editForm.type === 'appeal') {
      result = await dispatch(updateAppeal({ id: editForm.id, updates }));
    } else {
      result = await dispatch(updateRRIMatter({ id: editForm.id, updates }));
    }
    
    setSaving(false);
    if (!result.type.endsWith('/rejected')) {
      setEditForm(null);
      // Refresh data
      dispatch(fetchUncontested());
      dispatch(fetchAppeals());
      dispatch(fetchRRIMatters());
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
  const totalRRI = rri.length;
  const totalConfirmed = [...uncontested, ...appeals, ...rri].filter(m => m.outcome === 'Grant Confirmed').length;
  const totalAdjourned = [...uncontested, ...appeals, ...rri].filter(m => m.outcome === 'Matter Adjourned').length;

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
            {loading && <span style={{ fontSize: 12, color: '#185FA5', marginTop: 4 }}>Loading matters...</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {error && (
            <button onClick={() => dispatch(clearMatterError())}
              style={{ background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
              Clear Error: {error} ✕
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <StatCard label="Total Uncontested" value={totalUncontested} />
        <StatCard label="Total Appeals" value={totalAppeals} />
        <StatCard label="Total RRI" value={totalRRI} />
        <StatCard label="Grants Confirmed" value={totalConfirmed} color="#3B6D11" />
        <StatCard label="Adjournments" value={totalAdjourned} color="#854F0B" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #e5e5e3', marginBottom: '1.5rem', gap: 8 }}>
        {([
          { id: 'uncontested' as TabId, label: 'Uncontested' },
          { id: 'appeals' as TabId, label: 'Succession Appeals' },
          { id: 'rri' as TabId, label: 'RRI Matters' },
          { id: 'analytics' as TabId, label: 'Analytics' }
        ]).map(({ id, label }) => {
          const count = id === 'uncontested' ? uncontested.length : id === 'appeals' ? appeals.length : id === 'rri' ? rri.length : 0;
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: '10px 20px', fontSize: 14, cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: activeTab === id ? '2px solid #111' : '2px solid transparent',
              fontWeight: activeTab === id ? 600 : 400,
              color: activeTab === id ? '#111' : '#888', marginBottom: -1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {label}
              {id !== 'analytics' && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                  background: activeTab === id ? '#111' : '#E8E5DE',
                  color: activeTab === id ? '#fff' : '#888',
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab !== 'analytics' ? (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search case no, citation, judge, assistant..."
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            />
            <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)} style={inputStyle}>
              <option value="">All outcomes</option>
              {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {availableStations.length > 0 && (
              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                style={{ ...inputStyle, minWidth: 150 }}
              >
                <option value="">All Stations ({uncontested.length + appeals.length + rri.length})</option>
                {availableStations.map((station) => {
                  const stationCount = [...uncontested, ...appeals, ...rri].filter(m => m.station === station).length;
                  return (
                    <option key={station} value={station}>
                      {station} ({stationCount})
                    </option>
                  );
                })}
              </select>
            )}
            {filterStation && (
              <button onClick={() => setFilterStation('')} style={{ ...inputStyle, background: '#f0f0ee', cursor: 'pointer' }}>
                Clear Filter ✕
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading matters...</div>
          ) : (
            <MatterTable
              rows={activeTab === 'uncontested' ? filteredU : activeTab === 'appeals' ? filteredA : filteredR}
              type={activeTab as 'uncontested' | 'appeal' | 'rri'}
              onEdit={openEdit}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </div>
      ) : (
        <AnalyticsDashboard />
      )}

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
              <select style={{ ...inputStyle, width: '100%' }} value={editForm.nature as string}
                onChange={(e) => setEditForm({ ...editForm, nature: e.target.value as ServiceWeekNature | RRINature | '' })}>
                <option value="">Select nature...</option>
                {editForm.type !== 'rri'
                  ? SERVICE_WEEK_NATURES.map((n) => <option key={n} value={n}>{n}</option>)
                  : RRI_NATURES.map((n) => <option key={n} value={n}>{n}</option>)
                }
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Activity</label>
              <input style={{ ...inputStyle, width: '100%' }} value={editForm.activity}
                onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })} />
            </div>

            {editForm.type === 'rri' && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Related Matter ID</label>
                <input style={{ ...inputStyle, width: '100%' }} type="number" value={editForm.related_matter_id ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, related_matter_id: e.target.value ? Number(e.target.value) : null })} />
              </div>
            )}

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
                {saving ? 'Saving...' : 'Update Matter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEntries;