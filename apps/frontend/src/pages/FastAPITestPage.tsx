/*
FastAPI Test Page
Test page to verify FastAPI backend integration
*/

import { useState } from 'react';
import { useAuth } from '../contexts/FastAPIAuthContext';
import { useEvents, useTickets, usePayments, useNotifications } from '../hooks/useApi';
import { useRealtimeConnection, useRealtimeMessages } from '../hooks/useRealtimeConnection';
import { apiService } from '../services/api';

export function FastAPITestPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // API hooks
  const eventsApi = useEvents();
  const ticketsApi = useTickets();
  const paymentsApi = usePayments();
  const notificationsApi = useNotifications();

  // Real-time hooks
  const realtimeConnection = useRealtimeConnection();
  const { messages, lastMessage } = useRealtimeMessages();

  const addTestResult = (test: string, success: boolean, data?: any, error?: string) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Health Check
    try {
      const health = await apiService.healthCheck();
      addTestResult('Health Check', health.status === 'ok', health);
    } catch (error: any) {
      addTestResult('Health Check', false, null, error.message);
    }

    // Test 2: Get Events (public endpoint)
    try {
      const result = await eventsApi.getEvents({ limit: 5 });
      addTestResult('Get Events', result.success, result.data, result.error);
    } catch (error: any) {
      addTestResult('Get Events', false, null, error.message);
    }

    // Test 3: Get Payment Methods (public endpoint)
    try {
      const result = await paymentsApi.getPaymentMethods();
      addTestResult('Get Payment Methods', result.success, result.data, result.error);
    } catch (error: any) {
      addTestResult('Get Payment Methods', false, null, error.message);
    }

    // Authenticated tests (only if user is logged in)
    if (user) {
      // Test 4: Get Current User
      try {
        const result = await apiService.getCurrentUser();
        addTestResult('Get Current User', result.success, result.data?.user, result.error?.message);
      } catch (error: any) {
        addTestResult('Get Current User', false, null, error.message);
      }

      // Test 5: Get My Tickets
      try {
        const result = await ticketsApi.getMyTickets();
        addTestResult('Get My Tickets', result.success, result.data, result.error);
      } catch (error: any) {
        addTestResult('Get My Tickets', false, null, error.message);
      }

      // Test 6: Get Wallet Balance
      try {
        const result = await paymentsApi.getWalletBalance();
        addTestResult('Get Wallet Balance', result.success, result.data, result.error);
      } catch (error: any) {
        addTestResult('Get Wallet Balance', false, null, error.message);
      }

      // Test 7: Get Notifications
      try {
        const result = await notificationsApi.getNotifications({ limit: 5 });
        addTestResult('Get Notifications', result.success, result.data, result.error);
      } catch (error: any) {
        addTestResult('Get Notifications', false, null, error.message);
      }
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🧪 FastAPI Backend Test</h1>
        <p>Test the integration between React frontend and FastAPI backend</p>
      </div>

      {/* User Status */}
      <div style={styles.section}>
        <h2>Authentication Status</h2>
        <div style={styles.statusCard}>
          <div style={styles.statusItem}>
            <span>User:</span>
            <span style={{ color: user ? '#10b981' : '#ef4444' }}>
              {user ? `${user.firstName} ${user.lastName}` : 'Not authenticated'}
            </span>
          </div>
          <div style={styles.statusItem}>
            <span>Role:</span>
            <span>{user?.role || 'N/A'}</span>
          </div>
          <div style={styles.statusItem}>
            <span>Phone:</span>
            <span>{user?.phoneNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Real-time Connection Status */}
      <div style={styles.section}>
        <h2>Real-time Connection</h2>
        <div style={styles.statusCard}>
          <div style={styles.statusItem}>
            <span>Status:</span>
            <span style={{ 
              color: realtimeConnection.connected ? '#10b981' : 
                     realtimeConnection.connecting ? '#f59e0b' : '#ef4444' 
            }}>
              {realtimeConnection.connected ? 'Connected' : 
               realtimeConnection.connecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          <div style={styles.statusItem}>
            <span>Connection ID:</span>
            <span>{realtimeConnection.connectionId || 'N/A'}</span>
          </div>
          <div style={styles.statusItem}>
            <span>Messages Received:</span>
            <span>{messages.length}</span>
          </div>
          {realtimeConnection.error && (
            <div style={styles.statusItem}>
              <span>Error:</span>
              <span style={{ color: '#ef4444' }}>{realtimeConnection.error}</span>
            </div>
          )}
        </div>
        
        <div style={styles.buttonGroup}>
          <button 
            onClick={realtimeConnection.connect}
            disabled={realtimeConnection.connected || realtimeConnection.connecting}
            style={styles.button}
          >
            Connect
          </button>
          <button 
            onClick={realtimeConnection.disconnect}
            disabled={!realtimeConnection.connected}
            style={styles.button}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* API Tests */}
      <div style={styles.section}>
        <h2>API Tests</h2>
        <div style={styles.buttonGroup}>
          <button 
            onClick={runTests}
            disabled={isRunning}
            style={styles.primaryButton}
          >
            {isRunning ? 'Running Tests...' : 'Run API Tests'}
          </button>
          <button 
            onClick={clearResults}
            style={styles.button}
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={styles.section}>
          <h2>Test Results</h2>
          <div style={styles.results}>
            {testResults.map((result, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.resultItem,
                  borderLeft: `4px solid ${result.success ? '#10b981' : '#ef4444'}`
                }}
              >
                <div style={styles.resultHeader}>
                  <span style={styles.resultTest}>{result.test}</span>
                  <span style={{
                    ...styles.resultStatus,
                    color: result.success ? '#10b981' : '#ef4444'
                  }}>
                    {result.success ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                
                {result.error && (
                  <div style={styles.resultError}>
                    Error: {result.error}
                  </div>
                )}
                
                {result.data && (
                  <details style={styles.resultDetails}>
                    <summary>Response Data</summary>
                    <pre style={styles.resultData}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
                
                <div style={styles.resultTime}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Messages */}
      {messages.length > 0 && (
        <div style={styles.section}>
          <h2>Real-time Messages</h2>
          <div style={styles.messages}>
            {messages.slice(-10).map((message, index) => (
              <div key={index} style={styles.messageItem}>
                <div style={styles.messageHeader}>
                  <span style={styles.messageType}>{message.type}</span>
                  <span style={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre style={styles.messageData}>
                  {JSON.stringify(message, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Message */}
      {lastMessage && (
        <div style={styles.section}>
          <h2>Last Message</h2>
          <div style={styles.lastMessage}>
            <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  statusCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  primaryButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  results: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  resultItem: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  resultTest: {
    fontWeight: 'bold'
  },
  resultStatus: {
    fontWeight: 'bold'
  },
  resultError: {
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '10px'
  },
  resultDetails: {
    marginBottom: '10px'
  },
  resultData: {
    backgroundColor: '#f1f5f9',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px'
  },
  resultTime: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right' as const
  },
  messages: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    maxHeight: '400px',
    overflow: 'auto'
  },
  messageItem: {
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px'
  },
  messageType: {
    fontWeight: 'bold',
    color: '#3b82f6'
  },
  messageTime: {
    fontSize: '12px',
    color: '#6b7280'
  },
  messageData: {
    fontSize: '12px',
    backgroundColor: '#f8fafc',
    padding: '8px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '150px'
  },
  lastMessage: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  }
};