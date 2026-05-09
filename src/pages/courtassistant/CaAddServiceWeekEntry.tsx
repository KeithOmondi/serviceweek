import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createMatter, clearMatterError } from '../../store/slices/matterSlice';
import type {
  CreateServiceWeekMatterDTO,
  ServiceWeekNature,
  MatterOutcome,
} from '../../types/matter.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SW_NATURES: ServiceWeekNature[] = [
  'Uncontested Confirmation',
  'Application for Rectification',
  'Succession Appeal',
  'Adoption of Succession Mediation File',
];

const OUTCOMES: MatterOutcome[] = [
  'Grant Confirmed',
  'Matter Adjourned',
  'Withdrawn',
  'Dismissed',
];

const TABLE_OPTIONS = [
  { value: 'uncontested', label: 'Uncontested Matter' },
  { value: 'appeal',      label: 'P&A Appeal'         },
] as const;

// ─── Design tokens ──────────────────────────────────────────────────────────

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
  successBg:   '#EBF5EC',
  successText: '#1A4D2E',
  successBorder:'#A8D5B0',
};

const fieldBase: React.CSSProperties = {
  fontSize: 13,
  padding: '10px 13px',
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.white,
  color: C.text,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const disabledFieldBase: React.CSSProperties = {
  ...fieldBase,
  background: C.offWhite,
  color: C.textMuted,
  cursor: 'not-allowed',
};

const selectBase: React.CSSProperties = {
  ...fieldBase,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7C73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 13px center',
  paddingRight: 36,
  cursor: 'pointer',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: C.textMuted,
    display: 'flex', alignItems: 'center', gap: 4,
  }}>
    {children}
    {required && <span style={{ color: '#E24B4A', fontSize: 10 }}>*</span>}
  </span>
);

const FieldGroup = ({
  label, hint, required, children,
}: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <Label required={required}>{label}</Label>
    {children}
    {hint && <span style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>{hint}</span>}
  </div>
);

const SectionCard = ({
  title, badge, children,
}: {
  title: string; badge?: string; children: React.ReactNode;
}) => (
  <div style={{
    background: C.white, border: `1px solid ${C.border}`,
    borderRadius: 12, overflow: 'hidden', marginBottom: '1.25rem',
    boxShadow: '0 1px 4px rgba(28,56,41,0.06)',
  }}>
    <div style={{
      padding: '13px 18px', borderBottom: `1px solid ${C.border}`,
      background: C.offWhite, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{
        width: 3, height: 14, borderRadius: 99,
        background: C.gold, flexShrink: 0, display: 'inline-block',
      }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: C.green, letterSpacing: '0.02em' }}>
        {title}
      </span>
      {badge && <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400 }}>{badge}</span>}
    </div>
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {children}
    </div>
  </div>
);

// ─── Table toggle ───────────────────────────────────────────────────────────

