import { useState } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';

export function AdminLoginPage() {
  const [formData, setFormData] = useState({
    phoneNumber: '+2348012345678', // Pre-fill with admin credentials
    password: 'admin123',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('🔐 Admin login attempt with:', {
      phoneNumber: formData.phoneNumber,
      password: formData.password ? '***' : 'empty'
    });

    try {
      const result = await signIn(formData.phoneNumber, formData.password);
      if (result.success) {
        console.log('✅ Admin login successful, redirecting to dashboard');
        // Redirect to admin dashboard after successful login
        navigate('/admin/dashboard');
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('❌ Admin login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.background}>
        <div style={styles.backgroundPattern}></div>
      </div>

      {/* Login Card */}
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <span style={styles.logoIcon}>🛡️</span>
            <h1 style={styles.logoText}>Tikit Admin</h1>
          </div>
          <p style={styles.subtitle}>Administrative Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
              Use: <strong>+2348012345678</strong> (admin credentials)
            </div>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(error ? styles.inputError : {})
              }}
              placeholder="+234XXXXXXXXXX or 0XXXXXXXXXX"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
              Use: <strong>admin123</strong> (admin credentials)
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(error ? styles.inputError : {})
              }}
              placeholder="Enter your admin password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitButton,
              ...(isLoading ? styles.submitButtonDisabled : {})
            }}
          >
            {isLoading ? (
              <>
                <span style={styles.spinner}></span>
                Authenticating...
              </>
            ) : (
              <>
                <span style={styles.buttonIcon}>🔐</span>
                Access Admin Panel
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <div style={styles.securityNotice}>
            <span style={styles.securityIcon}>🔒</span>
            <span style={styles.securityText}>
              This is a secure admin portal. All access attempts are logged.
            </span>
          </div>
          
          <div style={styles.backLink}>
            <a href="/admin/instructions" style={styles.link}>
              📋 View Admin Instructions
            </a>
            {' | '}
            <a href="/" style={styles.link}>
              ← Back to Main Site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    backgroundColor: '#0f172a',
  },
  background: {
    position: 'absolute' as const,
    inset: 0,
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },
  backgroundPattern: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `
      radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
    `,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '48px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #e2e8f0',
    position: 'relative' as const,
    zIndex: 10,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '4px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  errorText: {
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '500',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
  },
  buttonIcon: {
    fontSize: '18px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff40',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center' as const,
  },
  securityNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  securityIcon: {
    fontSize: '14px',
  },
  securityText: {
    fontSize: '12px',
    color: '#64748b',
  },
  backLink: {
    marginTop: '16px',
  },
  link: {
    fontSize: '14px',
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
  },
};