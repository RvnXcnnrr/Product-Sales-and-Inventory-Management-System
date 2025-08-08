import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext.jsx';
import { AuthErrorProvider } from './components/ui/AuthErrorModal.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';
import './lib/auth-refresh-fix.js'; // Import auth refresh fix

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        if (error?.status >= 400 && error?.status < 500) return false;
        return true;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  // Temporarily removed StrictMode to prevent double rendering during development
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthErrorProvider>
          <AuthProvider>
            <CartProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </CartProvider>
          </AuthProvider>
        </AuthErrorProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);
