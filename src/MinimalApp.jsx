import React from 'react';

function MinimalApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 App is Working!</h1>
      <p>If you see this, React is loading correctly.</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Environment Check:</h2>
        <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing'}</p>
        <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}</p>
        <p>NODE_ENV: {import.meta.env.NODE_ENV || 'development'}</p>
      </div>
    </div>
  );
}

export default MinimalApp;
