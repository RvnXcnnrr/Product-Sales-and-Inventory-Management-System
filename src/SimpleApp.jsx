import React from 'react'

// Simple test component to diagnose white screen
const SimpleApp = () => {
  console.log('SimpleApp rendering...')
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🟢 React App is Working!</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Environment Check</h2>
        <ul>
          <li><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing'}</li>
          <li><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}</li>
          <li><strong>Mode:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Quick Actions</h2>
        <p>If you can see this page, React is working properly.</p>
        <button 
          onClick={() => {
            console.log('Button clicked!')
            alert('React events are working!')
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test React
        </button>
        
        <button 
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}

export default SimpleApp
