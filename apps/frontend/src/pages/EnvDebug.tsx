export function EnvDebug() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Environment Debug</h1>
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Environment Variables:</h3>
        <p><strong>VITE_SUPABASE_URL:</strong> {supabaseUrl || 'undefined'}</p>
        <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'}</p>
      </div>

      <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Validation Checks:</h3>
        <p>✅ URL exists: {supabaseUrl ? 'Yes' : 'No'}</p>
        <p>✅ Key exists: {supabaseAnonKey ? 'Yes' : 'No'}</p>
        <p>✅ URL has .supabase.co: {supabaseUrl?.includes('.supabase.co') ? 'Yes' : 'No'}</p>
        <p>✅ Key starts with eyJ: {supabaseAnonKey?.startsWith('eyJ') ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px' }}>
        <h3>Instructions:</h3>
        <p>1. Check if all validation checks show "Yes"</p>
        <p>2. If any show "No", there's an issue with the environment variables</p>
        <p>3. Make sure the .env file is in the correct location: apps/frontend/.env</p>
        <p>4. Restart the dev server after making changes</p>
      </div>
    </div>
  );
}