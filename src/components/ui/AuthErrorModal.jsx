import React, { useState, useEffect, createContext, useContext } from 'react';
import Modal from './Modal';
import Alert from './Alert';

// Create a context to manage auth errors globally
const AuthErrorContext = createContext({
  showError: () => {},
  hideError: () => {},
  isVisible: false,
  error: null
});

export const useAuthError = () => {
  return useContext(AuthErrorContext);
};

export const AuthErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const showError = (title, message, type = 'error') => {
    setError({ title, message, type });
    setIsVisible(true);
  };

  const hideError = () => {
    setIsVisible(false);
    // Clear error after animation completes
    setTimeout(() => setError(null), 300);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isVisible) {
        hideError();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isVisible]);

  return (
    <AuthErrorContext.Provider value={{ showError, hideError, isVisible, error }}>
      {children}
      <AuthErrorModal />
    </AuthErrorContext.Provider>
  );
};

const AuthErrorModal = () => {
  const { isVisible, error, hideError } = useAuthError();

  if (!isVisible || !error) return null;

  const errorMessages = {
    'Invalid login credentials': 'The email or password you entered is incorrect. Please try again.',
    'Email already registered': 'This email is already registered. Please try a different email or log in.',
    'Password should be at least 6 characters': 'Please use a stronger password with at least 6 characters.',
    'User already registered': 'An account with this email already exists. Please log in instead.',
    'Email not confirmed': 'Please check your email and confirm your account before logging in.',
    // Add more common error messages here
  };

  // Get a user-friendly message if available, otherwise use the original
  const userFriendlyMessage = errorMessages[error.message] || error.message;

  return (
    <Modal
      isOpen={isVisible}
      onClose={hideError}
      title={error.title || 'Authentication Error'}
      size="md"
    >
      <div className="p-6">
        <Alert
          type={error.type || 'error'}
          message={userFriendlyMessage}
          className="mb-4"
        />
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={hideError}
            className="btn btn-primary"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AuthErrorModal;
