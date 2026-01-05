/**
 * VouchFor Session-Based Tracking SDK
 * 
 * Tracks referral sessions using session tokens (not affiliate IDs).
 * Conversion events are advisory - webhooks are authoritative.
 * 
 * Usage:
 * 1. Include this script: <script src="https://your-domain.com/tracker.js"></script>
 * 2. Track conversions (advisory): window.vouchfor('track', 'conversion', { conversion_id: '...', amount: 99.00 })
 */

(function() {
  'use strict';

  // Prevent duplicate execution
  if (window.vouchforInitialized) {
    return;
  }
  window.vouchforInitialized = true;

  // Storage configuration
  const STORAGE_KEY = 'vouchfor_session';
  const API_ENDPOINT = window.VOUCHFOR_API_ENDPOINT || '/api/track';

  /**
   * Get URL parameter value
   */
  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  /**
   * Check if stored session is expired
   */
  function isSessionExpired(session) {
    if (!session || !session.expires_at) return true;
    return Date.now() > new Date(session.expires_at).getTime();
  }

  /**
   * Get stored session from LocalStorage
   */
  function getStoredSession() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      var session = JSON.parse(stored);
      if (isSessionExpired(session)) {
        // Clean up expired session
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch (e) {
      console.warn('VouchFor: Error reading localStorage', e);
      return null;
    }
  }

  /**
   * Save session to LocalStorage
   */
  function saveSession(session) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      console.log('VouchFor: Session saved:', session.token);
      return true;
    } catch (e) {
      console.warn('VouchFor: Could not save to localStorage', e);
      return false;
    }
  }

  /**
   * Send conversion hint to API (advisory only)
   * Webhooks are authoritative for actual conversions
   */
  function sendConversionHint(sessionToken, conversionId, amount) {
    var payload = {
      event: 'conversion_hint',
      session_token: sessionToken,
      conversion_id: conversionId || null,
      amount: amount || null,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    return fetch(API_ENDPOINT + '/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      console.log('VouchFor: Conversion hint sent (webhook is authoritative)', data);
      return data;
    })
    .catch(function(error) {
      console.warn('VouchFor: Error sending conversion hint (non-blocking):', error);
      // Don't throw - this is advisory only
      return { error: error.message };
    });
  }

  /**
   * Track conversion (advisory)
   * Called manually via window.vouchfor('track', 'conversion', { conversion_id: '...', amount: 99.00 })
   */
  function trackConversion(options) {
    var session = getStoredSession();
    
    if (!session || !session.token) {
      console.warn('VouchFor: No valid session found. User must visit via tracking link first.');
      return Promise.resolve({ 
        received: false, 
        message: 'No valid session found. Webhook will handle conversion if payment succeeds.' 
      });
    }

    var conversionId = options && options.conversion_id ? options.conversion_id : null;
    var amount = options && options.amount ? options.amount : null;

    // Send advisory conversion hint
    return sendConversionHint(session.token, conversionId, amount);
  }

  /**
   * Validate session token with server
   */
  function validateSession(sessionToken) {
    return fetch(API_ENDPOINT + '/session/' + sessionToken, {
      method: 'GET',
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Session validation failed: ' + response.status);
      }
      return response.json();
    })
    .catch(function(error) {
      console.warn('VouchFor: Session validation failed (non-blocking):', error);
      return null;
    });
  }

  /**
   * Initialize: Check for ?session= in URL
   * If found, save session token to LocalStorage
   */
  function initialize() {
    var sessionParam = getUrlParameter('session');
    
    if (sessionParam) {
      // Calculate expiry (default 60 days, but should match server-side)
      var expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      
      var session = {
        token: sessionParam,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      };
      
      // Save to LocalStorage
      saveSession(session);
      
      // Optionally validate with server (non-blocking)
      validateSession(sessionParam).then(function(validation) {
        if (validation && validation.expires_at) {
          // Update expiry from server if provided
          session.expires_at = validation.expires_at;
          saveSession(session);
        }
      });
    } else {
      // Check for existing valid session
      var existingSession = getStoredSession();
      if (existingSession) {
        console.log('VouchFor: Using existing session:', existingSession.token);
      }
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose global function: window.vouchfor('track', 'conversion', { conversion_id: '...', amount: 99.00 })
  window.vouchfor = function(command, eventType, options) {
    if (command === 'track' && eventType === 'conversion') {
      return trackConversion(options);
    } else {
      console.warn('VouchFor: Unknown command. Use: vouchfor("track", "conversion", { conversion_id: "...", amount: 99.00 })');
      return Promise.resolve({ 
        received: false, 
        message: 'Unknown command. Webhook will handle conversion if payment succeeds.' 
      });
    }
  };

  console.log('VouchFor: Session-Based Tracking SDK loaded');
})();
