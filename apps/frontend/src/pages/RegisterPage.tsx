import React, { useState, useEffect } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/FastAPIAuthContext';
import { nigerianStates } from '../data/nigerianStates';

type UserRole = 'attendee' | 'organizer';

interface FormData {
  role: UserRole;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  email: string;
  state: string;
  organizationName: string;
  organizationType: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, loading: authLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [formData, setFormData] = useState<FormData>({
    role: 'attendee',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    state: '',
    organizationName: '',
    organizationType: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.phoneNumber.trim()) return 'Phone number is required';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.state) return 'State is required';
    if (formData.role === 'organizer') {
      if (!formData.organizationName.trim()) return 'Organization name is required';
      if (!formData.organizationType) return 'Organization type is required';
    }
    return null;
  };

  const handleFieldError = (msg: string) => {
    const fe: { [key: string]: string } = {};
    if (msg.toLowerCase().includes('phone number')) fe.phoneNumber = msg;
    else if (msg.toLowerCase().includes('email')) fe.email = msg;
    else if (msg.toLowerCase().includes('first name')) fe.firstName = msg;
    else if (msg.toLowerCase().includes('last name')) fe.lastName = msg;
    setFieldErrors(fe);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const result = await signUp({
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        state: formData.state,
        role: formData.role,
        organizationName: formData.role === 'organizer' ? formData.organizationName.trim() : undefined,
      });
      if (result.success) {
        navigate('/dashboard');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      handleFieldError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (authLoading) {
    return (
      <div style={s.fullCenter}>
        <div style={s.spinner} />
        <p style={s.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* ── Left brand panel ── */}
      {!isMobile && (
        <div style={s.brand}>
          <div style={s.brandOrb1} />
          <div style={s.brandOrb2} />
          <div style={s.brandInner}>
            <div style={s.brandLogo}>🎵</div>
            <h1 style={s.brandName}>Grooovy</h1>
            <p style={s.brandTagline}>Join thousands of event enthusiasts across Nigeria</p>
            <div style={s.brandFeatures}>
              {[
                { icon: '🎫', text: 'Buy & manage event tickets' },
                { icon: '💸', text: 'Spray money at live events' },
                { icon: '👥', text: 'Group buys & referral rewards' },
                { icon: '🎪', text: 'Organise & sell your own events' },
              ].map((f) => (
                <div key={f.text} style={s.brandFeatureRow}>
                  <div style={s.brandFeatureIcon}>{f.icon}</div>
                  <span style={s.brandFeatureText}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Right form panel ── */}
      <div style={s.formPanel}>
        <div style={{ ...s.card, ...(isMobile ? s.cardMobile : {}) }}>

          {isMobile && (
            <div style={s.mobileHeader}>
              <span style={s.mobileLogo}>🎵</span>
              <span style={s.mobileBrand}>Grooovy</span>
            </div>
          )}

          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Create your account</h2>
            <p style={s.cardSub}>Fill in the details below to get started</p>
          </div>

          {error && (
            <div style={s.errorBox}>
              <span style={s.errorIcon}>⚠️</span>
              <div>
                <p style={s.errorTitle}>Registration Error</p>
                <p style={s.errorMsg}>{error}</p>
                {error.toLowerCase().includes('phone number already registered') && (
                  <p style={s.errorHint}>
                    Try a different number or{' '}
                    <Link to="/auth/login" style={s.errorLink}>sign in instead</Link>
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>

            {/* Role */}
            <div style={s.section}>
              <p style={s.sectionLabel}>I want to…</p>
              <div style={s.roleGrid}>
                <RoleCard
                  icon="🎉"
                  title="Attend Events"
                  desc="Browse and book tickets"
                  selected={formData.role === 'attendee'}
                  onClick={() => handleInputChange('role', 'attendee')}
                />
                <RoleCard
                  icon="🎪"
                  title="Organise Events"
                  desc="Create and manage events"
                  selected={formData.role === 'organizer'}
                  onClick={() => handleInputChange('role', 'organizer')}
                />
              </div>
            </div>

            {/* Personal info */}
            <div style={s.section}>
              <p style={s.sectionLabel}>Personal Information</p>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    style={{ ...s.input, ...(fieldErrors.firstName ? s.inputErr : {}) }}
                    placeholder="John"
                    required
                  />
                  {fieldErrors.firstName && <p style={s.fieldErr}>{fieldErrors.firstName}</p>}
                </div>
                <div style={s.field}>
                  <label style={s.label}>Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    style={{ ...s.input, ...(fieldErrors.lastName ? s.inputErr : {}) }}
                    placeholder="Doe"
                    required
                  />
                  {fieldErrors.lastName && <p style={s.fieldErr}>{fieldErrors.lastName}</p>}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  style={{ ...s.input, ...(fieldErrors.phoneNumber ? s.inputErr : {}) }}
                  placeholder="+234 800 000 0000"
                  required
                />
                <p style={s.hint}>This will be your login username</p>
                {fieldErrors.phoneNumber && <p style={s.fieldErr}>{fieldErrors.phoneNumber}</p>}
              </div>

              <div style={s.field}>
                <label style={s.label}>Email <span style={s.optional}>(optional)</span></label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{ ...s.input, ...(fieldErrors.email ? s.inputErr : {}) }}
                  placeholder="john@example.com"
                />
                {fieldErrors.email && <p style={s.fieldErr}>{fieldErrors.email}</p>}
              </div>

              <div style={s.field}>
                <label style={s.label}>State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  style={s.select}
                  required
                >
                  <option value="">Select your state</option>
                  {nigerianStates.map((st) => (
                    <option key={st.code} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Security */}
            <div style={s.section}>
              <p style={s.sectionLabel}>Security</p>

              <div style={s.field}>
                <label style={s.label}>Password *</label>
                <div style={s.pwWrap}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    style={s.pwInput}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Confirm Password *</label>
                <div style={s.pwWrap}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    style={s.pwInput}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Organisation (organizer only) */}
            {formData.role === 'organizer' && (
              <div style={s.section}>
                <p style={s.sectionLabel}>Organisation Details</p>

                <div style={s.field}>
                  <label style={s.label}>Organisation Name *</label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    style={s.input}
                    placeholder="Your company or organisation name"
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Organisation Type *</label>
                  <select
                    value={formData.organizationType}
                    onChange={(e) => handleInputChange('organizationType', e.target.value)}
                    style={s.select}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="ngo">NGO</option>
                    <option value="religious">Religious Organisation</option>
                    <option value="educational">Educational Institution</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }}
              disabled={loading}
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>

          </form>

          <div style={s.footer}>
            <p style={s.footerText}>
              Already have an account?{' '}
              <Link to="/auth/login" style={s.footerLink}>Sign in</Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

function RoleCard({ icon, title, desc, selected, onClick }: {
  icon: string; title: string; desc: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...s.roleCard, ...(selected ? s.roleCardActive : {}) }}
    >
      <div style={{ ...s.roleIcon, ...(selected ? s.roleIconActive : {}) }}>{icon}</div>
      <p style={{ ...s.roleTitle, ...(selected ? { color: '#4f46e5' } : {}) }}>{title}</p>
      <p style={s.roleDesc}>{desc}</p>
      {selected && <div style={s.roleCheck}>✓</div>}
    </button>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  fullCenter: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#f5f6fa' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: '14px', color: '#9ca3af', margin: 0 },

  // Brand panel
  brand: { flex: '0 0 40%', position: 'sticky' as const, top: 0, height: '100vh', alignSelf: 'flex-start' as const, background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '60px 48px' },
  brandOrb1: { position: 'absolute' as const, width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(167,139,250,0.12)', top: '-80px', right: '-60px', pointerEvents: 'none' as const },
  brandOrb2: { position: 'absolute' as const, width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', bottom: '-60px', left: '-30px', pointerEvents: 'none' as const },
  brandInner: { position: 'relative' as const, zIndex: 1 },
  brandLogo: { fontSize: '52px', marginBottom: '12px', lineHeight: 1 },
  brandName: { fontSize: '34px', fontWeight: '800', color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px' },
  brandTagline: { fontSize: '15px', color: 'rgba(255,255,255,0.55)', margin: '0 0 36px', lineHeight: 1.5 },
  brandFeatures: { display: 'flex', flexDirection: 'column' as const, gap: '14px' },
  brandFeatureRow: { display: 'flex', alignItems: 'center', gap: '14px' },
  brandFeatureIcon: { width: '38px', height: '38px', borderRadius: '11px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 },
  brandFeatureText: { fontSize: '13.5px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // Form panel
  formPanel: { flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backgroundColor: '#f5f6fa', padding: '40px 24px', overflowY: 'auto' as const },
  card: { width: '100%', maxWidth: '480px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f3f5', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', padding: '40px' },
  cardMobile: { borderRadius: '16px', padding: '28px 20px' },

  mobileHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' },
  mobileLogo: { fontSize: '26px', lineHeight: 1 },
  mobileBrand: { fontSize: '20px', fontWeight: '800', color: '#4f46e5' },

  cardHeader: { marginBottom: '28px' },
  cardTitle: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 6px' },
  cardSub: { fontSize: '13.5px', color: '#9ca3af', margin: 0 },

  errorBox: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' },
  errorIcon: { fontSize: '18px', flexShrink: 0, marginTop: '1px' },
  errorTitle: { fontSize: '14px', fontWeight: '700', color: '#991b1b', margin: '0 0 2px' },
  errorMsg: { fontSize: '13px', color: '#991b1b', margin: '0 0 4px', lineHeight: 1.4 },
  errorHint: { fontSize: '12px', color: '#7f1d1d', fontStyle: 'italic', margin: 0 },
  errorLink: { color: '#dc2626', textDecoration: 'underline', fontWeight: '500' },

  form: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  section: { display: 'flex', flexDirection: 'column' as const, gap: '14px' },
  sectionLabel: { fontSize: '13px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.6px', margin: 0 },

  // Role cards
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  roleCard: { position: 'relative' as const, padding: '18px 14px', border: '1.5px solid #e5e7eb', borderRadius: '16px', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'center' as const, transition: 'all 0.15s ease' },
  roleCardActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff', boxShadow: '0 0 0 3px rgba(79,70,229,0.12)' },
  roleIcon: { fontSize: '28px', lineHeight: 1, marginBottom: '8px', display: 'block' },
  roleIconActive: {},
  roleTitle: { fontSize: '13.5px', fontWeight: '700', color: '#111827', margin: '0 0 3px' },
  roleDesc: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  roleCheck: { position: 'absolute' as const, top: '10px', right: '10px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  optional: { fontSize: '12px', fontWeight: '400', color: '#9ca3af' },
  input: { padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%' },
  inputErr: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  fieldErr: { fontSize: '12px', color: '#ef4444', margin: 0 },
  hint: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  select: { padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', fontFamily: 'inherit', backgroundColor: '#fff', cursor: 'pointer', width: '100%', boxSizing: 'border-box' as const },
  pwWrap: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
  pwInput: { padding: '11px 44px 11px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const },
  eyeBtn: { position: 'absolute' as const, right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#9ca3af', borderRadius: '6px' },

  submitBtn: { width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', marginTop: '4px' },
  submitBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },

  footer: { marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f3f5', textAlign: 'center' as const },
  footerText: { fontSize: '13.5px', color: '#9ca3af', margin: 0 },
  footerLink: { color: '#4f46e5', textDecoration: 'none', fontWeight: '700' },
};
