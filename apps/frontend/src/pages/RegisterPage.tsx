import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
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
  const { register, isLoading: authLoading } = useSupabaseAuth();
  
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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);

  // Form validation
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

  // Handle field-specific errors
  const handleFieldError = (errorMessage: string) => {
    const newFieldErrors: {[key: string]: string} = {};
    
    if (errorMessage.toLowerCase().includes('phone number')) {
      newFieldErrors.phoneNumber = errorMessage;
    } else if (errorMessage.toLowerCase().includes('email')) {
      newFieldErrors.email = errorMessage;
    } else if (errorMessage.toLowerCase().includes('first name')) {
      newFieldErrors.firstName = errorMessage;
    } else if (errorMessage.toLowerCase().includes('last name')) {
      newFieldErrors.lastName = errorMessage;
    }
    
    setFieldErrors(newFieldErrors);
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
      await register({
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        state: formData.state,
        role: formData.role,
        organizationName: formData.role === 'organizer' ? formData.organizationName.trim() : undefined,
        organizationType: formData.role === 'organizer' ? formData.organizationType : undefined,
      });

      // Registration successful - navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
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
          <h2 style={styles.title}>Create Your Account</h2>
          <p style={styles.subtitle}>Join thousands of event enthusiasts across Nigeria</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>Registration Error</div>
              <div style={styles.errorMessage}>{error}</div>
              {error.toLowerCase().includes('phone number already registered') && (
                <div style={styles.errorHint}>
                  Try using a different phone number or <Link to="/auth/login" style={styles.errorLink}>login instead</Link>
                </div>
              )}
              {error.toLowerCase().includes('email') && error.toLowerCase().includes('already') && (
                <div style={styles.errorHint}>
                  This email is already in use. Try a different email address.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Role Selection */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>I want to...</label>
            <div style={styles.roleGrid}>
              <RoleCard
                icon="🎉"
                title="Attend Events"
                description="Browse and book tickets"
                selected={formData.role === 'attendee'}
                onClick={() => handleInputChange('role', 'attendee')}
              />
              <RoleCard
                icon="🎪"
                title="Organize Events"
                description="Create and manage events"
                selected={formData.role === 'organizer'}
                onClick={() => handleInputChange('role', 'organizer')}
              />
            </div>
          </div>

          {/* Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionLabel}>Personal Information</h3>
            
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  style={styles.input}
                  placeholder="John"
                  required
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  style={styles.input}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone Number *</label>
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
              />
              <p style={styles.hint}>This will be your username</p>
              {fieldErrors.phoneNumber && (
                <p style={styles.fieldError}>{fieldErrors.phoneNumber}</p>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  ...styles.input,
                  ...(fieldErrors.email ? styles.inputError : {})
                }}
                placeholder="john@example.com"
              />
              {fieldErrors.email && (
                <p style={styles.fieldError}>{fieldErrors.email}</p>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>State *</label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                style={styles.input}
                required
              >
                <option value="">Select your state</option>
                {nigerianStates.map((state) => (
                  <option key={state.code} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security */}
          <div style={styles.section}>
            <h3 style={styles.sectionLabel}>Security</h3>
            
            <div style={styles.field}>
              <label style={styles.label}>Password *</label>
              <div style={styles.passwordField}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  style={styles.input}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                style={styles.input}
                placeholder="Re-enter your password"
                required
              />
            </div>
          </div>

          {/* Organization Details (for organizers) */}
          {formData.role === 'organizer' && (
            <div style={styles.section}>
              <h3 style={styles.sectionLabel}>Organization Details</h3>
              
              <div style={styles.field}>
                <label style={styles.label}>Organization Name *</label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  style={styles.input}
                  placeholder="Your company or organization name"
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Organization Type *</label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => handleInputChange('organizationType', e.target.value)}
                  style={styles.input}
                  required
                >
                  <option value="">Select type</option>
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="ngo">NGO</option>
                  <option value="religious">Religious Organization</option>
                  <option value="educational">Educational Institution</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            style={styles.submitButton} 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <Link to="/auth/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Role Card Component
function RoleCard({ 
  icon, 
  title, 
  description, 
  selected, 
  onClick 
}: {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      style={{
        ...styles.roleCard,
        ...(selected ? styles.roleCardSelected : {})
      }}
      onClick={onClick}
    >
      <div style={styles.roleIcon}>{icon}</div>
      <h4 style={styles.roleTitle}>{title}</h4>
      <p style={styles.roleDescription}>{description}</p>
    </button>
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
    maxWidth: '600px',
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
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  sectionLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  roleCard: {
    padding: '20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.2s ease',
  },
  roleCardSelected: {
    border: '2px solid #667eea',
    backgroundColor: '#f5f7ff',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
  },
  roleIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  roleTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    margin: 0,
  },
  roleDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
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
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
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