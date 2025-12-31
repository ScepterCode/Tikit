import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/ProductionAuthContext';

interface FormData {
  phoneNumber: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);

  // Handle field-specific errors
  const handleFieldError = (errorMessage: string) => {
    const newFieldErrors: {[key: string]: string} = {};
    
    if (errorMessage.toLowerCase().includes('phone number')) {
      newFieldErrors.phoneNumber = errorMessage;
    } else if (errorMessage.toLowerCase().includes('password')) {
      newFieldErrors.password = errorMessage;
    } else if (errorMessage.toLowerCase().includes('invalid credentials')) {
      newFieldErrors.phoneNumber = 'Invalid phone number or password';
      newFieldErrors.password = 'Invalid phone number or password';
    }
    
    setFieldErrors(newFieldErrors);
  };

  // Form validation
  const validateForm = (): string | null => {
    if (!formData.phoneNumber.trim()) return 'Phone number is required';
    if (!formData.password) return 'Password is required';
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await login(formData.phoneNumber.trim(), formData.password);
      
      // Login successful - navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      handleFieldError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' })); // Clear field-specific error
    }
  };

  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.logo}>🎫 Tikit</h1>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to continue to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>Login Error</div>
              <div style={styles.errorMessage}>{error}</div>
              {error.toLowerCase().includes('invalid credentials') && (
                <div style={styles.errorHint}>
                  Check your phone number and password, or <Link to="/auth/register" style={styles.errorLink}>create an account</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              style={{
                ...styles.input,
                ...(fieldErrors.phoneNumber ? styles.inputError : {})
              }}
              placeholder="+234 800 000 0000"
              required
              autoComplete="username"
            />
            <p style={styles.hint}>Use the same number you registered with</p>
            {fieldErrors.phoneNumber && (
              <p style={styles.fieldError}>{fieldErrors.phoneNumber}</p>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                style={{
                  ...styles.input,
                  ...(fieldErrors.password ? styles.inputError : {})
                }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {fieldErrors.password && (
              <p style={styles.fieldError}>{fieldErrors.password}</p>
            )}
          </div>

          <button 
            type="submit" 
            style={styles.submitButton} 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account?{' '}
            <Link to="/auth/register" style={styles.link}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    padding: '40px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logo: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#667eea',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  error: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    border: '1px solid #fecaca',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
  },
  errorIcon: {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px',
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontWeight: '600',
    marginBottom: '4px',
    fontSize: '15px',
  },
  errorMessage: {
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  errorHint: {
    fontSize: '13px',
    color: '#7f1d1d',
    fontStyle: 'italic',
  },
  errorLink: {
    color: '#dc2626',
    textDecoration: 'underline',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  field: {
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
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  fieldError: {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '4px',
    margin: 0,
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  passwordField: {
    position: 'relative' as const,
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
  },
  submitButton: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    marginTop: '8px',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center' as const,
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
};