// Session Manager Utility
// Handles session persistence across container restarts and browser refreshes

import supabase from '../config/supabase';

// Session metadata storage key
const SESSION_METADATA_KEY = 'sitecraft_session_metadata';

// Store session metadata for container restart recovery
export const storeSessionMetadata = (session) => {
  if (!session) return;
  
  try {
    const metadata = {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at,
      refreshToken: session.refresh_token,
      storedAt: Date.now(),
      version: '1.0'
    };
    
    localStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(metadata));
    console.log('📦 Session metadata stored for container restart recovery');
  } catch (error) {
    console.warn('Failed to store session metadata:', error);
  }
};

// Retrieve session metadata
export const getSessionMetadata = () => {
  try {
    const stored = localStorage.getItem(SESSION_METADATA_KEY);
    if (!stored) return null;
    
    const metadata = JSON.parse(stored);
    
    // Check if metadata is too old (more than 30 days)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (Date.now() - metadata.storedAt > maxAge) {
      console.log('🗑️ Session metadata expired, removing');
      clearSessionMetadata();
      return null;
    }
    
    return metadata;
  } catch (error) {
    console.warn('Failed to retrieve session metadata:', error);
    return null;
  }
};

// Clear session metadata
export const clearSessionMetadata = () => {
  try {
    localStorage.removeItem(SESSION_METADATA_KEY);
    console.log('🗑️ Session metadata cleared');
  } catch (error) {
    console.warn('Failed to clear session metadata:', error);
  }
};

// Check if we're recovering from a container restart
export const isContainerRestart = () => {
  // Check if we have session metadata but no active Supabase session
  const metadata = getSessionMetadata();
  if (!metadata) return false;
  
  // Simple heuristic: if we have metadata but the page was just loaded,
  // it might be a container restart scenario
  const pageLoadTime = performance.now();
  return pageLoadTime < 5000 && metadata; // Page loaded less than 5 seconds ago
};

// Attempt to recover session after container restart
export const recoverSessionAfterRestart = async () => {
  try {
    console.log('🔄 Attempting session recovery after container restart...');
    
    const metadata = getSessionMetadata();
    if (!metadata) {
      console.log('ℹ️ No session metadata found for recovery');
      return null;
    }
    
    // Check if the stored session is expired
    if (metadata.expiresAt && new Date(metadata.expiresAt * 1000) <= new Date()) {
      console.log('⏰ Stored session is expired, attempting refresh...');
      
      try {
        // Attempt to refresh using the stored refresh token
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: metadata.refreshToken
        });
        
        if (error || !data.session) {
          console.log('❌ Session refresh failed during recovery');
          clearSessionMetadata();
          return null;
        }
        
        console.log('✅ Session refreshed successfully during recovery');
        storeSessionMetadata(data.session);
        return data.session;
      } catch (refreshError) {
        console.warn('❌ Session refresh error during recovery:', refreshError);
        clearSessionMetadata();
        return null;
      }
    }
    
    // Session should still be valid, let Supabase handle it
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('❌ Session recovery failed, clearing metadata');
      clearSessionMetadata();
      return null;
    }
    
    console.log('✅ Session recovered successfully');
    return session;
  } catch (error) {
    console.error('❌ Session recovery error:', error);
    clearSessionMetadata();
    return null;
  }
};

// Validate session with backend (for cross-container validation)
export const validateSessionWithBackend = async (session, apiUrl) => {
  if (!session?.access_token || !apiUrl) {
    return false;
  }

  try {
    console.log('🔍 Validating session with backend after restart...');
    
    const response = await fetch(`${apiUrl}/api/analysis/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    const isValid = response.status !== 401;
    console.log(`${isValid ? '✅' : '❌'} Backend validation result:`, { 
      status: response.status, 
      isValid 
    });
    
    return isValid;
  } catch (error) {
    console.warn('❌ Backend validation failed:', error.message);
    return false;
  }
};

// Complete session cleanup (for logout or invalid sessions)
export const performCompleteSessionCleanup = () => {
  console.log('🧹 Performing complete session cleanup...');
  
  // Clear session metadata
  clearSessionMetadata();
  
  // Clear all Supabase-related localStorage
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed localStorage key: ${key}`);
      }
    });
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
  
  // Also clear cookies that might contain auth data
  try {
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('sb-') || name.includes('supabase')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        console.log(`🍪 Cleared cookie: ${name}`);
      }
    });
  } catch (error) {
    console.warn('Failed to clear cookies:', error);
  }
  
  // Clear sessionStorage
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key === 'pendingProfileUpdate') {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed sessionStorage key: ${key}`);
      }
    });
  } catch (error) {
    console.warn('Failed to clear sessionStorage:', error);
  }
  
  console.log('✅ Complete session cleanup finished');
};

const sessionManager = {
  storeSessionMetadata,
  getSessionMetadata,
  clearSessionMetadata,
  isContainerRestart,
  recoverSessionAfterRestart,
  validateSessionWithBackend,
  performCompleteSessionCleanup
};

export default sessionManager;
