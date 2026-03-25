/**
 * Utility to completely clear all browser storage
 * Use this to remove any cached authentication data
 */

export function clearAllStorage() {
  try {
    // Clear localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
    
    // Clear IndexedDB (Supabase uses this)
    if ('indexedDB' in window) {
      // Clear Supabase specific databases
      const dbNames = ['supabase-auth-token', 'supabase-auth'];
      dbNames.forEach(dbName => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => console.log(`✅ IndexedDB ${dbName} cleared`);
        deleteReq.onerror = () => console.log(`⚠️ Could not clear IndexedDB ${dbName}`);
      });
    }
    
    // Clear cookies (if any)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('✅ Cookies cleared');
    
    console.log('🧹 All storage cleared - no cached authentication data remains');
    
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
}

// Add to window for easy access in console
(window as any).clearAllStorage = clearAllStorage;