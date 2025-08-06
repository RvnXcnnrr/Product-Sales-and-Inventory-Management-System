// Environment Variables Debug Component
import React from 'react'

const EnvDebug = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present ✅' : 'Missing ❌',
    NODE_ENV: import.meta.env.NODE_ENV,
    DEV: import.meta.env.DEV ? 'Yes' : 'No'
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Environment Debug</h4>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {value || 'undefined'}
        </div>
      ))}
    </div>
  )
}

export default EnvDebug
