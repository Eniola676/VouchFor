/**
 * VouchFor Tracking SDK
 * 
 * This script tracks referral signups and events on vendor websites.
 * 
 * Usage:
 * 1. Include this script on your page: <script src="https://your-domain.com/tracker.js"></script>
 * 2. Track events: window.vouchfor.track('signup', { email: 'user@example.com' })
 */

(function() {
  'use strict';

  // Storage key for referral ID
  const STORAGE_KEY = 'vouchfor_referral_id';
  const COOKIE_NAME = 'vouchfor_referral_id';
  const COOKIE_EXPIRY_DAYS = 90; // 90 days cookie duration

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
   * Get cookie value
   */
  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Set cookie
   */
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
  }

  /**
   * Get or set referral ID
   */
  function getReferralId() {
    // Check URL parameter first
    var refParam = getUrlParameter('ref');
    if (refParam) {
      // Save to both localStorage and cookie
      try {
        localStorage.setItem(STORAGE_KEY, refParam);
      } catch (e) {
        console.warn('VouchFor: Could not save to localStorage', e);
      }
      setCookie(COOKIE_NAME, refParam, COOKIE_EXPIRY_DAYS);
      return refParam;
    }

    // Check cookie
    var cookieRef = getCookie(COOKIE_NAME);
    if (cookieRef) {
      try {
        localStorage.setItem(STORAGE_KEY, cookieRef);
      } catch (e) {
        // Ignore localStorage errors
      }
      return cookieRef;
    }

    // Check localStorage
    try {
      var storedRef = localStorage.getItem(STORAGE_KEY);
      if (storedRef) {
        // Sync to cookie
        setCookie(COOKIE_NAME, storedRef, COOKIE_EXPIRY_DAYS);
        return storedRef;
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    return null;
  }

  /**
   * Send tracking event to API
   */
  function trackEvent(eventName, metaData) {
    var referralId = getReferralId();
    
    if (!referralId) {
      console.warn('VouchFor: No referral ID found. Make sure to include ?ref= parameter in the URL.');
      return Promise.resolve();
    }

    var payload = {
      referral_id: referralId,
      event_name: eventName,
      metadata: metaData || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    // Determine API endpoint (use current origin or configured endpoint)
    var apiEndpoint = window.VOUCHFOR_API_ENDPOINT || '/api/track/event';

    return fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(function(data) {
      console.log('VouchFor: Event tracked successfully', data);
      return data;
    })
    .catch(function(error) {
      console.error('VouchFor: Error tracking event', error);
      throw error;
    });
  }

  /**
   * Initialize on page load
   */
  function init() {
    // Get referral ID from URL or storage
    var referralId = getReferralId();
    
    if (referralId) {
      console.log('VouchFor: Referral ID detected:', referralId);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global API
  window.vouchfor = {
    track: trackEvent,
    getReferralId: getReferralId,
    version: '1.0.0',
  };

  console.log('VouchFor: Tracking SDK loaded');
})();

