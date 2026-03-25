import { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { getAccessToken, authenticatedFetch } from '../utils/auth';

export function AuthDebug() {
  const { user, session } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');

  const runDebugTests = async () => {
    console.log('🔍 Running auth debug tests...');
    
    const info: any = {
      timestamp: new Date().toISOString(),
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName
      } : null,
      session: session ? {
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length || 0,
        tokenStart: session.access_token?.substring(0, 20) || 'N/A'
      } : null
    };

    // Test getAccessToken
    try {
      console.log('🔍 Testing getAccessToken...');
      const token = await getAccessToken();
      info.getAccessToken = {
        success: !!token,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) || 'N/A'
      };
    } catch (error) {
      info.getAccessToken = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test authenticatedFetch
    try {
      console.log('🔍 Testing authenticatedFetch...');
      const response = await authenticatedFetch('http://localhost:8000/health');
      const data = await response.text();
      info.authenticatedFetch = {
        success: response.ok,
        status: response.status,
        response: data.substring(0, 100)
      };
    } catch (error) {
      info.authenticatedFetch = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test create event
    try {
      console.log('🔍 Testing create event...');
      const eventData = {
        title: 'Debug Test Event',
        description: 'Testing auth from frontend',
        venue: 'Debug Venue',
        date: '2024-02-20',
        time: '20:00',
        category: 'conference',
        ticketTiers: [
          {
            name: 'General',
            price: 1000,
            quantity: 50
          }
        ]
      };

      const response = await authenticatedFetch('http://localhost:8000/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });

      const data = await response.json();
      info.createEvent = {
        success: response.ok,
        status: response.status,
        response: data
      };
    } catch (error) {
      info.createEvent = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    setDebugInfo(info);
    setTestResult(JSON.stringify(info, null, 2));
    console.log('🔍 Debug info:', info);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Authentication Debug</h1>
      
      <div style={styles.section}>
        <h2>Current Auth State</h2>
        <p><strong>User:</strong> {user ? `${user.email} (${user.role})` : 'Not logged in'}</p>
        <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
      </div>

      <div style={styles.section}>
        <button onClick={runDebugTests} style={styles.button}>
          Run Debug Tests
        </button>
      </div>

      {testResult && (
        <div style={styles.section}>
          <h2>Debug Results</h2>
          <pre style={styles.pre}>{testResult}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'monospace'
  },
  title: {
    color: '#333',
    marginBottom: '20px'
  },
  section: {
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  pre: {
    backgroundColor: '#f4f4f4',
    padding: '10px',
    borderRadius: '5px',
    overflow: 'auto',
    fontSize: '12px',
    whiteSpace: 'pre-wrap' as const
  }
};