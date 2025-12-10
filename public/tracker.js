/**
 * VouchFor Hybrid Click and Sale Tracking SDK
 * 
 * Idempotent tracking script for vendor websites.
 * Implements both click tracking (on page load) and sale tracking.
 * 
 * Usage:
 * 1. Include this script: <script src="https://your-domain.com/tracker.js"></script>
 * 2. Track sales: window.vouchfor('track', 'sale', { program_id: '...' })
 */

(function() {
  'use strict';

  // Prevent duplicate execution
  if (window.vouchforInitialized) {
    return;
  }
  window.vouchforInitialized = true;

  // Storage configuration
  const STORAGE_KEY = 'vouchfor_ref_id';
  const STORAGE_EXPIRY_KEY = 'vouchfor_ref_id_expiry';
  const STORAGE_EXPIRY_DAYS = 60; // 60 days expiry

  // API endpoint - can be configured via window.VOUCHFOR_API_ENDPOINT
  // Defaults to same origin if not specified (for same-domain deployments)
  // For external vendor sites, set: window.VOUCHFOR_API_ENDPOINT = 'http://localhost:3001/api/track'
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
   * Check if stored ref_id is expired
   */
  function isExpired(expiryTimestamp) {
    if (!expiryTimestamp) return true;
    return Date.now() > parseInt(expiryTimestamp, 10);
  }

  /**
   * Get stored referral ID from LocalStorage
   */
  function getStoredRefId() {
    try {
      var storedRef = localStorage.getItem(STORAGE_KEY);
      var storedExpiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
      
      if (storedRef && !isExpired(storedExpiry)) {
        return storedRef;
      } else if (storedRef && isExpired(storedExpiry)) {
        // Clean up expired data
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
      }
    } catch (e) {
      console.warn('VouchFor: Error reading localStorage', e);
    }
    return null;
  }

  /**
   * Save referral ID to LocalStorage with expiry
   */
  function saveRefId(refId) {
    try {
      var expiryTimestamp = Date.now() + (STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem(STORAGE_KEY, refId);
      localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTimestamp.toString());
      console.log('VouchFor: Referral ID saved:', refId);
      return true;
    } catch (e) {
      console.warn('VouchFor: Could not save to localStorage', e);
      return false;
    }
  }

  /**
   * Send tracking event to API
   */
  function sendTrackingEvent(event, refId, programId) {
    var payload = {
      event: event,
      ref_id: refId,
      program_id: programId || null,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    return fetch(API_ENDPOINT, {
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
      console.log('VouchFor: ' + event + ' tracked successfully', data);
      return data;
    })
    .catch(function(error) {
      console.error('VouchFor: Error tracking ' + event, error);
      throw error;
    });
  }

  /**
   * Track click event
   * Called automatically when ?ref= is detected in URL
   */
  function trackClick(refId, programId) {
    if (!refId) {
      console.warn('VouchFor: No ref_id provided for click tracking');
      return Promise.reject(new Error('No ref_id provided'));
    }

    // Send click event to API
    // Note: program_id is optional for clicks but recommended
    return sendTrackingEvent('click', refId, programId)
      .catch(function(error) {
        // Don't block page load if click tracking fails
        console.warn('VouchFor: Click tracking failed (non-blocking):', error);
      });
  }

  /**
   * Track sale event
   * Called manually via window.vouchfor('track', 'sale', { program_id: '...' })
   */
  function trackSale(programId) {
    var refId = getStoredRefId();
    
    if (!refId) {
      console.warn('VouchFor: No referral ID found. User must visit via tracking link first.');
      return Promise.reject(new Error('No referral ID found'));
    }

    if (!programId) {
      console.warn('VouchFor: program_id is required for sale tracking');
      return Promise.reject(new Error('program_id is required'));
    }

    return sendTrackingEvent('sale', refId, programId);
  }

  /**
   * Initialize: Check for ?ref= in URL
   * If found, send click event immediately, then save to LocalStorage
   */
  function initialize() {
    var refParam = getUrlParameter('ref');
    var programIdParam = getUrlParameter('program_id'); // Optional program_id from URL
    
    if (refParam) {
      // Save to LocalStorage first
      saveRefId(refParam);
      
      // Send click event immediately (non-blocking)
      trackClick(refParam, programIdParam);
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose global function: window.vouchfor('track', 'sale', { program_id: '...' })
  window.vouchfor = function(command, eventType, options) {
    if (command === 'track' && eventType === 'sale') {
      var programId = options && options.program_id ? options.program_id : null;
      return trackSale(programId);
    } else {
      console.warn('VouchFor: Unknown command or event type. Use: vouchfor("track", "sale", { program_id: "..." })');
      return Promise.reject(new Error('Unknown command or event type'));
    }
  };

  console.log('VouchFor: Hybrid Click and Sale Tracking SDK loaded');
})();
