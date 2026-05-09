import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createMatter } from '../../store/slices/matterSlice';
import { fetchCourts } from '../../store/slices/courtSlice'; // Import fetchCourts
import type { 
  ServiceWeekNature, 
  MatterOutcome, 
  CreateServiceWeekMatterDTO 
} from '../../types/matter.types';

// ─── Constants ────────────────────────────────────────────────────────────────

// STATIONS is removed as we now fetch from Redux

const SERVICE_WEEK_NATURES: ServiceWeekNature[] = [
  'Uncontested Confirmation',
  'Application for Rectification',
  'Succession Appeal',
  'Adoption of Succession Mediation File',
];

const OUTCOMES: MatterOutcome[] = [
  'Grant Confirmed', 
  'Matter Adjourned', 
  'Withdrawn', 
  'Dismissed'
];

const C = {
  green: '#1C3829',
  gold: '#C9A84C',
  amber: '#FFF8E1',
  amberBorder: '#FFC107',
  textMuted: '#6B7C73',
  border: '#D9D6CC',
  white: '#FFFFFF',
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  fontSize: 14,
  padding: '12px',
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  width: '100%',
  boxSizing: 'border-box',
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: '1.5rem', overflow: 'hidden' }}>
    <div style={{ padding: '12px 18px', background: '#F8F9F8', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.green }}>
      {title}
    </div>
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>{children}</div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const AddServiceWeekEntry = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Selectors
  const saving = useAppSelector((s) => s.matters.loading.mutating);
  const { courts, loading: loadingCourts } = useAppSelector((s) => s.courts);

  const [form, setForm] = useState({
    station: '',
    judge: '',
    court_assistant: '',
    case_number: '',
    citation: '',
    nature: '' as ServiceWeekNature | '',
    activity: '',
    outcome: '' as MatterOutcome | '',
    next_hearing_date: '',
    remarks: '',
  });

  // Fetch courts on mount
  useEffect(() => {
    if (courts.length === 0) {
      dispatch(fetchCourts());
    }
  }, [dispatch, courts.length]);

  const isValid = 
    form.station && 
    form.judge && 
    form.case_number && 
    form.nature &&
    form.outcome && 
    (form.outcome !== 'Matter Adjourned' || form.next_hearing_date);

  const handleSave = async () => {
    if (!isValid) return;

    const targetTable: 'uncontested' | 'appeal' = 
      form.nature === 'Succession Appeal' ? 'appeal' : 'uncontested';

    const payload: CreateServiceWeekMatterDTO = {
      session_type: 'service_week',
      table: targetTable,
      station: form.station,
      judge: form.judge,
      hearing_date: new Date().toISOString(),
      court_assistant: form.court_assistant,
      case_number: form.case_number,
      citation: form.citation,
      nature: form.nature as ServiceWeekNature,
      activity: form.activity,
      outcome: form.outcome as MatterOutcome,
      next_hearing_date: form.next_hearing_date || null,
      remarks: form.remarks || null,
    };

    const result = await dispatch(createMatter(payload));
    
    if (createMatter.fulfilled.match(result)) {
      setForm(prev => ({ 
        ...prev, 
        case_number: '', 
        citation: '',
        nature: '' as ServiceWeekNature | '', 
        activity: '', 
        outcome: '' as MatterOutcome | '', 
        next_hearing_date: '', 
        remarks: '' 
      }));
      alert("Service Week entry saved successfully.");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'system-ui' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: C.green, marginBottom: '5px' }}>Service Week Reporting</h1>
        <p style={{ color: C.textMuted }}>Digital Return Form (Succession & Appeals)</p>
      </div>

      <SectionCard title="1. Administrative Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>STATION</label>
            <select 
              style={fieldStyle} 
              value={form.station} 
              onChange={e => setForm({...form, station: e.target.value})}
              disabled={loadingCourts}
            >
              <option value="">{loadingCourts ? 'Fetching Stations...' : 'Select Station...'}</option>
              {courts.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>NAME OF JUDGE</label>
            <input style={fieldStyle} value={form.judge} onChange={e => setForm({...form, judge: e.target.value})} placeholder="Hon. Judge Name" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>COURT ASSISTANT</label>
            <input style={fieldStyle} value={form.court_assistant} onChange={e => setForm({...form, court_assistant: e.target.value})} placeholder="Assistant Name" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Matter Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>CASE NUMBER</label>
            <input style={fieldStyle} value={form.case_number} onChange={e => setForm({...form, case_number: e.target.value})} placeholder="e.g. HC/PROB/123/2023" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>CITATION (PARTIES)</label>
            <input style={fieldStyle} value={form.citation} onChange={e => setForm({...form, citation: e.target.value})} placeholder="In the Estate of..." />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>NATURE OF MATTER</label>
            <select style={fieldStyle} value={form.nature} onChange={e => setForm({...form, nature: e.target.value as ServiceWeekNature})}>
              <option value="">Select Nature...</option>
              {SERVICE_WEEK_NATURES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>ACTIVITY (WHAT WAS HAPPENING)</label>
            <input style={fieldStyle} value={form.activity} onChange={e => setForm({...form, activity: e.target.value})} placeholder="e.g. Consideration of Application" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="3. Outcome & Returns">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>FINAL OUTCOME</label>
            <select 
              style={fieldStyle} 
              value={form.outcome} 
              onChange={e => setForm({...form, outcome: e.target.value as MatterOutcome, next_hearing_date: ''})}
            >
              <option value="">Select Outcome...</option>
              {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {form.outcome === 'Matter Adjourned' && (
            <div style={{ 
              padding: '15px', 
              background: C.amber, 
              border: `1px solid ${C.amberBorder}`, 
              borderRadius: 8,
              animation: 'slideDown 0.3s ease-out'
            }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#856404' }}>NEXT HEARING DATE (REQUIRED)</label>
              <input 
                type="date" 
                style={{ ...fieldStyle, marginTop: '5px' }} 
                value={form.next_hearing_date} 
                onChange={e => setForm({...form, next_hearing_date: e.target.value})} 
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>REMARKS / NOTES</label>
            <textarea style={{ ...fieldStyle, height: 80 }} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
        <button 
          onClick={handleSave}
          disabled={!isValid || saving || loadingCourts}
          style={{ 
            flex: 1, padding: '16px', borderRadius: 8, border: 'none', fontWeight: 700,
            background: (isValid && !loadingCourts) ? C.green : '#D9D6CC', color: 'white', 
            cursor: (isValid && !loadingCourts) ? 'pointer' : 'not-allowed', transition: '0.2s'
          }}
        >
          {saving ? 'SYNCING WITH REGISTRY...' : 'SUBMIT DAILY RETURN'}
        </button>
        <button 
          onClick={() => navigate('/dr/matters')}
          style={{ padding: '16px 24px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'white', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AddServiceWeekEntry;