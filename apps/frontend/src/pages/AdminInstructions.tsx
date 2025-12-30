import { useNavigate } from 'react-router-dom';

export function AdminInstructions() {
  const navigate = useNavigate();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🛡️ Admin Login Instructions</h1>
        
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Admin Credentials</h2>
          <div style={styles.credentialBox}>
            <div style={styles.credentialItem}>
              <label style={styles.label}>Phone Number:</label>
              <div style={styles.credentialValue}>
                <code>+2348012345678</code>
                <button 
                  onClick={() => copyToClipboard('+2348012345678')}
                  style={styles.copyButton}
                >
                  📋 Copy
                </button>
              </div>
            </div>
            <div style={styles.credentialItem}>
              <label style={styles.label}>Password:</label>
              <div style={styles.credentialValue}>
                <code>admin123</code>
                <button 
                  onClick={() => copyToClipboard('admin123')}
                  style={styles.copyButton}
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Login Steps</h2>
          <ol style={styles.stepsList}>
            <li>Click the "Go to Admin Login" button below</li>
            <li>Enter the phone number: <code>+2348012345678</code></li>
            <li>Enter the password: <code>admin123</code></li>
            <li>Click "Access Admin Panel"</li>
            <li>You will be redirected to the admin dashboard</li>
          </ol>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Important Notes</h2>
          <ul style={styles.notesList}>
            <li>⚠️ Use the <strong>exact</strong> phone number format: <code>+2348012345678</code></li>
            <li>🔒 This is a separate login from regular users</li>
            <li>📱 Admin users cannot login through the regular login page</li>
            <li>🛡️ All admin access attempts are logged for security</li>
          </ul>
        </div>

        <div style={styles.buttonContainer}>
          <button 
            onClick={() => navigate('/admin/login')}
            style={styles.loginButton}
          >
            🔐 Go to Admin Login
          </button>
          <button 
            onClick={() => navigate('/')}
            style={styles.homeButton}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '15px',
  },
  credentialBox: {
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
  },
  credentialItem: {
    marginBottom: '15px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: '5px',
    display: 'block',
  },
  credentialValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  copyButton: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  stepsList: {
    paddingLeft: '20px',
    lineHeight: '1.6',
  },
  notesList: {
    paddingLeft: '20px',
    lineHeight: '1.6',
  },
  buttonContainer: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '30px',
  },
  loginButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  homeButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};