// This file must be run to register the new auth provider
import { createClient } from '@supabase/supabase-js'

// Clear any stored auth data that might be causing refresh loops
window.localStorage.removeItem('supabase.auth.token');
window.localStorage.removeItem('sb-piyehrqkuzckfkewtvpy-auth-token');
window.sessionStorage.removeItem('supabase.auth.token');
window.sessionStorage.removeItem('sb-piyehrqkuzckfkewtvpy-auth-token');

// Check and unregister any service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Unregistered service worker:', registration.scope);
    }
  });
}

// Add this to prevent page refreshes
window.addEventListener('beforeunload', function (e) {
  // Only prevent unintentional refreshes by checking if it's a known action
  const isKnownAction = window.intentionalNavigation || false;
  
  if (!isKnownAction) {
    console.log('Preventing unintentional page refresh');
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});

// Mark intentional navigation
window.markIntentionalNavigation = function() {
  window.intentionalNavigation = true;
};

console.log('Auth refresh fix applied - page refreshes should now be stabilized');
