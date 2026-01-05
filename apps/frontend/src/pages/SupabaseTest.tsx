import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseTest() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results: any = {};
    
    // Test 1: Environment Variables
    results.envVars = {
      url: import.meta.env.VITE_SUPABASE_URL,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) || 'N/A'
    };

    // Test 2: Supabase Client
    results.client = {
      exists: !!supabase,
      url: supabase?.supabaseUrl || 'N/A',
      key: supabase?.supabaseKey?.substring(0, 10) || 'N/A'
    };

    // Test 3: Basic Connection Test
    if (supabase) {
      try {
        console.log('🔍 Testing Supabase connection...');
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        results.connection = {
          success: !error,
          error: error?.message || null,
          data: data || null
        };
      } catch (err: any) {
        results.connection = {
          success: false,
          error: err.message,
          data: null
        };
      }
    } else {
      results.connection = {
        success: false,
        error: 'Supabase client not initialized',
        data: null
      };
    }

    // Test 4: DNS Resolution Test
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (url) {
        const response = await fetch(`${url}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        
        results.dns = {
          success: response.ok,
          status: response.status,
          statusText: response.statusText
        };
      } else {
        results.dns = {
          success: false,
          error: 'No URL provided'
        };
      }
    } catch (err: any) {
      results.dns = {
        success: false,
        error: err.message
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>🔍 Testing Supabase Connection...</h2>
        <p>Running diagnostics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔍 Supabase Connection Test Results</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>1. Environment Variables</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(testResults.envVars, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>2. Supabase Client</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(testResults.client, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>3. Database Connection</h3>
        <pre style={{ 
          background: testResults.connection.success ? '#e8f5e8' : '#ffe8e8', 
          padding: '10px', 
          borderRadius: '4px' 
        }}>
          {JSON.stringify(testResults.connection, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>4. DNS Resolution</h3>
        <pre style={{ 
          background: testResults.dns.success ? '#e8f5e8' : '#ffe8e8', 
          padding: '10px', 
          borderRadius: '4px' 
        }}>
          {JSON.stringify(testResults.dns, null, 2)}
        </pre>
      </div>

      <button 
        onClick={runTests}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔄 Run Tests Again
      </button>
    </div>
  );
}