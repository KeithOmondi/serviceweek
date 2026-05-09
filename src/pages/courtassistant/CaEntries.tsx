import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchUncontested, fetchAppeals, clearMatterError } from '../../store/slices/matterSlice';
import type { UncontestedMatter, AppealMatter, MatterStatus } from '../../types/matter.types';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  green:       '#1C3829',
  greenLight:  '#2E6347',
  gold:        '#C9A84C',
  white:       '#FFFFFF',
  offWhite:    '#F7F6F2',
  border:      '#D9D6CC',
  text:        '#1C2B23',
  textMuted:   '#6B7C73',
  errorBg:     '#FDF1F1',
  errorText:   '#7A1F1F',
  errorBorder: '#E8BABA',
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<MatterStatus, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#FEF9EC', color: '#92620A', label: 'Pending Review' },
  approved: { bg: '#EBF5EC', color: '#1A4D2E', label: 'Approved'       },
  rejected: { bg: '#FDF1F1', color: '#7A1F1F', label: 'Rejected'       },
};

const StatusBadge = ({ status }: { status: MatterStatus }) => {
  const s = STATUS_STYLES[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: s.color, display: 'inline-block', flexShrink: 0,
      }} />
      {s.label}
    </span>
  );
};

// ─── Rejection notice card ────────────────────────────────────────────────────

