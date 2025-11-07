import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faLock, faSignInAlt, 
  faUserPlus, faSpinner, faArrowLeft, faHamburger,
  faKey, faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

// API configuration
const API_URL = "https://backend-wgm2.onrender.com/api";

// User context simulation
const useUser = () => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  });

  const login = (userData) => {
    try {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user data from localStorage:', error);
    }
  };

  return { user, login, logout };
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20;
};

const UserLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { login } = useUser();

  // Use API_URL directly
  const API_BASE_URL = API_URL;

  // Clear all messages and errors
  const clearMessages = () => {
    setMessage('');
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Username validation for registration
    if (!isLogin) {
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (!validateUsername(formData.username)) {
        errors.username = 'Username must be between 3 and 20 characters';
      }
    }

    // Reset password validation
    if (showResetPassword) {
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (!validatePassword(formData.newPassword)) {
        errors.newPassword = 'Password must be at least 6 characters long';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Improved API request handler with better timeout and retry logic
  const makeApiRequest = async (url, options, timeout = 15000, maxRetries = 2) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        console.log(`API Request Attempt ${attempt}:`, url);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        clearTimeout(timeoutId);

        // Handle non-JSON responses gracefully
        const contentType = response.headers.get('content-type');
        if (!response.ok) {
          // If it's a server error, try to parse error message
          let errorMessage = `Request failed with status ${response.status}`;
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const textResponse = await response.text();
            if (textResponse) {
              errorMessage = textResponse;
            }
          }
          
          throw new Error(errorMessage);
        }

        // Parse successful response
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          return data;
        } else {
          // Handle non-JSON successful responses
          const textResponse = await response.text();
          return { message: textResponse || 'Request completed successfully' };
        }

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        
        if (error.name === 'AbortError') {
          console.log(`Attempt ${attempt}: Request timeout`);
          if (attempt < maxRetries) {
            // Wait for a short time before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          } else {
            throw new Error('Request timeout - server is taking too long to respond. Please try again.');
          }
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
    
    throw lastError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (loading) {
      showMessage('Please wait...', 'info');
      return;
    }

    if (!validateForm()) {
      showMessage('Please fix the errors above', 'error');
      return;
    }

    setLoading(true);

    try {
      if (showResetPassword) {
        await handleResetPassword();
        return;
      }

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { 
            email: formData.email.trim().toLowerCase(), 
            password: formData.password 
          }
        : { 
            username: formData.username.trim(), 
            email: formData.email.trim().toLowerCase(), 
            password: formData.password 
          };

      console.log('Sending request to:', `${API_BASE_URL}${endpoint}`);
      
      const data = await makeApiRequest(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 15000, 2); // 15 second timeout, 2 retries

      showMessage(data.message, 'success');

      if (isLogin) {
        // Store user data and redirect
        if (data.user) {
          login(data.user);
          setTimeout(() => {
            window.location.replace('/userdashboard');
          }, 1500);
        } else {
          throw new Error('No user data received from server');
        }
      } else {
        // Switch to login after successful registration
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
        showMessage('Account created successfully! Please login.', 'success');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showMessage('Network error: Please check your internet connection and try again', 'error');
      } else if (error.message.includes('timeout')) {
        showMessage('Server is taking too long to respond. Please try again in a moment.', 'error');
      } else if (error.message.includes('Failed to fetch')) {
        showMessage('Cannot connect to the server. Please check your internet connection.', 'error');
      } else {
        showMessage(error.message || 'An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();

    if (!formData.email.trim()) {
      showMessage('Please enter your email address', 'error');
      return;
    }

    if (!validateEmail(formData.email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }

    if (loading) {
      showMessage('Please wait...', 'info');
      return;
    }

    setLoading(true);
    showMessage('Sending password reset link...', 'info');

    try {
      const data = await makeApiRequest(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      }, 15000, 2);

      showMessage('✅ If an account with that email exists, a password reset link has been sent! Check your inbox and spam folder.', 'success');
      
      // Auto-show reset form in demo mode if token is provided
      if (data.demoResetToken) {
        console.log('Demo reset token:', data.demoResetToken);
        
        setTimeout(() => {
          setResetToken(data.demoResetToken);
          setShowForgotPassword(false);
          setShowResetPassword(true);
          setFormData({ ...formData, email: '' });
          showMessage('You can now set your new password', 'info');
        }, 2000);
      } else {
        setTimeout(() => {
          setShowForgotPassword(false);
          setFormData({ ...formData, email: '' });
        }, 3000);
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.message.includes('timeout')) {
        showMessage('Server timeout. Please try again.', 'error');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showMessage('Network error: Please check your internet connection', 'error');
      } else {
        showMessage(error.message || 'Failed to send reset email. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    clearMessages();

    if (!resetToken) {
      showMessage('Reset token is missing or invalid', 'error');
      return;
    }

    if (!validateForm()) {
      showMessage('Please fix the errors above', 'error');
      return;
    }

    if (loading) {
      showMessage('Please wait...', 'info');
      return;
    }

    setLoading(true);
    showMessage('Resetting your password...', 'info');

    try {
      const data = await makeApiRequest(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: formData.newPassword
        }),
      }, 15000, 2);

      showMessage('✅ Password reset successfully! You can now login with your new password.', 'success');
      
      // Reset states and go back to login
      setTimeout(() => {
        setShowResetPassword(false);
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
        setResetToken('');
        clearMessages();
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('timeout')) {
        showMessage('Server timeout. Please try again.', 'error');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showMessage('Network error: Please check your internet connection', 'error');
      } else {
        showMessage(error.message || 'Failed to reset password. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToHomepage = () => {
    window.location.href = '/';
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
    setResetToken('');
    clearMessages();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
    clearMessages();
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors p-2"
            aria-label="Back to login"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faKey} className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-gray-600 mt-2">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6">
            <div>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faEnvelope} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                />
              </div>
              {formErrors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  <FontAwesomeIcon 
                    icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                    className={`mr-2 ${
                      messageType === 'success' ? 'text-green-500' : 
                      messageType === 'error' ? 'text-red-500' : 'text-blue-500'
                    }`} 
                  />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Sending reset link...
                </span>
              ) : (
                <span>
                  <FontAwesomeIcon icon={faKey} className="mr-2" />
                  Send Reset Link
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-orange-800 font-medium">Server Notice</p>
                <p className="text-xs text-orange-700 mt-1">
                  The server may take a moment to respond as it wakes up. Please be patient.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset Password View
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors p-2"
            aria-label="Back to login"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faKey} className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Create New Password</h2>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password (min. 6 characters)"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formErrors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  aria-describedby={formErrors.newPassword ? "newPassword-error" : undefined}
                />
              </div>
              {formErrors.newPassword && (
                <p id="newPassword-error" className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                  {formErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  aria-describedby={formErrors.confirmPassword ? "confirmPassword-error" : undefined}
                />
              </div>
              {formErrors.confirmPassword && (
                <p id="confirmPassword-error" className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  <FontAwesomeIcon 
                    icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                    className={`mr-2 ${
                      messageType === 'success' ? 'text-green-500' : 
                      messageType === 'error' ? 'text-red-500' : 'text-blue-500'
                    }`} 
                  />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Resetting password...
                </span>
              ) : (
                <span>
                  <FontAwesomeIcon icon={faKey} className="mr-2" />
                  Reset Password
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Login/Signup View
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        {/* Back to Home Button */}
        <button
          onClick={goToHomepage}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors p-2"
          aria-label="Back to homepage"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faHamburger} className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to your account' : 'Join our foodie community'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="text"
                  name="username"
                  placeholder="Username (3-20 characters)"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={!isLogin}
                  minLength="3"
                  maxLength="20"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  aria-describedby={formErrors.username ? "username-error" : undefined}
                />
              </div>
              {formErrors.username && (
                <p id="username-error" className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                  {formErrors.username}
                </p>
              )}
            </div>
          )}

          <div>
            <div className="relative">
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
            </div>
            {formErrors.email && (
              <p id="email-error" className="text-red-500 text-sm mt-1 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                {formErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <FontAwesomeIcon 
                icon={faLock} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="password"
                name="password"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                aria-describedby={formErrors.password ? "password-error" : undefined}
              />
            </div>
            {formErrors.password && (
              <p id="password-error" className="text-red-500 text-sm mt-1 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                {formErrors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link (only in login mode) */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors duration-200 flex items-center justify-end w-full"
              >
                <FontAwesomeIcon icon={faKey} className="mr-2" />
                Forgot your password?
              </button>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : messageType === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                  className={`mr-2 ${
                    messageType === 'success' ? 'text-green-500' : 
                    messageType === 'error' ? 'text-red-500' : 'text-blue-500'
                  }`} 
                />
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <span>
                <FontAwesomeIcon 
                  icon={isLogin ? faSignInAlt : faUserPlus} 
                  className="mr-2" 
                />
                {isLogin ? 'Sign In' : 'Create Account'}
              </span>
            )}
          </button>
        </form>

        {/* Server Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> The server may take 30-60 seconds to wake up on first request. Please be patient.
            </p>
          </div>
        </div>

        {/* Toggle between Login/Signup */}
        <div className="text-center mt-6">
          <button
            onClick={toggleMode}
            className="text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200"
          >
            <FontAwesomeIcon 
              icon={isLogin ? faUserPlus : faSignInAlt} 
              className="mr-2" 
            />
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
