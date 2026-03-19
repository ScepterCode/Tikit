import React, { useState, useEffect } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/FastAPIAuthContext';

interface FormData {
  phoneNumber: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading: authLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [formData, setFormData] = useState<FormData>({ phoneNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleFieldError = (msg: string) => {
    const fe: { [key: string]: string } = {};
    if (msg.toLowerCase().includes('phone number')) fe.phoneNumber = msg;
    else if (msg.toLowerCase().includes('password')) fe.password = msg;
    else if (msg.toLowerCase().includes('invalid credentials')) {
      fe.phoneNumber = 'Invalid phone number or password';
      fe.password = 'Invalid phone number or password';
    }
    setFieldErrors(fe);
  };

  const validateForm = (): string | null => {
    if (!formData.phoneNumber.trim()) return 'Phone number is required';
    if (!formData.password) return 'Password is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const result = await signIn(formData.phoneNumber.trim(), formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please try again.';
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
            <p style={s.brandTagline}>Nigeria's premier event ticketing platform</p>
            <div style={s.brandFeatures}>
              {[
                { icon: '🎫', text: 'Buy & manage event tickets' },
                { icon: '💸', text: 'Spray money at live events' },
                { icon: '👥', text: 'Group buys & referral rewards' },
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
            <h2 style={s.cardTitle}>Welcome back</h2>
            <p style={s.cardSub}>Sign in to continue to your account</p>
          </div>

          {error && (
            <div style={s.errorBox}>
              <span style={s.errorIcon}>⚠️</span>
              <div>
                <p style={s.errorTitle}>Login Error</p>
                <p style={s.errorMsg}>{error}</p>
                {error.toLowerCase().includes('invalid credentials') && (
                  <p style={s.errorHint}>
                    Check your details or{' '}
                    <Link to="/auth/register" style={s.errorLink}>create an account</Link>
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>

            <div style={s.field}>
              <label style={s.label}>Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                style={{ ...s.input, ...(fieldErrors.phoneNumber ? s.inputErr : {}) }}
                placeholder="+234 800 000 0000"
                autoComplete="username"
                required
              />
              <p style={s.hint}>Use the number you registered with</p>
              {fieldErrors.phoneNumber && <p style={s.fieldErr}>{fieldErrors.phoneNumber}</p>}
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.pwWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  style={{ ...s.pwInput, ...(fieldErrors.password ? s.inputErr : {}) }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
              {fieldErrors.password && <p style={s.fieldErr}>{fieldErrors.password}</p>}
            </div>

            <button type="submit" style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>

          <div style={s.footer}>
            <p style={s.footerText}>
              Don't have an account?{' '}
              <Link to="/auth/register" style={s.footerLink}>Create one</Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  fullCenter: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#f5f6fa' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: '14px', color: '#9ca3af', margin: 0 },

  // Brand panel
  brand: { flex: '0 0 45%', position: 'relative' as const, background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '60px 48px' },
  brandOrb1: { position: 'absolute' as const, width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(167,139,250,0.12)', top: '-80px', right: '-60px', pointerEvents: 'none' as const },
  brandOrb2: { position: 'absolute' as const, width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', bottom: '-80px', left: '-40px', pointerEvents: 'none' as const },
  brandInner: { position: 'relative' as const, zIndex: 1 },
  brandLogo: { fontSize: '56px', marginBottom: '12px', lineHeight: 1 },
  brandName: { fontSize: '36px', fontWeight: '800', color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px' },
  brandTagline: { fontSize: '16px', color: 'rgba(255,255,255,0.55)', margin: '0 0 40px', lineHeight: 1.5 },
  brandFeatures: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  brandFeatureRow: { display: 'flex', alignItems: 'center', gap: '14px' },
  brandFeatureIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
  brandFeatureText: { fontSize: '14px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // Form panel
  formPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f6fa', padding: '32px 24px' },
  card: { width: '100%', maxWidth: '420px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f3f5', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', padding: '40px' },
  cardMobile: { borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },

  mobileHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', justifyContent: 'center' },
  mobileLogo: { fontSize: '28px', lineHeight: 1 },
  mobileBrand: { fontSize: '22px', fontWeight: '800', color: '#4f46e5' },

  cardHeader: { marginBottom: '28px' },
  cardTitle: { fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 6px' },
  cardSub: { fontSize: '14px', color: '#9ca3af', margin: 0 },

  errorBox: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' },
  errorIcon: { fontSize: '18px', flexShrink: 0, marginTop: '1px' },
  errorTitle: { fontSize: '14px', fontWeight: '700', color: '#991b1b', margin: '0 0 2px' },
  errorMsg: { fontSize: '13px', color: '#991b1b', margin: '0 0 4px', lineHeight: 1.4 },
  errorHint: { fontSize: '12px', color: '#7f1d1d', fontStyle: 'italic', margin: 0 },
  errorLink: { color: '#dc2626', textDecoration: 'underline', fontWeight: '500' },

  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '12px 14px', fontSize: '15px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%' },
  inputErr: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  fieldErr: { fontSize: '12px', color: '#ef4444', margin: 0 },
  hint: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  pwWrap: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
  pwInput: { padding: '12px 44px 12px 14px', fontSize: '15px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const },
  eyeBtn: { position: 'absolute' as const, right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#9ca3af', borderRadius: '6px' },

  submitBtn: { width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', marginTop: '4px' },
  submitBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },

  footer: { marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f3f5', textAlign: 'center' as const },
  footerText: { fontSize: '13.5px', color: '#9ca3af', margin: 0 },
  footerLink: { color: '#4f46e5', textDecoration: 'none', fontWeight: '700' },
};