const TableToggle = ({
  value, onChange,
}: {
  value: 'uncontested' | 'appeal' | '';
  onChange: (v: 'uncontested' | 'appeal') => void;
}) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {TABLE_OPTIONS.map(({ value: v, label }) => {
      const active = value === v;
      return (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          style={{
            fontSize: 13, fontWeight: active ? 700 : 400,
            padding: '9px 20px', borderRadius: 8,
            border: active ? `1.5px solid ${C.green}` : `1px solid ${C.border}`,
            background: active ? C.green : C.white,
            color: active ? C.white : C.textMuted,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

// ─── Form state ─────────────────────────────────────────────────────────────

interface FormState {
  table:            'uncontested' | 'appeal' | '';
  station:          string;
  judge:            string;
  hearing_date:     string;
  court_assistant:  string;
  case_number:      string;
  citation:         string;
  nature:           ServiceWeekNature | '';
  activity:         string;
  outcome:          MatterOutcome | '';
  next_hearing_date: string;
  remarks:          string;
}

// ─── Component ──────────────────────────────────────────────────────────────

const CaAddServiceWeekEntry = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector((s) => s.matters.error);
  const saving = useAppSelector((s) => s.matters.loading.mutating);
  const { user } = useAppSelector((s) => s.auth);

  const [success, setSuccess] = useState(false);
  
  // Get the court assistant's assigned station from their profile
  const assignedStation = user?.station || '';
  const userName = user?.name || '';

  // Initialize form directly with values from user profile
  const [form, setForm] = useState<FormState>({
    table: '',
    station: assignedStation,
    judge: '',
    hearing_date: '',
    court_assistant: userName,
    case_number: '',
    citation: '',
    nature: '',
    activity: '',
    outcome: '',
    next_hearing_date: '',
    remarks: '',
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSuccess(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid =
    form.table &&
    form.station &&
    form.judge.trim() &&
    form.hearing_date &&
    form.court_assistant.trim() &&
    form.case_number.trim() &&
    form.citation.trim() &&
    form.nature &&
    form.activity.trim() &&
    form.outcome &&
    (form.outcome !== 'Matter Adjourned' || form.next_hearing_date);

  const handleSave = async () => {
    if (!isValid) return;

    const payload: CreateServiceWeekMatterDTO = {
      session_type:     'service_week',
      table:            form.table as 'uncontested' | 'appeal',
      station:          form.station,
      judge:            form.judge.trim(),
      hearing_date:     form.hearing_date,
      court_assistant:  form.court_assistant.trim(),
      case_number:      form.case_number.trim(),
      citation:         form.citation.trim(),
      nature:           form.nature as ServiceWeekNature,
      activity:         form.activity.trim(),
      outcome:          form.outcome as MatterOutcome,
      next_hearing_date: form.outcome === 'Matter Adjourned' ? form.next_hearing_date : null,
      remarks:          form.remarks.trim() || null,
    };

    const result = await dispatch(createMatter(payload));
    if (!result.type.endsWith('/rejected')) {
      setSuccess(true);
      // Reset form but keep station and court assistant
      setForm({
        table: '',
        station: assignedStation,
        judge: '',
        hearing_date: '',
        court_assistant: userName,
        case_number: '',
        citation: '',
        nature: '',
        activity: '',
        outcome: '',
        next_hearing_date: '',
        remarks: '',
      });
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClear = () => {
    setForm({
      table: '',
      station: assignedStation,
      judge: '',
      hearing_date: '',
      court_assistant: userName,
      case_number: '',
      citation: '',
      nature: '',
      activity: '',
      outcome: '',
      next_hearing_date: '',
      remarks: '',
    });
    setSuccess(false);
    dispatch(clearMatterError());
  };

  // Show warning if user has no assigned station
  if (!assignedStation) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', color: C.text, padding: '2rem' }}>
        <div style={{
          background: C.errorBg,
          border: `1px solid ${C.errorBorder}`,
          borderRadius: 12,
          padding: '1.5rem',
          textAlign: 'center',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: C.errorText }}>
            No Station Assigned
          </h2>
          <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 16 }}>
            Your account has not been assigned a court station. Please contact the Deputy Registrar to assign you a station.
          </p>
          <button
            onClick={() => navigate('/c/entries')}
            style={{
              padding: '10px 20px',
              background: C.green,
              color: C.white,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: C.text }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '1.75rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <button
              onClick={() => navigate('/c/entries')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: C.textMuted, padding: 0,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              ← Back to Entries
            </button>
            <span style={{ fontSize: 12, color: C.border }}>/</span>
            <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Service Week</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.green, fontFamily: 'serif' }}>
  Service Week Entry
</h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: '4px 0 0', fontFamily: 'serif' }}>
            Record the outcome of a matter heard during Succession Week
          </p>
        </div>

        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: C.gold, textAlign: 'right', lineHeight: 1.6,
          textTransform: 'uppercase',
        }}>
          <div>High Court of Kenya</div>
          <div style={{ color: C.textMuted, fontWeight: 400, letterSpacing: '0.04em' }}>
            Succession Week 2026
          </div>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{
          fontSize: 13, color: C.successText, background: C.successBg,
          border: `1px solid ${C.successBorder}`, padding: '11px 16px',
          borderRadius: 8, marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>✓</span>
          Matter submitted successfully — pending DR approval.
        </div>
      )}
      
      {/* Error banner */}
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
              color: C.errorText, fontWeight: 700, fontSize: 16, padding: 0, lineHeight: 1,
            }}
          >×</button>
        </div>
      )}

      <div style={{ maxWidth: 720 }}>

        {/* Matter Type */}
        <SectionCard title="Matter Type">
          <FieldGroup label="Type of Matter" required>
            <TableToggle
              value={form.table}
              onChange={(v) => set('table', v)}
            />
          </FieldGroup>
        </SectionCard>

        {/* Case Details */}
        <SectionCard title="Case Details">

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FieldGroup 
              label="Court Station" 
              required
              hint="This is your assigned station - cannot be changed"
            >
              <input
                type="text"
                value={form.station}
                disabled
                style={disabledFieldBase}
              />
            </FieldGroup>

            <FieldGroup label="Case Number" required>
              <input
                type="text"
                value={form.case_number}
                onChange={(e) => set('case_number', e.target.value)}
                placeholder="e.g. SUCC/E&A/001/2025"
                style={fieldBase}
              />
            </FieldGroup>
          </div>

          <FieldGroup
            label="Citation"
            required
            hint="e.g. In the Estate of John Kamau Waweru (Deceased)"
          >
            <textarea
              value={form.citation}
              onChange={(e) => set('citation', e.target.value)}
              placeholder="In the Estate of [Full Name of Deceased]"
              style={{ ...fieldBase, resize: 'vertical', minHeight: 76 }}
            />
          </FieldGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FieldGroup label="Nature of Matter" required>
              <select
                value={form.nature}
                onChange={(e) => set('nature', e.target.value as ServiceWeekNature)}
                style={selectBase}
              >
                <option value="">Select nature…</option>
                {SW_NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </FieldGroup>

            <FieldGroup label="Date Heard" required>
              <input
                type="date"
                value={form.hearing_date}
                onChange={(e) => set('hearing_date', e.target.value)}
                style={fieldBase}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Activity" required hint="What the matter came up for">
            <input
              type="text"
              value={form.activity}
              onChange={(e) => set('activity', e.target.value)}
              placeholder="e.g. Confirmation of Grant, Mention, Ruling…"
              style={fieldBase}
            />
          </FieldGroup>

        </SectionCard>

        {/* Court Details */}
        <SectionCard title="Court Details">

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FieldGroup label="Presiding Judge" required>
              <input
                type="text"
                value={form.judge}
                onChange={(e) => set('judge', e.target.value)}
                placeholder="e.g. Hon. Justice Odunga"
                style={fieldBase}
              />
            </FieldGroup>

            <FieldGroup label="Court Assistant" required>
              <input
                type="text"
                value={form.court_assistant}
                onChange={(e) => set('court_assistant', e.target.value)}
                placeholder="Your name"
                style={fieldBase}
              />
            </FieldGroup>
          </div>

        </SectionCard>

        {/* Outcome */}
        <SectionCard title="Outcome">

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FieldGroup label="Outcome" required>
              <select
                value={form.outcome}
                onChange={(e) => {
                  set('outcome', e.target.value as MatterOutcome);
                  set('next_hearing_date', '');
                }}
                style={selectBase}
              >
                <option value="">Select outcome…</option>
                {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </FieldGroup>

            {form.outcome === 'Matter Adjourned' && (
              <FieldGroup label="Next Hearing Date" required>
                <input
                  type="date"
                  value={form.next_hearing_date}
                  onChange={(e) => set('next_hearing_date', e.target.value)}
                  style={fieldBase}
                />
              </FieldGroup>
            )}
          </div>

        </SectionCard>

        {/* Remarks */}
        <SectionCard title="Remarks" badge="— optional">
          <textarea
            value={form.remarks}
            onChange={(e) => set('remarks', e.target.value)}
            placeholder="Any observations or notes about this matter…"
            style={{ ...fieldBase, resize: 'vertical', minHeight: 96 }}
          />
        </SectionCard>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: '0.25rem' }}>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            style={{
              fontSize: 13, fontWeight: 700,
              padding: '11px 24px', borderRadius: 8, border: 'none',
              background: !isValid || saving
                ? '#C5C8C2'
                : `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
              color: C.white,
              cursor: !isValid || saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              letterSpacing: '0.03em',
              boxShadow: !isValid || saving ? 'none' : '0 2px 8px rgba(28,56,41,0.25)',
            }}
          >
            {saving ? (
              <>
                <span style={{
                  display: 'inline-block', width: 13, height: 13,
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: C.white, borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Submitting…
              </>
            ) : (
              <><span style={{ fontSize: 15 }}>⊕</span> Submit Entry</>
            )}
          </button>

          <button
            onClick={handleClear}
            style={{
              fontSize: 13, fontWeight: 500,
              padding: '11px 18px', borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.white, color: C.textMuted, cursor: 'pointer',
            }}
          >
            Clear
          </button>

          <button
            onClick={() => navigate('/c/entries')}
            style={{
              fontSize: 13, padding: '11px 18px', borderRadius: 8,
              border: 'none', background: 'none',
              color: C.textMuted, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        input:focus, select:focus, textarea:focus {
          border-color: ${C.gold} !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important;
        }
      `}</style>
    </div>
  );
};

export default CaAddServiceWeekEntry;