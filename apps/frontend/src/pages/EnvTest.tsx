import React from 'react';

export function EnvTest() {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  const expectedUrl = 'https://hwwzbsppzwcyvambeade.supabase.co';
  const isCorrectUrl = envVars.VITE_SUPABASE_URL === expectedUrl;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Environment Variables Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current Environment Variables:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Validation:</h2>
        <div style={{ 
          background: isCorrectUrl ? '#e8f5e8' : '#ffe8e8', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid ' + (isCorrectUrl ? '#4caf50' : '#f44336')
        }}>
          <p><strong>Expected URL:</strong> {expectedUrl}</p>
          <p><strong>Actual URL:</strong> {envVars.VITE_SUPABASE_URL}</p>
          <p><strong>Match:</strong> {isCorrectUrl ? '✅ YES' : '❌ NO'}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Key Validation:</h2>
        <ul>
          <li>Key exists: {envVars.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</li>
          <li>Key length: {envVars.VITE_SUPABASE_ANON_KEY?.length || 0}</li>
          <li>Starts with eyJ: {envVars.VITE_SUPABASE_ANON_KEY?.startsWith('eyJ') ? '✅' : '❌'}</li>
          <li>Contains hwwzbsppzwcyvambeade: {envVars.VITE_SUPABASE_ANON_KEY?.includes('hwwzbsppzwcyvambeade') ? '✅' : '❌'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Instructions:</h2>
        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
          {isCorrectUrl ? (
            <p>✅ Environment variables are correct! You can now test registration and login.</p>
          ) : (
            <div>
              <p>❌ Environment variables are incorrect. Please:</p>
              <ol>
                <li>Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)</li>
                <li>Check that .env.local file has the correct values</li>
                <li>Restart the dev server</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        🔄 Refresh Test
      </button>
    </div>
  );
}