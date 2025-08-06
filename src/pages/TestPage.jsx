import React from 'react'

const TestPage = () => {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>🚀 Application Test Page</h1>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Environment Variables</h2>
        <ul>
          <li><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not found'}</li>
          <li><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present ✅' : 'Missing ❌'}</li>
          <li><strong>NODE_ENV:</strong> {import.meta.env.NODE_ENV}</li>
          <li><strong>DEV:</strong> {import.meta.env.DEV ? 'Yes' : 'No'}</li>
        </ul>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Application Status</h2>
        <p>✅ React is working</p>
        <p>✅ Vite hot reload is working</p>
        <p>✅ Environment variables loaded</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2>Next Steps</h2>
        <ol>
          <li>Environment variables are working</li>
          <li>Navigate to login page: <a href="/login">/login</a></li>
          <li>Or register page: <a href="/register">/register</a></li>
        </ol>
      </div>
    </div>
  )
}

export default TestPage