const RejectionNotice = ({
  reason,
  onResubmit,
}: {
  reason: string;
  onResubmit: () => void;
}) => (
  <div style={{
    marginTop: 6, padding: '8px 12px', borderRadius: 6,
    background: '#FDF1F1', border: '1px solid #E8BABA',
    fontSize: 12, color: '#7A1F1F', lineHeight: 1.5,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
  }}>
    <div>
      <span style={{ fontWeight: 700 }}>Returned: </span>{reason}
    </div>
    <button
      onClick={onResubmit}
      style={{
        flexShrink: 0, fontSize: 11, fontWeight: 700,
        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
        background: '#7A1F1F', color: '#FFFFFF', border: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Correct &amp; Resubmit →
    </button>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ label }: { label: string }) => (
  <div style={{
    padding: '3rem 2rem', textAlign: 'center',
    color: C.textMuted, fontSize: 13,
  }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
    <div style={{ fontWeight: 600, marginBottom: 4 }}>No {label} entries yet</div>
    <div style={{ fontSize: 12 }}>Entries you submit will appear here.</div>
  </div>
);

// ─── Matter row ───────────────────────────────────────────────────────────────

const MatterRow = ({
  m,
  onResubmit,
}: {
  m: UncontestedMatter | AppealMatter;
  onResubmit: (id: number, table: 'uncontested' | 'appeals') => void;
}) => {
  const table = m.session_type === 'service_week'
    ? (m.nature === 'Succession Appeal' || m.nature === 'Adoption of Succession Mediation File'
        ? 'appeals'
        : 'uncontested')
    : 'uncontested';

  return (
    <div style={{
      padding: '14px 18px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
              color: C.green, background: C.offWhite,
              padding: '2px 8px', borderRadius: 4,
            }}>
              {m.case_number}
            </span>
            <span style={{
              fontSize: 11, color: C.textMuted,
              background: '#F0EDE6', padding: '2px 8px', borderRadius: 4,
            }}>
              {m.nature}
            </span>
          </div>

          <div style={{
            fontSize: 13, color: C.text, fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 420,
          }}>
            {m.citation}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 11, color: C.textMuted, marginTop: 4, flexWrap: 'wrap',
          }}>
            <span>📍 {m.station}</span>
            <span>⚖️ {m.judge}</span>
            <span>📅 {new Date(m.hearing_date).toLocaleDateString()}</span>
            {m.outcome && (
              <span style={{ color: C.green, fontWeight: 600 }}>→ {m.outcome}</span>
            )}
            {m.next_hearing_date && (
              <span>Next: {new Date(m.next_hearing_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={m.status} />
        </div>
      </div>

      {m.status === 'rejected' && m.rejection_reason && (
        <RejectionNotice
          reason={m.rejection_reason}
          onResubmit={() => onResubmit(m.id, table)}
        />
      )}
    </div>
  );
};

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabId = 'uncontested' | 'appeals';

const TABS: { id: TabId; label: string }[] = [
  { id: 'uncontested', label: 'Uncontested Matters' },
  { id: 'appeals',     label: 'P&A Appeals'         },
];

// ─── Component ────────────────────────────────────────────────────────────────

const CaEntries = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const uncontested = useAppSelector((s) => s.matters.uncontested);
  const appeals     = useAppSelector((s) => s.matters.appeals);
  const error       = useAppSelector((s) => s.matters.error);
  const loadingU    = useAppSelector((s) => s.matters.loading.uncontested);
  const loadingA    = useAppSelector((s) => s.matters.loading.appeals);

  const [activeTab,    setActiveTab]    = useState<TabId>('uncontested');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<MatterStatus | ''>('');

  useEffect(() => {
    dispatch(fetchUncontested());
    dispatch(fetchAppeals());
  }, [dispatch]);

  const filterList = (list: (UncontestedMatter | AppealMatter)[]) =>
    list.filter((m) => {
      const txt = `${m.case_number} ${m.citation} ${m.station}`.toLowerCase();
      return (
        (!search       || txt.includes(search.toLowerCase())) &&
        (!statusFilter || m.status === statusFilter)
      );
    });

  const filteredU  = filterList(uncontested);
  const filteredA  = filterList(appeals);
  const activeList = activeTab === 'uncontested' ? filteredU : filteredA;
  const loading    = activeTab === 'uncontested' ? loadingU : loadingA;

  const handleResubmit = (id: number, table: 'uncontested' | 'appeals') => {
    navigate(`/c/matters/${table}/${id}/resubmit`);
  };

  const inputStyle: React.CSSProperties = {
    fontSize: 13, padding: '8px 11px', borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.white, color: C.text,
    outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: C.text }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '1.75rem',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.green }}>
            My Entries
          </h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: '4px 0 0' }}>
            Service Week matters you have submitted
          </p>
        </div>

        <button
          onClick={() => navigate('/c/entries')}
          style={{
            fontSize: 13, fontWeight: 700,
            padding: '10px 18px', borderRadius: 8,
            border: 'none',
            background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
            color: C.white, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7,
            boxShadow: '0 2px 8px rgba(28,56,41,0.2)',
          }}
        >
          <span style={{ fontSize: 16 }}>⊕</span> New Entry
        </button>
      </div>

      {/* Analytics Section Removed as requested */}

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          fontSize: 13, color: C.errorText, background: C.errorBg,
          border: `1px solid ${C.errorBorder}`, padding: '11px 16px',
          borderRadius: 8, marginBottom: '1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={() => dispatch(clearMatterError())}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.errorText, fontWeight: 700, fontSize: 16, padding: 0,
            }}
          >×</button>
        </div>
      )}

      {/* ── Tabs + filters ──────────────────────────────────────────────────── */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(28,56,41,0.06)',
      }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
          padding: '0 18px', background: C.offWhite,
        }}>
          <div style={{ display: 'flex' }}>
            {TABS.map(({ id, label }) => {
              const count  = id === 'uncontested' ? uncontested.length : appeals.length;
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    padding: '13px 18px', fontSize: 13, cursor: 'pointer',
                    background: 'none', border: 'none',
                    borderBottom: active ? `2px solid ${C.green}` : '2px solid transparent',
                    fontWeight: active ? 700 : 400,
                    color: active ? C.green : C.textMuted,
                    marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7,
                  }}
                >
                  {label}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                    background: active ? C.green : '#E8E5DE',
                    color: active ? C.white : C.textMuted,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 9, top: '50%',
                transform: 'translateY(-50%)', color: C.textMuted, fontSize: 13,
                pointerEvents: 'none',
              }}>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{ ...inputStyle, paddingLeft: 28, width: 180 }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MatterStatus | '')}
              style={{
                ...inputStyle,
                appearance: 'none',
                paddingRight: 28, cursor: 'pointer',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7C73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 9px center',
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Loading bar */}
        {loading && (
          <div style={{ height: 2, background: '#E6F1FB', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '40%', background: C.green,
              borderRadius: 99, animation: 'slide 1s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* List */}
        {!loading && activeList.length === 0
          ? <EmptyState label={activeTab === 'uncontested' ? 'uncontested matter' : 'appeal'} />
          : activeList.map((m) => (
              <MatterRow
                key={m.id}
                m={m}
                onResubmit={handleResubmit}
              />
            ))
        }
      </div>

      <style>{`
        @keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
        input:focus, select:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important; outline: none; }
      `}</style>
    </div>
  );
};

export default CaEntries;