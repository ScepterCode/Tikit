/**
 * Authentication utilities
 * Helper functions for getting auth tokens
 */

import { supabase } from '../lib/supabase';

/**
 * Get the current Supabase JWT access token
 * @returns The access token or null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    console.log('🔐 getAccessToken called');
    console.log('🔐 Supabase client exists:', !!supabase);
    
    if (!supabase) {
      console.error('❌ Supabase not configured');
      return null;
    }

    // First try to get the session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('🔐 Session retrieved:', !!session);
    console.log('🔐 Session error:', error);
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }

    if (!session) {
      console.warn('⚠️ No session found, user might not be logged in');
      return null;
    }

    const token = session.access_token;
    
    if (!token) {
      console.error('❌ Session exists but no access token');
      return null;
    }
    
    // Validate token is not expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      
      if (exp && now >= exp) {
        console.warn('⚠️ Token is expired, attempting refresh...');
        
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.error('❌ Failed to refresh session:', refreshError);
          return null;
        }
        
        console.log('✅ Session refreshed successfully');
        return refreshedSession.access_token;
      }
    } catch (e) {
      console.warn('⚠️ Could not validate token expiry:', e);
      // Continue with the token anyway
    }
    
    console.log('🔐 Access token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    return token;
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 * @param url The API endpoint URL
 * @param options Fetch options
 * @returns The fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  console.log('🔐 authenticatedFetch called for:', url);
  
  // Retry logic for token retrieval
  let token = null;
  let retries = 3;
  
  while (!token && retries > 0) {
    token = await getAccessToken();
    console.log('🔐 Token retrieved (attempt', 4 - retries, '):', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.warn('⚠️ No token available, retrying...');
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
      }
    }
  }
  
  if (!token) {
    console.error('❌ No token available after retries');
    throw new Error('Not authenticated - no token available');
  }

  // Merge headers properly
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  console.log('🔐 Headers set:', {
    'Content-Type': headers.get('Content-Type'),
    'Authorization': headers.get('Authorization')?.substring(0, 30) + '...'
  });

  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  console.log('🔐 Response status:', response.status);
  
  return response;
}
