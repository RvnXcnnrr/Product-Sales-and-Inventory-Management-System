// This file applies safe auth-refresh adjustments for the browser session

// IMPORTANT: Do not clear auth tokens on load, this causes logout on refresh
// If you must reset tokens, do it behind a manual action/debug flag only.

// Check and unregister any service workers
// Avoid unregistering service workers automatically; keep PWA functionality intact

// Add this to prevent page refreshes
// Do not block normal page refreshes; let the browser reload freely

// Mark intentional navigation
// Optional helper could be reintroduced if needed

console.log('Auth refresh fix: non-destructive mode active');
