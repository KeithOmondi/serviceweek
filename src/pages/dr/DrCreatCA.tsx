import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createCourtAssistant, clearAuthError } from '../../store/slices/authSlice';
import { fetchCourts } from '../../store/slices/courtSlice';
import { Search, User, Mail, Landmark, ShieldCheck, ChevronDown } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  green: '#1C3829',
  gold: '#C9A84C',
  textMuted: '#6B7C73',
  border: '#D9D6CC',
  white: '#FFFFFF',
  hover: '#F4F7F5',
};

const DrCreateCA = () => {
  const dispatch = useAppDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redux State
  const { loading, error, message, user: drUser } = useAppSelector((s) => s.auth);
  const { courts, loading: loadingCourts } = useAppSelector((s) => s.courts);

  // Form State
  const [form, setForm] = useState({ name: '', email: '' });
  const [selectedStation, setSelectedStation] = useState(drUser?.station ?? '');
  
  // Search State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (courts.length === 0) dispatch(fetchCourts());
    dispatch(clearAuthError());
  }, [dispatch, courts.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter logic
  const filteredCourts = courts.filter((court) =>
    court.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isValid = form.name.trim() && form.email.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    const result = await dispatch(
      createCourtAssistant({
        name: form.name.trim(),
        email: form.email.trim(),
        station: selectedStation || undefined,
      })
    );
    if (createCourtAssistant.fulfilled.match(result)) {
      setForm({ name: '', email: '' });
      setSearchQuery('');
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto', fontFamily: 'system-ui', padding: '0 1rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: C.green, margin: '0 0 6px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
          Onboard Court Assistant
        </h1>
        <p style={{ color: C.textMuted, margin: 0, fontSize: 14 }}>
          Register a clerk for the 2026 Succession Service Week.
        </p>
      </div>

      {message && (
        <div style={{ background: '#EAF3DE', border: `1px solid #B4D98A`, borderRadius: 10, padding: '14px', marginBottom: '1.5rem', fontSize: 14, color: '#27500A' }}>
          ✓ {message}
        </div>
      )}

      {error && (
        <div style={{ background: '#FCEBEB', border: `1px solid #F5B8B8`, borderRadius: 10, padding: '14px', marginBottom: '1.5rem', fontSize: 14, color: '#791F1F' }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        
        {/* Full Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: 12, top: 14, color: C.textMuted }} />
            <input
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 8, border: `1px solid ${C.border}`, boxSizing: 'border-box' }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Samuel Okoth"
            />
          </div>
        </div>

        {/* Email Address */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Work Email</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 12, top: 14, color: C.textMuted }} />
            <input
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 8, border: `1px solid ${C.border}`, boxSizing: 'border-box' }}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="samuel.okoth@court.go.ke"
            />
          </div>
        </div>

        {/* Searchable Station Dropdown */}
        <div style={{ marginBottom: 24, position: 'relative' }} ref={dropdownRef}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
            Assigned Station
          </label>
          
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              width: '100%', padding: '12px 12px 12px 40px', borderRadius: 8, 
              border: `1px solid ${isDropdownOpen ? C.green : C.border}`, 
              boxSizing: 'border-box', cursor: 'pointer', background: C.white,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            <Landmark size={16} style={{ position: 'absolute', left: 12, top: 14, color: C.textMuted }} />
            <span style={{ fontSize: 14, color: selectedStation ? '#000' : '#aaa' }}>
              {selectedStation || "Select a station..."}
            </span>
            <ChevronDown size={16} style={{ color: C.textMuted, transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </div>

          {isDropdownOpen && (
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: C.white, border: `1px solid ${C.border}`, borderRadius: 8,
              marginTop: 4, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden'
            }}>
              <div style={{ padding: '8px', borderBottom: `1px solid ${C.border}`, background: '#f9f9f9' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 8, top: 10, color: '#aaa' }} />
                  <input 
                    autoFocus
                    placeholder="Search stations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {filteredCourts.length > 0 ? (
                  filteredCourts.map((court) => (
                    <div 
                      key={court.id}
                      onClick={() => {
                        setSelectedStation(court.name);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: selectedStation === court.name ? C.hover : 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedStation === court.name ? C.hover : 'transparent')}
                    >
                      {court.name}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', fontSize: 12, color: '#aaa', textAlign: 'center' }}>No stations found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div style={{ display: 'flex', gap: '12px', background: '#F8F9F8', padding: '16px', borderRadius: 12, marginBottom: 24, border: `1px solid ${C.border}` }}>
          <ShieldCheck size={20} style={{ color: C.gold, flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.green }}>Service Week Permissions</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
              User will be restricted to entering <strong>Template E</strong> returns for the assigned station.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid || loading || loadingCourts}
          style={{
            width: '100%', padding: '14px', borderRadius: 8, border: 'none',
            fontWeight: 700, fontSize: 14, background: isValid && !loading ? C.green : '#ccc',
            color: C.white, cursor: isValid && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Processing...' : 'Send Access Invite'}
        </button>
      </div>
    </div>
  );
};

export default DrCreateCA;